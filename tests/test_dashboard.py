from tests.conftest import TEST_USER_ID
"""
Tests for the Dashboard Aggregation Module.

Covers:
    - DashboardService.get_dashboard() with empty transaction store
    - DashboardService.get_dashboard() with real transaction data
    - GET /dashboard endpoint (empty store)
    - GET /dashboard endpoint (with populated store)
"""

import pytest
from datetime import datetime
from fastapi.testclient import TestClient

from backend.app import app
from backend.dashboard_service import DashboardService
from backend.transaction_store import save_transactions, get_transactions
from parsers.schema import Transaction


# ── Fixtures ─────────────────────────────────────────────────────────────────
# Note: store isolation (clear_test_user_data) and UserContext setup are
# handled by the session-scoped `isolate_test_user` autouse fixture in conftest.py.


@pytest.fixture
def sample_transactions():
    """A minimal set of transactions: one credit + two debits."""
    return [
        Transaction(
            transaction_id="t1",
            date=datetime(2025, 1, 10),
            raw_description="Salary January",
            normalized_description="Salary",
            merchant_name="Employer Corp",
            category="Income",
            amount=50000.0,
            transaction_type="Credit",
            balance=50000.0,
            bank_name="Test Bank",
            reference_number="REF001",
        ),
        Transaction(
            transaction_id="t2",
            date=datetime(2025, 1, 15),
            raw_description="Amazon Order",
            normalized_description="Amazon",
            merchant_name="Amazon",
            category="Shopping",
            amount=3500.0,
            transaction_type="Debit",
            balance=46500.0,
            bank_name="Test Bank",
            reference_number="REF002",
        ),
        Transaction(
            transaction_id="t3",
            date=datetime(2025, 1, 20),
            raw_description="Swiggy Food",
            normalized_description="Swiggy",
            merchant_name="Swiggy",
            category="Food & Dining",
            amount=850.0,
            transaction_type="Debit",
            balance=45650.0,
            bank_name="Test Bank",
            reference_number="REF003",
        ),
    ]


# ── Unit tests for DashboardService ──────────────────────────────────────────

class TestDashboardServiceEmptyStore:
    """Tests for get_dashboard() when the transaction store is empty."""

    def test_returns_dict(self):
        service = DashboardService()
        result = service.get_dashboard(TEST_USER_ID)
        assert isinstance(result, dict)

    def test_all_keys_present(self):
        service = DashboardService()
        result = service.get_dashboard(TEST_USER_ID)
        required_keys = {
            "summary",
            "financial_health",
            "budget",
            "analytics",
            "recurring",
            "insights",
            "recent_transactions",
        }
        assert required_keys == set(result.keys())

    def test_summary_zeros(self):
        service = DashboardService()
        result = service.get_dashboard(TEST_USER_ID)
        summary = result["summary"]
        assert summary["total_income"] == 0.0
        assert summary["total_expense"] == 0.0
        assert summary["savings"] == 0.0
        assert summary["transaction_count"] == 0

    def test_collections_are_empty(self):
        service = DashboardService()
        result = service.get_dashboard(TEST_USER_ID)
        assert result["financial_health"] == {}
        assert result["budget"] == {}
        assert result["analytics"] == {}
        assert result["recurring"] == []
        assert result["insights"] == []
        assert result["recent_transactions"] == []

    def test_does_not_raise(self):
        service = DashboardService()
        # Must never throw an exception even with empty store
        try:
            service.get_dashboard(TEST_USER_ID)
        except Exception as exc:
            pytest.fail(f"get_dashboard() raised an exception: {exc}")


