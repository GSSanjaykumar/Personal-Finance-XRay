"""
Forecast Service
================
Thin wrapper that wires SpendingForecast to the data available in the
in-memory stores so the route layer needs zero business logic.
"""

from analytics.spending_forecast import SpendingForecast
from backend.transaction_store import get_transactions
from backend.recurring_service import get_recurring_payments


class ForecastService:
    """
    Retrieves all required inputs from existing stores and delegates
    to SpendingForecast for computation.

    Reuses:
    - get_transactions()        from backend.transaction_store
    - get_recurring_payments()  from backend.recurring_service
                                (which itself uses RecurringDetector)
    - get_budget()              called internally by SpendingForecast
    """

    def __init__(self):
        self._forecaster = SpendingForecast()

    def get_forecast(self) -> dict:
        """
        Produce the full forecast response.

        Returns a safe zero-valued structure when the transaction store
        is empty — never raises an exception.
        """
        transactions = get_transactions()

        if not transactions:
            return self._empty_response()

        return self._forecaster.forecast(transactions)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _empty_response(self) -> dict:
        """Zero-valued forecast when the store is empty."""
        return {
            "current_month": {
                "income": 0.0,
                "expense": 0.0,
                "days_elapsed": 0,
                "days_remaining": 0,
            },
            "forecast": {
                "projected_month_end_expense": 0.0,
                "projected_savings": 0.0,
                "expected_recurring_remaining": 0.0,
                "remaining_budget": 0.0,
                "budget_risk": "Low",
            },
            "daily_average": 0.0,
            "cashflow_prediction": 0.0,
        }
