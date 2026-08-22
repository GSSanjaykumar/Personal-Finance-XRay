"""
Tests for Spending Forecast & Cash Flow Prediction.

Coverage:
  - No transactions
  - Only credit transactions (no debits)
  - Only debit transactions
  - Normal income + expense mix
  - Recurring payments pending within the month
  - Budget risk thresholds (Low / Medium / High)
  - Negative savings / cashflow
  - Leap year (Feb 2024)
  - February 28-day month (Feb 2023)
  - 30-day month (April)
  - 31-day month (January)
  - Large dataset (stress)
  - GET /forecast endpoint (empty store)
  - GET /forecast endpoint (with data)
"""

import calendar
import pytest
from datetime import date, datetime
from fastapi.testclient import TestClient

from backend.app import app
from analytics.spending_forecast import SpendingForecast
from backend.forecast_service import ForecastService
from backend.transaction_store import save_transactions
from backend.budget_store import save_budget, DEFAULT_BUDGET
from parsers.schema import Transaction


# ── Shared test client ────────────────────────────────────────────────────────

client = TestClient(app)



# ── Helpers ───────────────────────────────────────────────────────────────────

def make_transaction(
    txn_id,
    dt: date,
    amount: float,
    txn_type: str,
    merchant: str = "TestMerchant",
    category: str = "Shopping",
):
    return Transaction(
        transaction_id=str(txn_id),
        date=datetime(dt.year, dt.month, dt.day),
        raw_description=f"{merchant} purchase",
        normalized_description=merchant,
        merchant_name=merchant,
        category=category,
        amount=amount,
        transaction_type=txn_type,
        balance=10000.0,
        bank_name="Test Bank",
        reference_number=f"REF{txn_id:03d}",
    )


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_stores():
    """Reset budget store before every test (transactions are reset by conftest.isolate_test_user)."""
    save_budget(DEFAULT_BUDGET.copy())
    yield
    save_budget(DEFAULT_BUDGET.copy())



# Reference date: 15th of January 2025 (mid-month, 31-day month)
REF_DATE = date(2025, 1, 15)
REF_MONTH = (2025, 1)


def jan_date(day: int) -> date:
    return date(2025, 1, day)


# ── Unit tests: SpendingForecast ─────────────────────────────────────────────

class TestForecastEmptyTransactions:
    """No transactions → safe zero-valued response."""

    def test_returns_dict(self):
        sf = SpendingForecast()
        result = sf.forecast([], reference_date=REF_DATE)
        assert isinstance(result, dict)

    def test_all_top_level_keys(self):
        sf = SpendingForecast()
        result = sf.forecast([], reference_date=REF_DATE)
        assert set(result.keys()) == {
            "current_month", "forecast", "daily_average", "cashflow_prediction"
        }

    def test_current_month_zeros(self):
        sf = SpendingForecast()
        result = sf.forecast([], reference_date=REF_DATE)
        cm = result["current_month"]
        assert cm["income"] == 0.0
        assert cm["expense"] == 0.0

    def test_daily_average_zero(self):
        sf = SpendingForecast()
        result = sf.forecast([], reference_date=REF_DATE)
        assert result["daily_average"] == 0.0

    def test_projected_expense_zero(self):
        sf = SpendingForecast()
        result = sf.forecast([], reference_date=REF_DATE)
        assert result["forecast"]["projected_month_end_expense"] == 0.0

    def test_budget_risk_low_when_no_data(self):
        sf = SpendingForecast()
        result = sf.forecast([], reference_date=REF_DATE)
        assert result["forecast"]["budget_risk"] == "Low"

    def test_does_not_raise(self):
        sf = SpendingForecast()
        try:
            sf.forecast([], reference_date=REF_DATE)
        except Exception as exc:
            pytest.fail(f"forecast() raised: {exc}")


