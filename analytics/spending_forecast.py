"""
Spending Forecast & Cash Flow Prediction Engine
================================================
Estimates future spending for the current calendar month using:
  - Actual debit transactions from the current month
  - Recurring payment schedule (via RecurringDetector reuse)
  - User-configured budget targets (via budget_store reuse)

Algorithm overview
------------------
1.  Establish temporal context  — today, month boundaries, elapsed/remaining days
2.  Isolate current-month transactions  — income and expense
3.  Compute daily average spend  — expense / elapsed_days (guards zero division)
4.  Project month-end expense  — daily_average × total_days_in_month
5.  Identify pending recurring charges — recurring items whose next_expected date
    falls within the remaining days of the current month
6.  Compute projected savings  — income − (projected_expense + pending_recurring)
7.  Compute remaining budget   — sum(budgets) − expense_so_far
8.  Classify budget risk       — Low (<80%), Medium (80-100%), High (>100%)
9.  Cashflow prediction        — projected_savings as the end-of-month net position
"""

import calendar
from datetime import date, datetime
from typing import List, Optional

from analytics.recurring_detector import RecurringDetector
from backend.budget_store import get_budget


class SpendingForecast:
    """
    Produces a spending forecast for the current calendar month.

    Design principles
    -----------------
    - Never reimplements logic that already exists (RecurringDetector, get_budget).
    - All arithmetic is guarded against edge cases (empty lists, zero divisors,
      all-credit ledgers, leap years, variable month lengths).
    - reference_date is injectable for deterministic unit testing.
    """

    def __init__(self):
        self._recurring_detector = RecurringDetector()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def forecast(
        self,
        transactions: list,
        reference_date: Optional[date] = None,
    ) -> dict:
        """
        Compute the spending forecast.

        Args:
            transactions:   Full list of Transaction objects from the store.
            reference_date: Override "today" — used exclusively in tests.

        Returns:
            Structured forecast dict (see module docstring for schema).
        """
        today = reference_date or date.today()

        # ── Step 1 · Temporal context ────────────────────────────────────
        temporal = self._temporal_context(today)

        # ── Step 2 · Current-month income & expense ──────────────────────
        monthly = self._current_month_totals(transactions, today)

        # ── Step 3 · Daily average ───────────────────────────────────────
        daily_average = self._daily_average(
            monthly["expense"], temporal["days_elapsed"]
        )

        # ── Step 4 · Projected month-end expense ─────────────────────────
        projected_expense = round(
            daily_average * temporal["total_days"], 2
        )

        # ── Step 5 · Pending recurring charges this month ────────────────
        recurring_list = self._recurring_detector.detect(transactions)
        pending_recurring = self._pending_recurring(
            recurring_list, today, temporal["days_remaining"]
        )

        # ── Step 6 · Projected savings ───────────────────────────────────
        projected_savings = round(
            monthly["income"] - (projected_expense + pending_recurring), 2
        )

        # ── Step 7 · Remaining budget ────────────────────────────────────
        remaining_budget = self._remaining_budget(monthly["expense"])

        # ── Step 8 · Budget risk ─────────────────────────────────────────
        total_budget = sum(get_budget().values()) if get_budget() else 0.0
        budget_risk = self._budget_risk(projected_expense, total_budget)

        # ── Step 9 · Cashflow prediction = projected_savings ────────────
        cashflow_prediction = projected_savings

        return {
            "current_month": {
                "income": round(monthly["income"], 2),
                "expense": round(monthly["expense"], 2),
                "days_elapsed": temporal["days_elapsed"],
                "days_remaining": temporal["days_remaining"],
            },
            "forecast": {
                "projected_month_end_expense": projected_expense,
                "projected_savings": projected_savings,
                "expected_recurring_remaining": round(pending_recurring, 2),
                "remaining_budget": round(remaining_budget, 2),
                "budget_risk": budget_risk,
            },
            "daily_average": round(daily_average, 2),
            "cashflow_prediction": round(cashflow_prediction, 2),
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _temporal_context(self, today: date) -> dict:
        """
        Returns total days, days elapsed, and days remaining for the
        current month. Correctly handles leap years and all month lengths.
        """
        total_days = calendar.monthrange(today.year, today.month)[1]
        days_elapsed = today.day
        days_remaining = total_days - today.day

        return {
            "total_days": total_days,
            "days_elapsed": days_elapsed,
            "days_remaining": days_remaining,
        }

    def _current_month_totals(self, transactions: list, today: date) -> dict:
        """
        Sums income and expense for the current calendar month only.
        Handles all-credit, all-debit, and empty transaction lists.
        """
        income = 0.0
        expense = 0.0

        for t in transactions:
            # Normalise — t.date may be datetime or date
            txn_date = t.date.date() if isinstance(t.date, datetime) else t.date

            if txn_date.year != today.year or txn_date.month != today.month:
                continue

            if t.transaction_type == "Credit":
                income += float(t.amount)
            else:
                expense += float(t.amount)

        return {"income": income, "expense": expense}

    def _daily_average(self, expense: float, days_elapsed: int) -> float:
        """
        Computes the mean daily expenditure.
        Returns 0.0 when elapsed days = 0 or expense = 0.
        """
        if days_elapsed <= 0 or expense <= 0:
            return 0.0
        return expense / days_elapsed

    def _pending_recurring(
        self,
        recurring_list: list,
        today: date,
        days_remaining: int,
    ) -> float:
        """
        Sums recurring payment amounts whose next_expected date falls
        within the remaining days of the current month.

        Uses the already-computed recurring list from RecurringDetector
        to avoid re-detection and duplicate work.
        """
        if not recurring_list or days_remaining <= 0:
            return 0.0

        total = 0.0
        month_end = date(today.year, today.month,
                         calendar.monthrange(today.year, today.month)[1])

        for item in recurring_list:
            next_expected_str = item.get("next_expected")
            if not next_expected_str:
                continue

            try:
                next_date = datetime.strptime(
                    next_expected_str, "%Y-%m-%d"
                ).date()
            except ValueError:
                continue

            # Include only if the next charge falls within the remaining
            # days of the current calendar month
            if today < next_date <= month_end:
                total += float(item.get("average_amount", 0.0))

        return total

    def _remaining_budget(self, expense_so_far: float) -> float:
        """
        Computes budget remaining = total_monthly_budget − expense_so_far.
        Returns 0.0 if no budget is configured.
        """
        budgets = get_budget()
        if not budgets:
            return 0.0
        total_budget = sum(budgets.values())
        return max(total_budget - expense_so_far, 0.0)

    def _budget_risk(
        self, projected_expense: float, total_budget: float
    ) -> str:
        """
        Classifies budget risk based on the ratio of projected spending
        to the total configured monthly budget.

        Thresholds (applied to total budget, not per-category):
            < 80%   → Low
            80-100% → Medium
            > 100%  → High

        Returns "Low" when no budget is configured (safe default).
        """
        if total_budget <= 0 or projected_expense <= 0:
            return "Low"

        ratio = (projected_expense / total_budget) * 100

        if ratio > 100:
            return "High"
        elif ratio >= 80:
            return "Medium"
        return "Low"
