"""
Report Service
==============
Aggregates all existing services into a single data payload and delegates
PDF generation to ReportBuilder.

Reuses (never reimplements):
    - DashboardService.get_dashboard()   → summary, financial_health, budget,
                                           analytics, recurring, insights,
                                           recent_transactions
    - ForecastService.get_forecast()     → forecast projections
    - ReportBuilder                      → PDF generation
"""

from analytics.report_builder import ReportBuilder
from backend.dashboard_service import DashboardService
from backend.forecast_service import ForecastService


class ReportService:
    """
    Thin orchestrator:
    1. Calls DashboardService and ForecastService (single call each).
    2. Merges results into one dict.
    3. Passes the dict to ReportBuilder.
    4. Returns raw PDF bytes.

    Never performs any calculation itself.
    Never raises an exception — returns a "no data" PDF if the store is empty.
    """

    def __init__(self):
        self._dashboard_service = DashboardService()
        self._forecast_service = ForecastService()

    def generate_pdf(self) -> bytes:
        """
        Aggregate all service data and build the PDF.

        Returns:
            Raw PDF bytes suitable for direct HTTP streaming.
        """
        # ── Single call per service ──────────────────────────────────────
        dashboard_data = self._dashboard_service.get_dashboard()
        forecast_data  = self._forecast_service.get_forecast()

        # ── Merge into one unified payload ───────────────────────────────
        report_data = {
            # From DashboardService (already aggregated)
            "summary":              dashboard_data.get("summary", {}),
            "financial_health":     dashboard_data.get("financial_health", {}),
            "budget":               dashboard_data.get("budget", []),
            "analytics":            dashboard_data.get("analytics", {}),
            "recurring":            dashboard_data.get("recurring", []),
            "insights":             dashboard_data.get("insights", []),
            "recent_transactions":  dashboard_data.get("recent_transactions", []),

            # From ForecastService
            "forecast_data": forecast_data,
        }

        # ── Build and return the PDF ─────────────────────────────────────
        builder = ReportBuilder(report_data)
        return builder.build()