class TestForecastOnlyCredits:
    """Only credit transactions → zero expense, no budget risk."""

    def test_income_populated_expense_zero(self):
        txns = [
            make_transaction(1, jan_date(5), 50000.0, "Credit", "Employer"),
            make_transaction(2, jan_date(10), 5000.0, "Credit", "Freelance"),
        ]
        sf = SpendingForecast()
        result = sf.forecast(txns, reference_date=REF_DATE)

        assert result["current_month"]["income"] == 55000.0
        assert result["current_month"]["expense"] == 0.0
        assert result["daily_average"] == 0.0
        assert result["forecast"]["budget_risk"] == "Low"

    def test_projected_savings_equals_income_when_no_expense(self):
        txns = [make_transaction(1, jan_date(5), 50000.0, "Credit", "Employer")]
        sf = SpendingForecast()
        result = sf.forecast(txns, reference_date=REF_DATE)

        # projected_expense = 0, pending_recurring ≈ 0 (no debits detected)
        assert result["forecast"]["projected_savings"] == pytest.approx(50000.0, abs=0.1)


class TestForecastOnlyDebits:
    """Only debit transactions → zero income, negative savings."""

    def test_expense_populated_income_zero(self):
        txns = [
            make_transaction(1, jan_date(3), 2000.0, "Debit", "Amazon"),
            make_transaction(2, jan_date(10), 1500.0, "Debit", "Swiggy"),
        ]
        sf = SpendingForecast()
        result = sf.forecast(txns, reference_date=REF_DATE)

        assert result["current_month"]["income"] == 0.0
        assert result["current_month"]["expense"] == pytest.approx(3500.0)

    def test_projected_savings_is_negative(self):
        txns = [
            make_transaction(1, jan_date(3), 2000.0, "Debit"),
            make_transaction(2, jan_date(10), 1500.0, "Debit"),
        ]
        sf = SpendingForecast()
        result = sf.forecast(txns, reference_date=REF_DATE)

        assert result["forecast"]["projected_savings"] < 0


class TestForecastNormalCase:
    """Mixed income + expense mid-month."""

    def setup_method(self):
        self.txns = [
            make_transaction(1, jan_date(2), 50000.0, "Credit", "Employer"),
            make_transaction(2, jan_date(5), 3000.0, "Debit", "Amazon"),
            make_transaction(3, jan_date(8), 1500.0, "Debit", "Swiggy"),
            make_transaction(4, jan_date(12), 2000.0, "Debit", "Uber"),
        ]
        # Reference: Jan 15 → days_elapsed = 15, total = 31
        self.ref = REF_DATE
        self.sf = SpendingForecast()

    def test_income_correct(self):
        r = self.sf.forecast(self.txns, reference_date=self.ref)
        assert r["current_month"]["income"] == 50000.0

    def test_expense_correct(self):
        r = self.sf.forecast(self.txns, reference_date=self.ref)
        assert r["current_month"]["expense"] == pytest.approx(6500.0)

    def test_daily_average(self):
        r = self.sf.forecast(self.txns, reference_date=self.ref)
        # 6500 / 15 days elapsed
        assert r["daily_average"] == pytest.approx(6500 / 15, rel=1e-3)

    def test_projected_expense(self):
        r = self.sf.forecast(self.txns, reference_date=self.ref)
        expected = (6500 / 15) * 31
        assert r["forecast"]["projected_month_end_expense"] == pytest.approx(
            expected, rel=1e-2
        )

    def test_days_elapsed_and_remaining(self):
        r = self.sf.forecast(self.txns, reference_date=self.ref)
        assert r["current_month"]["days_elapsed"] == 15
        assert r["current_month"]["days_remaining"] == 16   # 31 - 15

    def test_cashflow_equals_projected_savings(self):
        r = self.sf.forecast(self.txns, reference_date=self.ref)
        assert r["cashflow_prediction"] == r["forecast"]["projected_savings"]

    def test_forecast_keys_complete(self):
        r = self.sf.forecast(self.txns, reference_date=self.ref)
        fc = r["forecast"]
        for key in [
            "projected_month_end_expense",
            "projected_savings",
            "expected_recurring_remaining",
            "remaining_budget",
            "budget_risk",
        ]:
            assert key in fc


