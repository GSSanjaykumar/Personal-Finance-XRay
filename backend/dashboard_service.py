"""
Dashboard Aggregation Service
==============================
Aggregates all existing service modules into a single dashboard response.
Never duplicates business logic — always reuses existing functions.
"""

from backend.transaction_store import get_transactions
from backend.analytics import calculate_financial_health
from backend.budget import analyze_budget
from backend.budget_insights import generate_budget_insights
from backend.insight_generator import InsightGenerator
from analytics.recurring_detector import RecurringDetector
from analytics.spending_analyzer import SpendingAnalyzer
from analytics.category_statistics import CategoryStatistics


class DashboardService:
    """
    Aggregates data from all existing services into one dashboard payload.

    Design Principles:
    - calculate_financial_health() is called ONCE; its result is reused
      by summary, financial_health, budget analysis, and insights.
    - No business logic is re-implemented here.
    - Never raises exceptions — returns empty structure if store is empty.
    """

    def __init__(self):
        self._insight_generator = InsightGenerator()
        self._recurring_detector = RecurringDetector()
        self._spending_analyzer = SpendingAnalyzer()
        self._category_statistics = CategoryStatistics()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_dashboard(self) -> dict:
        """
        Returns a fully aggregated dashboard dictionary.

        Structure:
            {
                "summary":              { total_income, total_expense, savings, transaction_count },
                "financial_health":     { score, grade, status, income, expense, savings, category_totals },
                "budget":               [ { category, spent, budget, percentage, remaining, status }, ... ],
                "analytics":            { spending: { total_expense, by_category }, category_summary },
                "recurring":            [ { merchant, frequency, average_amount, confidence, ... }, ... ],
                "insights":             [ { title, icon, value, description }, ... ],
                "recent_transactions":  [ { date, merchant, amount, category, transaction_type, description }, ... ]
            }
        """
        transactions = get_transactions()

        if not transactions:
            return self._empty_response()

        # ── Single call to financial health — result reused below ──────
        health = calculate_financial_health(transactions)

        # ── Summary block (reuses health values — no duplicate math) ───
        summary = self._build_summary(health, transactions)

        # ── Financial health block ──────────────────────────────────────
        financial_health = self._build_financial_health(health)

        # ── Budget block (reuses category_totals from health) ──────────
        budget = analyze_budget(health["category_totals"])

        # ── Analytics block ─────────────────────────────────────────────
        analytics = self._build_analytics(transactions)

        # ── Recurring payments ──────────────────────────────────────────
        recurring = self._recurring_detector.detect(transactions)

        # ── AI Insights (reuses health dict already computed) ───────────
        insights = self._insight_generator.generate(health)

        # ── Recent transactions (latest 10, desc by date) ───────────────
        recent_transactions = self._build_recent_transactions(transactions)

        return {
            "summary": summary,
            "financial_health": financial_health,
            "budget": budget,
            "analytics": analytics,
            "recurring": recurring,
            "insights": insights,
            "recent_transactions": recent_transactions,
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_summary(self, health: dict, transactions: list) -> dict:
        """
        Builds the summary block from already-computed health values.
        Does NOT re-iterate transactions for income/expense totals.
        """
        return {
            "total_income": health["income"],
            "total_expense": health["expense"],
            "savings": health["savings"],
            "transaction_count": len(transactions),
        }

    def _build_financial_health(self, health: dict) -> dict:
        """
        Extends the health dict with a human-readable grade and status label.
        """
        score = health["score"]

        if score >= 90:
            grade, status = "A", "Excellent"
        elif score >= 75:
            grade, status = "B", "Good"
        elif score >= 60:
            grade, status = "C", "Fair"
        elif score >= 40:
            grade, status = "D", "Poor"
        else:
            grade, status = "F", "Critical"

        return {
            "score": score,
            "grade": grade,
            "status": status,
            "income": health["income"],
            "expense": health["expense"],
            "savings": health["savings"],
            "category_totals": health["category_totals"],
        }

    def _build_analytics(self, transactions: list) -> dict:
        """Builds the analytics block from existing analyzers."""
        expense_by_category, total_expense = (
            self._spending_analyzer.analyze(transactions)
        )
        category_summary = self._category_statistics.category_summary(transactions)

        return {
            "spending": {
                "total_expense": total_expense,
                "by_category": expense_by_category,
            },
            "category_summary": category_summary,
        }

    def _build_recent_transactions(self, transactions: list) -> list:
        """
        Returns the latest 10 transactions sorted descending by date.
        Serialises only the fields required by the dashboard spec.
        """
        sorted_txns = sorted(
            transactions,
            key=lambda t: t.date,
            reverse=True,
        )

        result = []
        for t in sorted_txns[:10]:
            result.append({
                "date": t.date.strftime("%Y-%m-%d"),
                "merchant": t.merchant_name,
                "amount": float(t.amount),
                "category": t.category,
                "transaction_type": t.transaction_type,
                "description": t.raw_description,
            })

        return result

    def _empty_response(self) -> dict:
        """
        Returns a safe zero-valued structure when the transaction store is empty.
        Never raises an exception.
        """
        return {
            "summary": {
                "total_income": 0.0,
                "total_expense": 0.0,
                "savings": 0.0,
                "transaction_count": 0,
            },
            "financial_health": {},
            "budget": {},
            "analytics": {},
            "recurring": [],
            "insights": [],
            "recent_transactions": [],
        }