class TestDashboardServiceWithData:
    """Tests for get_dashboard() when the store contains transactions."""

    def test_summary_correct(self, sample_transactions):
        save_transactions(TEST_USER_ID, sample_transactions)
        service = DashboardService()
        result = service.get_dashboard(TEST_USER_ID)
        summary = result["summary"]

        assert summary["total_income"] == 50000.0
        assert summary["total_expense"] == 4350.0   # 3500 + 850
        assert summary["savings"] == pytest.approx(45650.0)
        assert summary["transaction_count"] == 3

    def test_financial_health_keys(self, sample_transactions):
        save_transactions(TEST_USER_ID, sample_transactions)
        service = DashboardService()
        result = service.get_dashboard(TEST_USER_ID)
        fh = result["financial_health"]

        assert "score" in fh
        assert "grade" in fh
        assert "status" in fh
        assert "income" in fh
        assert "expense" in fh
        assert "savings" in fh
        assert "category_totals" in fh

    def test_financial_health_grade_valid(self, sample_transactions):
        save_transactions(TEST_USER_ID, sample_transactions)
        service = DashboardService()
        result = service.get_dashboard(TEST_USER_ID)
        assert result["financial_health"]["grade"] in {"A", "B", "C", "D", "F"}

    def test_financial_health_status_valid(self, sample_transactions):
        save_transactions(TEST_USER_ID, sample_transactions)
        service = DashboardService()
        result = service.get_dashboard(TEST_USER_ID)
        assert result["financial_health"]["status"] in {
            "Excellent", "Good", "Fair", "Poor", "Critical"
        }

    def test_budget_is_list(self, sample_transactions):
        save_transactions(TEST_USER_ID, sample_transactions)
        service = DashboardService()
        result = service.get_dashboard(TEST_USER_ID)
        assert isinstance(result["budget"], list)

    def test_budget_item_shape(self, sample_transactions):
        save_transactions(TEST_USER_ID, sample_transactions)
        service = DashboardService()
        result = service.get_dashboard(TEST_USER_ID)
        for item in result["budget"]:
            assert "category" in item
            assert "spent" in item
            assert "budget" in item
            assert "percentage" in item
            assert "remaining" in item
            assert "status" in item

    def test_analytics_structure(self, sample_transactions):
        save_transactions(TEST_USER_ID, sample_transactions)
        service = DashboardService()
        result = service.get_dashboard(TEST_USER_ID)
        analytics = result["analytics"]
        assert "spending" in analytics
        assert "total_expense" in analytics["spending"]
        assert "by_category" in analytics["spending"]

    def test_recurring_is_list(self, sample_transactions):
        save_transactions(TEST_USER_ID, sample_transactions)
        service = DashboardService()
        result = service.get_dashboard(TEST_USER_ID)
        # With only 1 transaction per merchant, recurring will be empty
        assert isinstance(result["recurring"], list)

    def test_insights_is_list(self, sample_transactions):
        save_transactions(TEST_USER_ID, sample_transactions)
        service = DashboardService()
        result = service.get_dashboard(TEST_USER_ID)
        assert isinstance(result["insights"], list)
        assert len(result["insights"]) > 0

    def test_recent_transactions_max_10(self, sample_transactions):
        save_transactions(TEST_USER_ID, sample_transactions)
        service = DashboardService()
        result = service.get_dashboard(TEST_USER_ID)
        assert len(result["recent_transactions"]) <= 10

    def test_recent_transactions_sorted_desc(self, sample_transactions):
        save_transactions(TEST_USER_ID, sample_transactions)
        service = DashboardService()
        result = service.get_dashboard(TEST_USER_ID)
        dates = [t["date"] for t in result["recent_transactions"]]
        assert dates == sorted(dates, reverse=True)

    def test_recent_transaction_shape(self, sample_transactions):
        save_transactions(TEST_USER_ID, sample_transactions)
        service = DashboardService()
        result = service.get_dashboard(TEST_USER_ID)
        for txn in result["recent_transactions"]:
            assert "date" in txn
            assert "merchant" in txn
            assert "amount" in txn
            assert "category" in txn
            assert "transaction_type" in txn
            assert "description" in txn

    def test_no_duplicate_calculation(self, sample_transactions):
        """
        Verify that summary income/expense matches financial_health income/expense.
        This confirms calculate_financial_health() is used as the single source
        of truth — no duplicate arithmetic.
        """
        save_transactions(TEST_USER_ID, sample_transactions)
        service = DashboardService()
        result = service.get_dashboard(TEST_USER_ID)

        assert result["summary"]["total_income"] == result["financial_health"]["income"]
        assert result["summary"]["total_expense"] == result["financial_health"]["expense"]
        assert result["summary"]["savings"] == result["financial_health"]["savings"]


# ── Integration tests for GET /dashboard ────────────────────────────────────

class TestDashboardEndpoint:
    """HTTP integration tests for GET /dashboard."""

    def test_returns_200_empty_store(self, auth_client):
        response = auth_client.get("/dashboard")
        assert response.status_code == 200

    def test_empty_store_response_shape(self, auth_client):
        response = auth_client.get("/dashboard")
        body = response.json()
        for key in ["summary", "financial_health", "budget", "analytics",
                    "recurring", "insights", "recent_transactions"]:
            assert key in body, f"Missing key: {key}"

    def test_empty_store_summary_zeros(self, auth_client):
        response = auth_client.get("/dashboard")
        summary = response.json()["summary"]
        assert summary["total_income"] == 0.0
        assert summary["total_expense"] == 0.0
        assert summary["savings"] == 0.0
        assert summary["transaction_count"] == 0

    def test_with_data_returns_populated_response(self, auth_client, sample_transactions):
        save_transactions(TEST_USER_ID, sample_transactions)
        response = auth_client.get("/dashboard")
        assert response.status_code == 200
        body = response.json()

        assert body["summary"]["total_income"] == 50000.0
        assert body["summary"]["transaction_count"] == 3
        assert len(body["recent_transactions"]) == 3
        assert len(body["insights"]) > 0

    def test_endpoint_returns_list_for_recurring(self, auth_client, sample_transactions):
        save_transactions(TEST_USER_ID, sample_transactions)
        response = auth_client.get("/dashboard")
        assert isinstance(response.json()["recurring"], list)

    def test_endpoint_returns_list_for_budget(self, auth_client, sample_transactions):
        save_transactions(TEST_USER_ID, sample_transactions)
        response = auth_client.get("/dashboard")
        assert isinstance(response.json()["budget"], list)

    def test_recent_transactions_is_list(self, auth_client, sample_transactions):
        save_transactions(TEST_USER_ID, sample_transactions)
        response = auth_client.get("/dashboard")
        assert isinstance(response.json()["recent_transactions"], list)
