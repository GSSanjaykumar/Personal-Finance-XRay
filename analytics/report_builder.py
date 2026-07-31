"""
PDF Report Builder
==================
Builds a professional multi-page PDF financial report using ReportLab.

Architecture
------------
- ReportBuilder receives a pre-aggregated data dict (built by ReportService).
- Chart generation (pie, bar, line) happens exactly once per chart type.
- All layout is handled via ReportLab Platypus (flowable) with
  SimpleDocTemplate for automatic page flow.

Page structure
--------------
1. Cover Page     — Title, health score, grade, quick summary
2. Budget         — Budget vs. actual, progress bars, risk
3. Spending       — Category breakdown table, top categories bar chart, pie chart
4. Recurring      — Merchant table, frequency, amount, confidence
5. Forecast       — Projections, cashflow, risk gauge bar
6. AI Insights    — Recommendation cards
7. Transactions   — Latest 20 rows table
"""

import io
import calendar
from datetime import datetime
from collections import defaultdict

import matplotlib
matplotlib.use("Agg")          # non-interactive backend — required for server use
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    HRFlowable,
    Image,
    KeepTogether,
)
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics import renderPDF


# ── Colour palette ────────────────────────────────────────────────────────────

PURPLE   = colors.HexColor("#7B2FF7")
PINK     = colors.HexColor("#F72585")
ORANGE   = colors.HexColor("#FF8C42")
GREEN    = colors.HexColor("#22C55E")
YELLOW   = colors.HexColor("#EAB308")
RED      = colors.HexColor("#EF4444")
DARK_BG  = colors.HexColor("#0D1117")
CARD_BG  = colors.HexColor("#161B22")
MID_GREY = colors.HexColor("#8B949E")
LIGHT    = colors.HexColor("#E6EDF3")
WHITE    = colors.white

RISK_COLORS = {"Low": GREEN, "Medium": YELLOW, "High": RED}
GRADE_COLORS = {"A": GREEN, "B": colors.HexColor("#84CC16"),
                "C": YELLOW, "D": ORANGE, "F": RED}

# ── Chart colour cycle ────────────────────────────────────────────────────────
CHART_PALETTE = [
    "#7B2FF7", "#F72585", "#FF8C42", "#22C55E",
    "#EAB308", "#00C9A7", "#818CF8", "#FB923C",
]


# =============================================================================
# ReportBuilder
# =============================================================================

