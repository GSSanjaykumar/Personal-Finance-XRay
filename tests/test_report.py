"""
Tests for the AI Financial Report Generator.

Coverage:
  - ReportBuilder with empty data dict
  - ReportBuilder with full real data
  - PDF header / Content-Type validation
  - PDF file-size sanity check (non-empty)
  - Correct filename format in Content-Disposition
  - GET /report endpoint — 200 + application/pdf
  - GET /report endpoint — empty transaction store
  - GET /report endpoint — large dataset
  - ReportService orchestration
"""

import re
import pytest
from datetime import date, datetime
from fastapi.testclient import TestClient

from backend.app import app
from analytics.report_builder import ReportBuilder
from backend.report_service import ReportService
from backend.transaction_store import save_transactions
from backend.budget_store import save_budget, DEFAULT_BUDGET
from parsers.schema import Transaction

# ── Shared test client ────────────────────────────────────────────────────────

client = TestClient(app)

# ── Helpers ───────────────────────────────────────────────────────────────────

def make_transaction(
    txn_id, dt: date, amount: float, txn_type: str,
    merchant: str = "TestMerchant", category: str = "Shopping"
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


SAMPLE_TXNS = [
    make_transaction(1, date(2025, 1, 5),  50000.0, "Credit", "Employer", "Income"),
    make_transaction(2, date(2025, 1, 10),  3500.0, "Debit",  "Amazon",   "Shopping"),
    make_transaction(3, date(2025, 1, 12),   850.0, "Debit",  "Swiggy",   "Food & Dining"),
    make_transaction(4, date(2025, 1, 15),  2000.0, "Debit",  "Uber",     "Transport"),
    make_transaction(5, date(2025, 1, 18),  1200.0, "Debit",  "Netflix",  "Bills"),
]


@pytest.fixture(autouse=True)
def reset_stores():
    save_transactions([])
    save_budget(DEFAULT_BUDGET.copy())
    yield
    save_transactions([])
    save_budget(DEFAULT_BUDGET.copy())


# ── Minimal data dict for unit tests (bypasses service layer) ─────────────────

EMPTY_DATA = {
    "summary": {"total_income": 0.0, "total_expense": 0.0,
                "savings": 0.0, "transaction_count": 0},
    "financial_health": {},
    "budget": [],
    "analytics": {},
    "recurring": [],
    "insights": [],
    "recent_transactions": [],
    "forecast_data": {
        "current_month": {"income": 0.0, "expense": 0.0,
                          "days_elapsed": 0, "days_remaining": 0},
        "forecast": {"projected_month_end_expense": 0.0,
                     "projected_savings": 0.0,
                     "expected_recurring_remaining": 0.0,
                     "remaining_budget": 0.0,
                     "budget_risk": "Low"},
        "daily_average": 0.0,
        "cashflow_prediction": 0.0,
    },
}

FULL_DATA = {
    "summary": {"total_income": 50000.0, "total_expense": 7550.0,
                "savings": 42450.0, "transaction_count": 5},
    "financial_health": {"score": 82, "grade": "B", "status": "Good",
                         "income": 50000.0, "expense": 7550.0, "savings": 42450.0,
                         "category_totals": {
                             "Income": 50000.0, "Shopping": 3500.0,
                             "Food & Dining": 850.0, "Transport": 2000.0, "Bills": 1200.0
                         }},
    "budget": [
        {"category": "Shopping",    "spent": 3500,  "budget": 15000,
         "percentage": 23.3, "remaining": 11500, "status": "Within Budget"},
        {"category": "Food & Dining","spent": 850,   "budget": 10000,
         "percentage": 8.5,  "remaining": 9150,  "status": "Within Budget"},
        {"category": "Transport",   "spent": 2000,  "budget": 8000,
         "percentage": 25.0, "remaining": 6000,  "status": "Within Budget"},
    ],
    "analytics": {"spending": {
        "total_expense": 7550.0,
        "by_category": {"Shopping": 3500, "Food & Dining": 850,
                        "Transport": 2000, "Bills": 1200},
    }},
    "recurring": [
        {"merchant": "Netflix", "frequency": "monthly",
         "average_amount": 1200.0, "confidence": 0.95,
         "next_expected": "2025-02-12", "count": 5,
         "first_seen": "2024-09-12", "last_seen": "2025-01-12"},
    ],
    "insights": [
        {"icon": "💰", "title": "Savings Rate",
         "value": "84.9%",
         "description": "Excellent savings rate this month."},
        {"icon": "📊", "title": "Top Expense",
         "value": "Shopping",
         "description": "Your largest spending category."},
    ],
    "recent_transactions": [
        {"date": "2025-01-18", "merchant": "Netflix",  "category": "Bills",
         "amount": 1200.0, "transaction_type": "Debit",  "description": "Netflix"},
        {"date": "2025-01-15", "merchant": "Uber",     "category": "Transport",
         "amount": 2000.0, "transaction_type": "Debit",  "description": "Uber"},
        {"date": "2025-01-10", "merchant": "Amazon",   "category": "Shopping",
         "amount": 3500.0, "transaction_type": "Debit",  "description": "Amazon"},
        {"date": "2025-01-05", "merchant": "Employer", "category": "Income",
         "amount": 50000.0, "transaction_type": "Credit", "description": "Salary"},
    ],
    "forecast_data": {
        "current_month": {"income": 50000.0, "expense": 7550.0,
                          "days_elapsed": 18, "days_remaining": 13},
        "forecast": {"projected_month_end_expense": 13013.9,
                     "projected_savings": 35786.1,
                     "expected_recurring_remaining": 0.0,
                     "remaining_budget": 47450.0,
                     "budget_risk": "Low"},
        "daily_average": 419.4,
        "cashflow_prediction": 35786.1,
    },
}


# ── Unit tests: ReportBuilder ─────────────────────────────────────────────────

class TestReportBuilderEmpty:
    """ReportBuilder must not crash on empty data."""

    def test_returns_bytes(self):
        builder = ReportBuilder(EMPTY_DATA)
        result = builder.build()
        assert isinstance(result, bytes)

    def test_non_empty_bytes(self):
        builder = ReportBuilder(EMPTY_DATA)
        result = builder.build()
        assert len(result) > 1000

    def test_is_valid_pdf_magic_bytes(self):
        """PDF files must start with %PDF-"""
        builder = ReportBuilder(EMPTY_DATA)
        result = builder.build()
        assert result[:5] == b"%PDF-"

    def test_does_not_raise(self):
        builder = ReportBuilder(EMPTY_DATA)
        try:
            builder.build()
        except Exception as exc:
            pytest.fail(f"ReportBuilder raised: {exc}")


class TestReportBuilderFull:
    """ReportBuilder with realistic populated data."""

    def test_returns_bytes(self):
        builder = ReportBuilder(FULL_DATA)
        result = builder.build()
        assert isinstance(result, bytes)

    def test_non_empty_bytes(self):
        builder = ReportBuilder(FULL_DATA)
        result = builder.build()
        assert len(result) > 5000

    def test_is_valid_pdf(self):
        builder = ReportBuilder(FULL_DATA)
        result = builder.build()
        assert result[:5] == b"%PDF-"

    def test_eof_marker_present(self):
        """PDF files must end with %%EOF"""
        builder = ReportBuilder(FULL_DATA)
        result = builder.build()
        assert b"%%EOF" in result

    def test_larger_than_empty(self):
        """Full-data PDF should be larger than empty-data PDF (charts etc.)"""
        empty_pdf = ReportBuilder(EMPTY_DATA).build()
        full_pdf  = ReportBuilder(FULL_DATA).build()
        assert len(full_pdf) > len(empty_pdf)

    def test_does_not_raise(self):
        builder = ReportBuilder(FULL_DATA)
        try:
            builder.build()
        except Exception as exc:
            pytest.fail(f"ReportBuilder raised: {exc}")


class TestReportBuilderNegativeSavings:
    """PDF must generate correctly when savings are negative."""

    def test_negative_savings_does_not_crash(self):
        data = dict(FULL_DATA)
        data["summary"] = {**data["summary"], "savings": -5000.0}
        data["financial_health"] = {**data["financial_health"], "savings": -5000.0}
        builder = ReportBuilder(data)
        try:
            result = builder.build()
            assert result[:5] == b"%PDF-"
        except Exception as exc:
            pytest.fail(f"Negative savings raised: {exc}")


class TestReportBuilderEdgeCases:
    """Edge cases: single transaction, no recurring, no insights."""

    def test_no_recurring_no_insights(self):
        data = dict(FULL_DATA)
        data["recurring"] = []
        data["insights"]  = []
        builder = ReportBuilder(data)
        result = builder.build()
        assert result[:5] == b"%PDF-"

    def test_high_budget_risk(self):
        data = dict(FULL_DATA)
        data["forecast_data"]["forecast"]["budget_risk"] = "High"
        builder = ReportBuilder(data)
        result = builder.build()
        assert result[:5] == b"%PDF-"

    def test_all_grades(self):
        for grade, status in [("A", "Excellent"), ("B", "Good"), ("C", "Fair"),
                               ("D", "Poor"), ("F", "Critical")]:
            data = dict(FULL_DATA)
            data["financial_health"] = {**data["financial_health"],
                                        "grade": grade, "status": status}
            builder = ReportBuilder(data)
            result = builder.build()
            assert result[:5] == b"%PDF-", f"Failed for grade {grade}"


# ── ReportService unit tests ──────────────────────────────────────────────────

class TestReportService:
    def test_empty_store_returns_bytes(self):
        rs = ReportService()
        result = rs.generate_pdf()
        assert isinstance(result, bytes)

    def test_empty_store_valid_pdf(self):
        rs = ReportService()
        result = rs.generate_pdf()
        assert result[:5] == b"%PDF-"

    def test_does_not_raise_empty(self):
        rs = ReportService()
        try:
            rs.generate_pdf()
        except Exception as exc:
            pytest.fail(f"ReportService.generate_pdf() raised: {exc}")

    def test_with_transactions(self):
        save_transactions(SAMPLE_TXNS)
        rs = ReportService()
        result = rs.generate_pdf()
        assert result[:5] == b"%PDF-"
        assert len(result) > 5000

    def test_larger_with_data_than_without(self):
        empty_pdf = ReportService().generate_pdf()
        save_transactions(SAMPLE_TXNS)
        full_pdf = ReportService().generate_pdf()
        assert len(full_pdf) >= len(empty_pdf)


# ── Integration tests: GET /report endpoint ───────────────────────────────────

class TestReportEndpoint:
    def test_returns_200_empty_store(self):
        response = client.get("/report")
        assert response.status_code == 200

    def test_content_type_pdf(self):
        response = client.get("/report")
        assert response.headers["content-type"] == "application/pdf"

    def test_content_disposition_attachment(self):
        response = client.get("/report")
        cd = response.headers.get("content-disposition", "")
        assert "attachment" in cd

    def test_filename_format(self):
        """Filename must be Financial_Report_YYYY-MM-DD.pdf"""
        response = client.get("/report")
        cd = response.headers.get("content-disposition", "")
        today = date.today().isoformat()
        assert f"Financial_Report_{today}.pdf" in cd

    def test_response_is_valid_pdf(self):
        response = client.get("/report")
        assert response.content[:5] == b"%PDF-"

    def test_eof_marker(self):
        response = client.get("/report")
        assert b"%%EOF" in response.content

    def test_content_length_header(self):
        response = client.get("/report")
        # content-length should match actual bytes
        clen = int(response.headers.get("content-length", 0))
        assert clen == len(response.content)

    def test_with_transactions(self):
        save_transactions(SAMPLE_TXNS)
        response = client.get("/report")
        assert response.status_code == 200
        assert response.content[:5] == b"%PDF-"

    def test_format_query_param_ignored_gracefully(self):
        """format=pdf is the default; any value still returns PDF."""
        response = client.get("/report?format=pdf")
        assert response.status_code == 200
        assert response.content[:5] == b"%PDF-"

    def test_large_dataset(self):
        """PDF generation must succeed with 200 transactions."""
        txns = [
            make_transaction(i, date(2025, 1, min(i % 28 + 1, 28)),
                             float(100 + i * 10), "Debit",
                             f"Merchant{i % 15}", "Shopping")
            for i in range(1, 201)
        ]
        txns.append(make_transaction(999, date(2025, 1, 1),
                                     100000.0, "Credit", "Employer", "Income"))
        save_transactions(txns)

        response = client.get("/report")
        assert response.status_code == 200
        assert response.content[:5] == b"%PDF-"
        assert len(response.content) > 10000