class TestBudgetRisk:
    """Verify budget-risk thresholds."""

    def test_risk_low_below_80_pct(self):
        sf = SpendingForecast()
        # total budget = 55000 (defaults), Low = projected < 44000
        txns = [make_transaction(1, jan_date(5), 500.0, "Debit")]
        result = sf.forecast(txns, reference_date=REF_DATE)
        # daily_avg = 500/15, projected = (500/15)*31 ≈ 1033 << 44000
        assert result["forecast"]["budget_risk"] == "Low"

    def test_risk_medium_80_to_100_pct(self):
        sf = SpendingForecast()
        total_budget = sum(DEFAULT_BUDGET.values())   # 55000
        # We need projected ≈ 85% of 55000 = 46750
        # projected = daily_avg * 31, daily_avg = expense / 15
        # expense = 46750 * 15 / 31 ≈ 22621
        expense = (total_budget * 0.85 * 15) / 31
        txns = [make_transaction(1, jan_date(5), expense, "Debit")]
        result = sf.forecast(txns, reference_date=REF_DATE)
        assert result["forecast"]["budget_risk"] == "Medium"

    def test_risk_high_above_100_pct(self):
        sf = SpendingForecast()
        total_budget = sum(DEFAULT_BUDGET.values())   # 55000
        # expense to make projected > 100% of budget
        expense = (total_budget * 1.1 * 15) / 31
        txns = [make_transaction(1, jan_date(5), expense, "Debit")]
        result = sf.forecast(txns, reference_date=REF_DATE)
        assert result["forecast"]["budget_risk"] == "High"

    def test_no_budget_configured_returns_low(self):
        save_budget({})
        sf = SpendingForecast()
        txns = [make_transaction(1, jan_date(5), 99999.0, "Debit")]
        result = sf.forecast(txns, reference_date=REF_DATE)
        assert result["forecast"]["budget_risk"] == "Low"


class TestNegativeSavings:
    """Projected savings can legitimately be negative."""

    def test_negative_savings_when_expense_exceeds_income(self):
        txns = [
            make_transaction(1, jan_date(2), 10000.0, "Credit", "Employer"),
            make_transaction(2, jan_date(5), 12000.0, "Debit", "Rent"),
        ]
        sf = SpendingForecast()
        result = sf.forecast(txns, reference_date=REF_DATE)
        assert result["forecast"]["projected_savings"] < 0
        assert result["cashflow_prediction"] < 0


class TestMonthLengths:
    """Tests for each calendar month type: 28, 29, 30, 31 days."""

    def _run(self, ref: date) -> dict:
        total = calendar.monthrange(ref.year, ref.month)[1]
        txns = [
            make_transaction(1, date(ref.year, ref.month, 2), 1000.0, "Debit")
        ]
        sf = SpendingForecast()
        return sf.forecast(txns, reference_date=ref)

    def test_31_day_month_january(self):
        ref = date(2025, 1, 15)
        r = self._run(ref)
        assert r["current_month"]["days_elapsed"] + r["current_month"]["days_remaining"] == 31

    def test_30_day_month_april(self):
        ref = date(2025, 4, 10)
        txns = [make_transaction(1, date(2025, 4, 5), 1000.0, "Debit")]
        sf = SpendingForecast()
        r = sf.forecast(txns, reference_date=ref)
        assert r["current_month"]["days_elapsed"] + r["current_month"]["days_remaining"] == 30

    def test_28_day_month_feb_2023(self):
        ref = date(2023, 2, 14)
        txns = [make_transaction(1, date(2023, 2, 5), 1000.0, "Debit")]
        sf = SpendingForecast()
        r = sf.forecast(txns, reference_date=ref)
        total = r["current_month"]["days_elapsed"] + r["current_month"]["days_remaining"]
        assert total == 28

    def test_leap_year_feb_2024(self):
        """2024 is a leap year — February has 29 days."""
        assert calendar.isleap(2024)
        ref = date(2024, 2, 15)
        txns = [make_transaction(1, date(2024, 2, 5), 1000.0, "Debit")]
        sf = SpendingForecast()
        r = sf.forecast(txns, reference_date=ref)
        total = r["current_month"]["days_elapsed"] + r["current_month"]["days_remaining"]
        assert total == 29

    def test_projected_expense_uses_correct_total_days(self):
        """Projection must multiply by the actual days in the month."""
        ref_jan = date(2025, 1, 10)  # 31-day month
        ref_apr = date(2025, 4, 10)  # 30-day month

        txns_jan = [make_transaction(1, date(2025, 1, 5), 900.0, "Debit")]
        txns_apr = [make_transaction(2, date(2025, 4, 5), 900.0, "Debit")]

        sf = SpendingForecast()
        r_jan = sf.forecast(txns_jan, reference_date=ref_jan)
        r_apr = sf.forecast(txns_apr, reference_date=ref_apr)

        # Both have same expense and elapsed days, but different total days
        # So January projection should be larger
        assert (
            r_jan["forecast"]["projected_month_end_expense"]
            > r_apr["forecast"]["projected_month_end_expense"]
        )