class ReportBuilder:
    """
    Converts a pre-aggregated data dict into a binary PDF (BytesIO).

    Usage
    -----
        builder = ReportBuilder(data)
        pdf_bytes = builder.build()
    """

    def __init__(self, data: dict):
        self._data = data
        self._styles = self._make_styles()
        self._buf = io.BytesIO()

    # ------------------------------------------------------------------
    # Public
    # ------------------------------------------------------------------

    def build(self) -> bytes:
        """Build and return the PDF as raw bytes."""
        doc = SimpleDocTemplate(
            self._buf,
            pagesize=A4,
            leftMargin=1.8 * cm,
            rightMargin=1.8 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
            title="Personal Finance Report",
            author="Finance X-Ray",
        )

        story = []
        story += self._page_cover()
        story += self._page_budget()
        story += self._page_spending()
        story += self._page_recurring()
        story += self._page_forecast()
        story += self._page_insights()
        story += self._page_transactions()

        doc.build(
            story,
            onFirstPage=self._draw_header_footer,
            onLaterPages=self._draw_header_footer,
        )

        self._buf.seek(0)
        return self._buf.read()

    # ------------------------------------------------------------------
    # Page 1 — Cover
    # ------------------------------------------------------------------

    def _page_cover(self) -> list:
        s = self._styles
        data = self._data
        summary = data.get("summary", {})
        fh = data.get("financial_health", {})
        gen_date = datetime.now().strftime("%d %B %Y")

        score = fh.get("score", 0)
        grade = fh.get("grade", "N/A")
        status = fh.get("status", "N/A")
        grade_color = GRADE_COLORS.get(grade, LIGHT)

        story = [
            Spacer(1, 1.2 * cm),

            # ── Gradient-style header block ──────────────────────────────
            Paragraph("Personal Finance X-Ray", s["cover_brand"]),
            Spacer(1, 0.3 * cm),
            Paragraph("Financial Analysis Report", s["cover_title"]),
            Spacer(1, 0.2 * cm),
            Paragraph(f"Generated on {gen_date}", s["cover_date"]),
            HRFlowable(width="100%", thickness=1, color=PURPLE,
                       spaceAfter=0.6 * cm, spaceBefore=0.6 * cm),

            # ── Health Score Card ─────────────────────────────────────────
            Paragraph("Financial Health Score", s["section_title"]),
            Spacer(1, 0.4 * cm),
        ]

        # Score gauge bar
        story.append(self._score_gauge(score, grade, status, grade_color))
        story.append(Spacer(1, 0.6 * cm))

        # ── Quick Summary grid ─────────────────────────────────────────
        story.append(Paragraph("Quick Summary", s["section_title"]))
        story.append(Spacer(1, 0.3 * cm))

        income   = summary.get("total_income", 0)
        expense  = summary.get("total_expense", 0)
        savings  = summary.get("savings", 0)
        txn_count = summary.get("transaction_count", 0)

        if not income and not expense:
            story.append(Paragraph(
                "No financial data available. Upload a bank statement to generate a complete report.",
                s["body"]
            ))
        else:
            summary_table = Table(
                [
                    [
                        self._metric_cell("Total Income",  f"₹{income:,.0f}",  GREEN),
                        self._metric_cell("Total Expense", f"₹{expense:,.0f}", RED),
                        self._metric_cell("Net Savings",   f"₹{savings:,.0f}",
                                          GREEN if savings >= 0 else RED),
                        self._metric_cell("Transactions",  str(txn_count),     PURPLE),
                    ]
                ],
                colWidths=[4.5 * cm] * 4,
            )
            summary_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
                ("ROUNDEDCORNERS", [6]),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [CARD_BG]),
                ("BOX",        (0, 0), (-1, -1), 0.5, PURPLE),
                ("INNERGRID",  (0, 0), (-1, -1), 0.25, colors.HexColor("#30363D")),
                ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ]))
            story.append(summary_table)

        story.append(PageBreak())
        return story

    # ------------------------------------------------------------------
    # Page 2 — Budget Analysis
    # ------------------------------------------------------------------

    def _page_budget(self) -> list:
        s = self._styles
        budget_items = self._data.get("budget", [])
        if not isinstance(budget_items, list):
            budget_items = []

        story = [
            Paragraph("Budget Analysis", s["page_title"]),
            HRFlowable(width="100%", thickness=1, color=PURPLE,
                       spaceAfter=0.4 * cm, spaceBefore=0.2 * cm),
        ]

        if not budget_items:
            story.append(Paragraph("No budget data available.", s["body"]))
            story.append(PageBreak())
            return story

        for item in budget_items:
            story.append(KeepTogether(self._budget_card(item)))
            story.append(Spacer(1, 0.4 * cm))

        # Forecast risk from forecast data
        forecast = self._data.get("forecast_data", {}).get("forecast", {})
        risk = forecast.get("budget_risk", "Low")
        risk_color = RISK_COLORS.get(risk, GREEN)

        story.append(Spacer(1, 0.2 * cm))
        story.append(Table(
            [[Paragraph(f"Overall Budget Risk: {risk}", s["risk_text"])]],
            colWidths=["100%"],
            style=TableStyle([
                ("BACKGROUND",    (0, 0), (-1, -1), risk_color),
                ("TEXTCOLOR",     (0, 0), (-1, -1), WHITE),
                ("ROUNDEDCORNERS", [6]),
                ("TOPPADDING",    (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING",   (0, 0), (-1, -1), 16),
            ]),
        ))
        story.append(PageBreak())
        return story

    # ------------------------------------------------------------------
    # Page 3 — Spending Analytics
    # ------------------------------------------------------------------

    def _page_spending(self) -> list:
        s = self._styles
        analytics = self._data.get("analytics", {})
        by_category = analytics.get("spending", {}).get("by_category", {})

        story = [
            Paragraph("Spending Analytics", s["page_title"]),
            HRFlowable(width="100%", thickness=1, color=PURPLE,
                       spaceAfter=0.4 * cm, spaceBefore=0.2 * cm),
        ]

        if not by_category:
            story.append(Paragraph("No spending data available.", s["body"]))
            story.append(PageBreak())
            return story

        # ── Category table ─────────────────────────────────────────────
        story.append(Paragraph("Category Breakdown", s["section_title"]))
        story.append(Spacer(1, 0.3 * cm))

        sorted_cats = sorted(by_category.items(), key=lambda x: x[1], reverse=True)
        total_exp = sum(by_category.values()) or 1

        table_data = [["Category", "Amount (₹)", "% of Spend"]]
        for cat, amount in sorted_cats:
            pct = (amount / total_exp) * 100
            table_data.append([cat, f"{amount:,.2f}", f"{pct:.1f}%"])

        cat_table = Table(table_data, colWidths=[8 * cm, 5 * cm, 4 * cm])
        cat_table.setStyle(self._table_style())
        story.append(cat_table)
        story.append(Spacer(1, 0.6 * cm))

        # ── Pie chart ──────────────────────────────────────────────────
        story.append(Paragraph("Category Distribution", s["section_title"]))
        story.append(Spacer(1, 0.3 * cm))
        pie_img = self._chart_pie(by_category)
        if pie_img:
            story.append(pie_img)

        story.append(Spacer(1, 0.6 * cm))

        # ── Top categories bar chart ───────────────────────────────────
        story.append(Paragraph("Top Spending Categories", s["section_title"]))
        story.append(Spacer(1, 0.3 * cm))
        bar_img = self._chart_bar(by_category)
        if bar_img:
            story.append(bar_img)

        story.append(PageBreak())
        return story

    # ------------------------------------------------------------------
    # Page 4 — Recurring Payments
    # ------------------------------------------------------------------

    def _page_recurring(self) -> list:
        s = self._styles
        recurring = self._data.get("recurring", [])

        story = [
            Paragraph("Recurring Payments", s["page_title"]),
            HRFlowable(width="100%", thickness=1, color=PURPLE,
                       spaceAfter=0.4 * cm, spaceBefore=0.2 * cm),
        ]

        if not recurring:
            story.append(Paragraph("No recurring payments detected.", s["body"]))
            story.append(PageBreak())
            return story

        table_data = [["Merchant", "Frequency", "Avg Amount", "Confidence", "Next Expected"]]
        for item in recurring:
            conf_pct = f"{int(item.get('confidence', 0) * 100)}%"
            table_data.append([
                item.get("merchant", ""),
                item.get("frequency", ""),
                f"₹{item.get('average_amount', 0):,.2f}",
                conf_pct,
                item.get("next_expected", ""),
            ])

        col_w = [5.5 * cm, 3 * cm, 3.5 * cm, 2.5 * cm, 3 * cm]
        rec_table = Table(table_data, colWidths=col_w)
        rec_table.setStyle(self._table_style())
        story.append(rec_table)
        story.append(PageBreak())
        return story

    # ------------------------------------------------------------------
    # Page 5 — Forecast
    # ------------------------------------------------------------------

    def _page_forecast(self) -> list:
        s = self._styles
        fd = self._data.get("forecast_data", {})
        cm_data = fd.get("current_month", {})
        fc = fd.get("forecast", {})

        story = [
            Paragraph("Spending Forecast", s["page_title"]),
            HRFlowable(width="100%", thickness=1, color=PURPLE,
                       spaceAfter=0.4 * cm, spaceBefore=0.2 * cm),
        ]

        if not fc:
            story.append(Paragraph("No forecast data available.", s["body"]))
            story.append(PageBreak())
            return story

        risk = fc.get("budget_risk", "Low")
        risk_color = RISK_COLORS.get(risk, GREEN)

        # ── Metrics grid ───────────────────────────────────────────────
        proj_exp  = fc.get("projected_month_end_expense", 0)
        proj_sav  = fc.get("projected_savings", 0)
        rem_budget = fc.get("remaining_budget", 0)
        cashflow  = fd.get("cashflow_prediction", 0)
        daily_avg = fd.get("daily_average", 0)
        recurring_rem = fc.get("expected_recurring_remaining", 0)

        metrics_table = Table(
            [
                [
                    self._metric_cell("Projected Spending",    f"₹{proj_exp:,.0f}",  PURPLE),
                    self._metric_cell("Projected Savings",     f"₹{proj_sav:,.0f}",
                                      GREEN if proj_sav >= 0 else RED),
                ],
                [
                    self._metric_cell("Remaining Budget",      f"₹{rem_budget:,.0f}", GREEN),
                    self._metric_cell("Cashflow Prediction",   f"₹{cashflow:,.0f}",
                                      GREEN if cashflow >= 0 else RED),
                ],
                [
                    self._metric_cell("Daily Average",         f"₹{daily_avg:,.0f}",  ORANGE),
                    self._metric_cell("Pending Recurring",     f"₹{recurring_rem:,.0f}", PINK),
                ],
            ],
            colWidths=[8.5 * cm, 8.5 * cm],
        )
        metrics_table.setStyle(TableStyle([
            ("BACKGROUND",     (0, 0), (-1, -1), CARD_BG),
            ("BOX",            (0, 0), (-1, -1), 0.5, PURPLE),
            ("INNERGRID",      (0, 0), (-1, -1), 0.25, colors.HexColor("#30363D")),
            ("VALIGN",         (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING",     (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING",  (0, 0), (-1, -1), 8),
        ]))
        story.append(metrics_table)
        story.append(Spacer(1, 0.6 * cm))

        # ── Risk indicator ─────────────────────────────────────────────
        story.append(Table(
            [[Paragraph(f"Budget Risk: {risk}", s["risk_text"])]],
            colWidths=["100%"],
            style=TableStyle([
                ("BACKGROUND",    (0, 0), (-1, -1), risk_color),
                ("TEXTCOLOR",     (0, 0), (-1, -1), WHITE),
                ("TOPPADDING",    (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("LEFTPADDING",   (0, 0), (-1, -1), 16),
            ]),
        ))
        story.append(Spacer(1, 0.6 * cm))

        # ── Forecast bar chart ─────────────────────────────────────────
        bar_img = self._chart_forecast_bars(proj_exp, cm_data.get("expense", 0),
                                            recurring_rem, rem_budget, risk)
        if bar_img:
            story.append(Paragraph("Forecast Overview", s["section_title"]))
            story.append(Spacer(1, 0.3 * cm))
            story.append(bar_img)

        story.append(PageBreak())
        return story

    # ------------------------------------------------------------------
    # Page 6 — AI Insights
    # ------------------------------------------------------------------

    def _page_insights(self) -> list:
        s = self._styles
        insights = self._data.get("insights", [])

        story = [
            Paragraph("AI-Powered Insights", s["page_title"]),
            HRFlowable(width="100%", thickness=1, color=PURPLE,
                       spaceAfter=0.4 * cm, spaceBefore=0.2 * cm),
        ]

        if not insights:
            story.append(Paragraph("No insights available.", s["body"]))
            story.append(PageBreak())
            return story

        for item in insights[:6]:
            icon  = item.get("icon", "")
            title = item.get("title", "")
            value = item.get("value", "")
            desc  = item.get("description", "")

            card = Table(
                [[
                    Paragraph(f"{icon} <b>{title}</b>", s["insight_title"]),
                    Paragraph(f"<b>{value}</b>", s["insight_value"]),
                ]],
                colWidths=[10 * cm, 7 * cm],
            )
            card.setStyle(TableStyle([
                ("BACKGROUND",    (0, 0), (-1, -1), CARD_BG),
                ("BOX",           (0, 0), (-1, -1), 0.5, PURPLE),
                ("VALIGN",        (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING",    (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
                ("LEFTPADDING",   (0, 0), (-1, -1), 14),
                ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
            ]))

            desc_para = Paragraph(desc, s["insight_desc"]) if desc else Spacer(1, 0)
            story.append(KeepTogether([card, Spacer(1, 2 * mm), desc_para, Spacer(1, 0.4 * cm)]))

        story.append(PageBreak())
        return story

    # ------------------------------------------------------------------
    # Page 7 — Recent Transactions
    # ------------------------------------------------------------------

    def _page_transactions(self) -> list:
        s = self._styles
        recent = self._data.get("recent_transactions", [])

        story = [
            Paragraph("Recent Transactions", s["page_title"]),
            HRFlowable(width="100%", thickness=1, color=PURPLE,
                       spaceAfter=0.4 * cm, spaceBefore=0.2 * cm),
        ]

        if not recent:
            story.append(Paragraph("No transaction data available.", s["body"]))
            return story

        table_data = [["Date", "Merchant", "Category", "Amount (₹)", "Type"]]
        for txn in recent[:20]:
            is_credit = txn.get("transaction_type") == "Credit"
            amt_str = f"+{txn.get('amount', 0):,.2f}" if is_credit else f"-{txn.get('amount', 0):,.2f}"
            table_data.append([
                txn.get("date", ""),
                txn.get("merchant", ""),
                txn.get("category", ""),
                amt_str,
                txn.get("transaction_type", ""),
            ])

        col_w = [3 * cm, 5.5 * cm, 3.5 * cm, 3.5 * cm, 2.5 * cm]
        txn_table = Table(table_data, colWidths=col_w, repeatRows=1)
        style = self._table_style()

        # Colour-code credit/debit amounts (column 3)
        for row_idx, txn in enumerate(recent[:20], start=1):
            is_credit = txn.get("transaction_type") == "Credit"
            amt_color = GREEN if is_credit else RED
            style.add("TEXTCOLOR", (3, row_idx), (3, row_idx), amt_color)

        txn_table.setStyle(style)
        story.append(txn_table)
        return story

    # ------------------------------------------------------------------
    # Chart generators — each produces an io.BytesIO image
    # ------------------------------------------------------------------

    def _chart_pie(self, by_category: dict):
        """Pie chart — category distribution."""
        if not by_category:
            return None
        labels = list(by_category.keys())
        values = list(by_category.values())
        colors_list = CHART_PALETTE[:len(labels)]

        fig, ax = plt.subplots(figsize=(6, 3.5), facecolor="#0D1117")
        wedges, texts, autotexts = ax.pie(
            values,
            labels=None,
            colors=colors_list,
            autopct="%1.1f%%",
            startangle=140,
            pctdistance=0.8,
            wedgeprops={"edgecolor": "#0D1117", "linewidth": 1.5},
        )
        for at in autotexts:
            at.set_color("white")
            at.set_fontsize(7)

        legend_patches = [
            mpatches.Patch(color=c, label=l)
            for c, l in zip(colors_list, labels)
        ]
        ax.legend(handles=legend_patches, loc="center left",
                  bbox_to_anchor=(1, 0.5), fontsize=7,
                  facecolor="#161B22", labelcolor="white",
                  edgecolor="#30363D")
        ax.set_facecolor("#0D1117")
        plt.tight_layout()

        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=120, bbox_inches="tight",
                    facecolor="#0D1117")
        plt.close(fig)
        buf.seek(0)
        return Image(buf, width=14 * cm, height=7 * cm)

    def _chart_bar(self, by_category: dict):
        """Horizontal bar chart — top spending categories."""
        if not by_category:
            return None

        sorted_cats = sorted(by_category.items(), key=lambda x: x[1], reverse=True)[:8]
        labels = [c for c, _ in sorted_cats]
        values = [v for _, v in sorted_cats]
        colors_list = CHART_PALETTE[:len(labels)]

        fig, ax = plt.subplots(figsize=(7, max(2.5, len(labels) * 0.55)),
                               facecolor="#0D1117")
        bars = ax.barh(labels, values, color=colors_list,
                       edgecolor="#0D1117", height=0.6)
        ax.set_facecolor("#0D1117")
        ax.tick_params(colors="white", labelsize=7)
        ax.spines[:].set_color("#30363D")
        ax.xaxis.label.set_color("white")
        for bar, val in zip(bars, values):
            ax.text(val + max(values) * 0.01, bar.get_y() + bar.get_height() / 2,
                    f"₹{val:,.0f}", va="center", color="white", fontsize=6)
        plt.tight_layout()

        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=120, bbox_inches="tight",
                    facecolor="#0D1117")
        plt.close(fig)
        buf.seek(0)
        return Image(buf, width=14 * cm, height=max(4 * cm, len(labels) * 0.9 * cm))

    def _chart_forecast_bars(self, projected, spent, recurring_rem,
                             rem_budget, risk):
        """Horizontal bar chart comparing forecast metrics."""
        labels = ["Spent So Far", "Projected Month-End",
                  "Pending Recurring", "Remaining Budget"]
        values = [spent, projected, recurring_rem, rem_budget]
        risk_clr = {"Low": "#22C55E", "Medium": "#EAB308", "High": "#EF4444"}
        bar_colors = ["#7B2FF7", risk_clr.get(risk, "#22C55E"),
                      "#F72585", "#00C9A7"]

        fig, ax = plt.subplots(figsize=(7, 2.8), facecolor="#0D1117")
        bars = ax.barh(labels, values, color=bar_colors,
                       edgecolor="#0D1117", height=0.5)
        ax.set_facecolor("#0D1117")
        ax.tick_params(colors="white", labelsize=7)
        ax.spines[:].set_color("#30363D")
        max_v = max(values) if any(values) else 1
        for bar, val in zip(bars, values):
            ax.text(val + max_v * 0.01, bar.get_y() + bar.get_height() / 2,
                    f"₹{val:,.0f}", va="center", color="white", fontsize=6)
        plt.tight_layout()

        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=120, bbox_inches="tight",
                    facecolor="#0D1117")
        plt.close(fig)
        buf.seek(0)
        return Image(buf, width=14 * cm, height=5 * cm)

    # ------------------------------------------------------------------
    # ReportLab helpers
    # ------------------------------------------------------------------

    def _score_gauge(self, score, grade, status, grade_color):
        """Visual score gauge as a styled table row."""
        s = self._styles
        pct = score / 100.0
        w = 14 * cm

        gauge_data = [
            [
                Paragraph(f"Score: <b>{score}/100</b>", s["score_number"]),
                Paragraph(f"Grade: <font color='#{self._hex(grade_color)}'>"
                          f"<b>{grade}</b></font>", s["score_grade"]),
                Paragraph(f"Status: <b>{status}</b>", s["score_status"]),
            ]
        ]
        gauge_table = Table(gauge_data, colWidths=[5.5 * cm, 4.5 * cm, 7 * cm])
        gauge_table.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), CARD_BG),
            ("BOX",           (0, 0), (-1, -1), 1, PURPLE),
            ("INNERGRID",     (0, 0), (-1, -1), 0.3, colors.HexColor("#30363D")),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING",    (0, 0), (-1, -1), 14),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
            ("LEFTPADDING",   (0, 0), (-1, -1), 16),
        ]))
        return gauge_table

    def _budget_card(self, item: dict) -> list:
        """Returns a list of flowables representing one budget card."""
        s = self._styles
        cat      = item.get("category", "")
        spent    = item.get("spent", 0)
        budget   = item.get("budget", 0)
        pct      = item.get("percentage", 0)
        remaining = item.get("remaining", 0)
        status   = item.get("status", "")

        status_color = {"Exceeded": RED, "Near Limit": YELLOW}.get(status, GREEN)
        bar_w = min(pct / 100.0, 1.0)

        header_row = [
            Paragraph(f"<b>{cat}</b>", s["budget_cat"]),
            Paragraph(status, ParagraphStyle(
                "status", parent=s["budget_cat"],
                textColor=status_color, alignment=TA_RIGHT)),
        ]
        value_row = [
            Paragraph(f"Spent: ₹{spent:,.0f}", s["budget_value"]),
            Paragraph(f"Budget: ₹{budget:,.0f} | Left: ₹{remaining:,.0f}",
                      ParagraphStyle("bv2", parent=s["budget_value"], alignment=TA_RIGHT)),
        ]

        rows = [header_row, value_row]
        card = Table(rows, colWidths=[9 * cm, 8 * cm])
        card.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), CARD_BG),
            ("BOX",           (0, 0), (-1, -1), 0.5, PURPLE),
            ("TOPPADDING",    (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING",   (0, 0), (-1, -1), 12),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
        ]))

        # Progress bar drawn via a mini chart
        prog = self._progress_bar_image(bar_w, status_color)

        result = [card]
        if prog:
            result.append(prog)
        return result

    def _progress_bar_image(self, fraction: float, bar_color):
        """Returns a thin image representing a progress bar."""
        w_px, h_px = 800, 22
        fig, ax = plt.subplots(figsize=(w_px / 100, h_px / 100),
                               facecolor="#161B22")
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.axis("off")

        # Background track
        ax.barh(0.5, 1.0, height=0.6, left=0, color="#30363D",
                align="center")
        # Fill
        if fraction > 0:
            hex_str = "#{:02x}{:02x}{:02x}".format(
                int(bar_color.red * 255),
                int(bar_color.green * 255),
                int(bar_color.blue * 255),
            )
            ax.barh(0.5, fraction, height=0.6, left=0, color=hex_str,
                    align="center")

        buf = io.BytesIO()
        plt.savefig(buf, format="png", dpi=100, bbox_inches="tight",
                    facecolor="#161B22")
        plt.close(fig)
        buf.seek(0)
        return Image(buf, width=17.4 * cm, height=0.5 * cm)

    def _metric_cell(self, label: str, value: str, color) -> Paragraph:
        """Returns a styled Paragraph for a metric cell."""
        s = self._styles
        hex_str = "#{:02x}{:02x}{:02x}".format(
            int(color.red * 255),
            int(color.green * 255),
            int(color.blue * 255),
        )
        return Paragraph(
            f"<font size='8' color='#8B949E'>{label}</font><br/>"
            f"<font size='14' color='{hex_str}'><b>{value}</b></font>",
            s["metric_cell"],
        )

    def _table_style(self) -> TableStyle:
        """Shared dark-theme table style."""
        return TableStyle([
            ("BACKGROUND",    (0, 0), (-1, 0),  PURPLE),
            ("TEXTCOLOR",     (0, 0), (-1, 0),  WHITE),
            ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
            ("FONTSIZE",      (0, 0), (-1, 0),  9),
            ("BACKGROUND",    (0, 1), (-1, -1), DARK_BG),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [DARK_BG, CARD_BG]),
            ("TEXTCOLOR",     (0, 1), (-1, -1), LIGHT),
            ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE",      (0, 1), (-1, -1), 8),
            ("GRID",          (0, 0), (-1, -1), 0.25, colors.HexColor("#30363D")),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING",    (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING",   (0, 0), (-1, -1), 8),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ])

    # ------------------------------------------------------------------
    # Header / Footer callback
    # ------------------------------------------------------------------

    def _draw_header_footer(self, canvas, doc):
        """Draws a consistent header bar and footer on every page."""
        canvas.saveState()
        w, h = A4

        # ── Header strip ────────────────────────────────────────────────
        canvas.setFillColor(DARK_BG)
        canvas.rect(0, h - 1.4 * cm, w, 1.4 * cm, fill=1, stroke=0)
        canvas.setFillColor(PURPLE)
        canvas.rect(0, h - 1.4 * cm, 0.5 * cm, 1.4 * cm, fill=1, stroke=0)

        canvas.setFont("Helvetica-Bold", 9)
        canvas.setFillColor(LIGHT)
        canvas.drawString(1.0 * cm, h - 0.85 * cm, "Personal Finance X-Ray  |  Financial Report")
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(MID_GREY)
        canvas.drawRightString(w - 1.8 * cm, h - 0.85 * cm,
                               datetime.now().strftime("%d %B %Y"))

        # ── Footer ──────────────────────────────────────────────────────
        canvas.setFillColor(DARK_BG)
        canvas.rect(0, 0, w, 1.0 * cm, fill=1, stroke=0)
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(MID_GREY)
        canvas.drawCentredString(w / 2, 0.38 * cm,
                                 f"Page {doc.page}  |  Confidential — Personal Finance X-Ray")

        canvas.restoreState()

    # ------------------------------------------------------------------
    # Style definitions
    # ------------------------------------------------------------------

    def _make_styles(self) -> dict:
        base = getSampleStyleSheet()
        return {
            "cover_brand": ParagraphStyle(
                "cover_brand", fontName="Helvetica-Bold",
                fontSize=11, textColor=PURPLE, alignment=TA_CENTER),
            "cover_title": ParagraphStyle(
                "cover_title", fontName="Helvetica-Bold",
                fontSize=26, textColor=LIGHT, alignment=TA_CENTER),
            "cover_date": ParagraphStyle(
                "cover_date", fontName="Helvetica",
                fontSize=10, textColor=MID_GREY, alignment=TA_CENTER),
            "page_title": ParagraphStyle(
                "page_title", fontName="Helvetica-Bold",
                fontSize=18, textColor=LIGHT, spaceAfter=4),
            "section_title": ParagraphStyle(
                "section_title", fontName="Helvetica-Bold",
                fontSize=12, textColor=PURPLE, spaceAfter=4),
            "body": ParagraphStyle(
                "body", fontName="Helvetica",
                fontSize=9, textColor=LIGHT, leading=14),
            "score_number": ParagraphStyle(
                "score_number", fontName="Helvetica-Bold",
                fontSize=13, textColor=LIGHT, alignment=TA_CENTER),
            "score_grade": ParagraphStyle(
                "score_grade", fontName="Helvetica-Bold",
                fontSize=18, textColor=LIGHT, alignment=TA_CENTER),
            "score_status": ParagraphStyle(
                "score_status", fontName="Helvetica",
                fontSize=11, textColor=MID_GREY, alignment=TA_CENTER),
            "metric_cell": ParagraphStyle(
                "metric_cell", fontName="Helvetica",
                fontSize=9, textColor=LIGHT, alignment=TA_CENTER, leading=18),
            "risk_text": ParagraphStyle(
                "risk_text", fontName="Helvetica-Bold",
                fontSize=11, textColor=WHITE),
            "budget_cat": ParagraphStyle(
                "budget_cat", fontName="Helvetica-Bold",
                fontSize=10, textColor=LIGHT),
            "budget_value": ParagraphStyle(
                "budget_value", fontName="Helvetica",
                fontSize=8, textColor=MID_GREY),
            "insight_title": ParagraphStyle(
                "insight_title", fontName="Helvetica-Bold",
                fontSize=10, textColor=LIGHT),
            "insight_value": ParagraphStyle(
                "insight_value", fontName="Helvetica-Bold",
                fontSize=12, textColor=PURPLE, alignment=TA_RIGHT),
            "insight_desc": ParagraphStyle(
                "insight_desc", fontName="Helvetica",
                fontSize=8, textColor=MID_GREY, leftIndent=8),
        }

    # ------------------------------------------------------------------
    # Utility
    # ------------------------------------------------------------------

    @staticmethod
    def _hex(rl_color) -> str:
        """Convert a ReportLab Color to a hex string (without #)."""
        return "{:02x}{:02x}{:02x}".format(
            int(rl_color.red * 255),
            int(rl_color.green * 255),
            int(rl_color.blue * 255),
        )