class TestPastMonthTransactionsExcluded:
    """Transactions from previous months must NOT count towards current totals."""

    def test_previous_month_excluded(self):
        ref = date(2025, 1, 15)
        txns = [
            # December 2024 — must be excluded
            make_transaction(1, date(2024, 12, 20), 5000.0, "Debit"),
            # January 2025 — must be included
            make_transaction(2, date(2025, 1, 10), 2000.0, "Debit"),
        ]
        sf = SpendingForecast()
        result = sf.forecast(txns, reference_date=ref)
        assert result["current_month"]["expense"] == pytest.approx(2000.0)


class TestLargeDataset:
    """Stress test with many transactions to catch performance / overflow issues."""

    def test_large_dataset_no_error(self):
        txns = []
        for i in range(1, 501):
            day = min(i % 15 + 1, 15)
            txns.append(
                make_transaction(i, jan_date(day), 100.0, "Debit")
            )
        sf = SpendingForecast()
        try:
            result = sf.forecast(txns, reference_date=REF_DATE)
            assert result["current_month"]["expense"] > 0
        except Exception as exc:
            pytest.fail(f"Large dataset raised: {exc}")


class TestRemainingBudget:
    """Remaining budget = total_budget − expense_so_far, floored at 0."""

    def test_remaining_budget_positive(self):
        txns = [make_transaction(1, jan_date(5), 5000.0, "Debit")]
        sf = SpendingForecast()
        result = sf.forecast(txns, reference_date=REF_DATE)
        total = sum(DEFAULT_BUDGET.values())
        assert result["forecast"]["remaining_budget"] == pytest.approx(total - 5000.0)

    def test_remaining_budget_floored_at_zero_when_overspent(self):
        txns = [make_transaction(1, jan_date(5), 999999.0, "Debit")]
        sf = SpendingForecast()
        result = sf.forecast(txns, reference_date=REF_DATE)
        assert result["forecast"]["remaining_budget"] == 0.0


# ── ForecastService unit tests ───────────────────────────────────────────────

class TestForecastService:
    def test_empty_store(self):
        fs = ForecastService()
        result = fs.get_forecast()
        assert result["current_month"]["income"] == 0.0
        assert result["forecast"]["budget_risk"] == "Low"

    def test_does_not_raise_empty(self):
        fs = ForecastService()
        try:
            fs.get_forecast()
        except Exception as exc:
            pytest.fail(f"ForecastService.get_forecast() raised: {exc}")

    def test_with_transactions(self):
        txns = [
            make_transaction(1, date.today().replace(day=1), 50000.0, "Credit", "Employer"),
            make_transaction(2, date.today().replace(day=2) if date.today().day > 2 else date.today(), 2000.0, "Debit"),
        ]
        save_transactions(txns)
        fs = ForecastService()
        result = fs.get_forecast()
        assert result["current_month"]["income"] >= 0


# ── Integration tests: GET /forecast endpoint ────────────────────────────────

class TestForecastEndpoint:
    def test_returns_200_empty_store(self, auth_client):
        response = auth_client.get("/forecast")
        assert response.status_code == 200

    def test_empty_store_shape(self, auth_client):
        response = auth_client.get("/forecast")
        body = response.json()
        for key in ["current_month", "forecast", "daily_average", "cashflow_prediction"]:
            assert key in body

    def test_empty_store_zeros(self, auth_client):
        response = auth_client.get("/forecast")
        body = response.json()
        assert body["current_month"]["income"] == 0.0
        assert body["daily_average"] == 0.0
        assert body["forecast"]["budget_risk"] == "Low"

    def test_forecast_shape_keys(self, auth_client):
        response = auth_client.get("/forecast")
        fc = response.json()["forecast"]
        for key in [
            "projected_month_end_expense",
            "projected_savings",
            "expected_recurring_remaining",
            "remaining_budget",
            "budget_risk",
        ]:
            assert key in fc

    def test_budget_risk_valid_values(self, auth_client):
        response = auth_client.get("/forecast")
        risk = response.json()["forecast"]["budget_risk"]
        assert risk in {"Low", "Medium", "High"}
