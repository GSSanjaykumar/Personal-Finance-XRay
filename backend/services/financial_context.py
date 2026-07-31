"""
Financial Context Builder
=========================
Gathers structured financial context from existing backend services and
formats it as a clean text block suitable for LLM prompt injection.

Design principles
-----------------
- Calls EXISTING service functions only — no business logic re-implemented.
- Fetches ONLY the data relevant to the classified intent (lean prompts).
- Uses entities to filter down large lists (like merchants or categories).
- Always includes: summary + health score (universal context).
- Formats all monetary values with the ₹ symbol and Indian comma notation.
- Never raises — returns a safe string on any error.
"""

from __future__ import annotations

from backend.transaction_store import get_transactions
from backend.analytics import calculate_financial_health
from backend.budget import analyze_budget
from backend.recurring_service import get_recurring_payments
from backend.forecast_service import ForecastService
from backend.dashboard_service import DashboardService
from backend.services.intent_classifier import Intent

_forecast_service = ForecastService()
_dashboard_service = DashboardService()


# ── Public API ────────────────────────────────────────────────────────────────

def build_context(intent: Intent, entities: list[str] = None) -> str:
    """
    Returns a formatted text block describing the user's financial context,
    tailored to the supplied *intent* and *entities*.
    """
    entities = entities or []
    try:
        transactions = get_transactions()

        if not transactions:
            return (
                "⚠️ No financial data is available yet. "
                "The user has not uploaded a bank statement."
            )

        health = calculate_financial_health(transactions)
        lines: list[str] = []

        # ── 1. Summary (always included) ─────────────────────────────────────
        lines += _summary_block(health)

        # ── 2. Intent-specific blocks ────────────────────────────────────────
        if intent in ("budget_advice", "category_analysis", "financial_health",
                      "recommendations"):
            lines += _budget_block(health["category_totals"], entities)

        if intent in ("forecast", "savings_advice", "comparison",
                      "recommendations"):
            lines += _forecast_block()

        if intent in ("subscription_review", "merchant_analysis",
                      "financial_health", "recommendations"):
            lines += _recurring_block()

        if intent in ("spending_analysis", "category_analysis",
                      "expense_summary", "recommendations"):
            lines += _category_block(health["category_totals"], entities)

        if intent in ("merchant_analysis",):
            lines += _merchant_block(transactions, entities)

        if intent in ("financial_health", "recommendations", "general"):
            lines += _insights_block(health)

        return "\n".join(lines)

    except Exception as exc:  # noqa: BLE001
        return f"[Context build error: {exc}]"


# ── Private helpers ───────────────────────────────────────────────────────────

def _fmt(amount: float) -> str:
    """Format a float as ₹1,23,456.78 (Indian notation)."""
    return f"₹{amount:,.2f}"


def _summary_block(health: dict) -> list[str]:
    income = health["income"]
    expense = health["expense"]
    savings = health["savings"]
    score = health["score"]
    savings_rate = (savings / income * 100) if income > 0 else 0.0

    score_label = (
        "Excellent" if score >= 90 else
        "Good" if score >= 75 else
        "Fair" if score >= 60 else
        "Poor" if score >= 40 else
        "Critical"
    )

    return [
        "── Financial Summary ────────────────────────────────────────",
        f"Total Income   : {_fmt(income)}",
        f"Total Expenses : {_fmt(expense)}",
        f"Net Savings    : {_fmt(savings)}  ({savings_rate:.1f}% savings rate)",
        f"Health Score   : {score}/100  ({score_label})",
        "",
    ]


def _budget_block(category_totals: dict, entities: list[str]) -> list[str]:
    budget_items = analyze_budget(category_totals)
    if not budget_items:
        return []

    lines = ["── Budget Status ────────────────────────────────────────────"]
    for item in budget_items:
        # If entities are present, prioritize them but don't strictly filter
        # unless it's a category analysis. To be safe, include all but mark entities.
        lines.append(
            f"{item['category']:<20} "
            f"Spent {_fmt(item['spent'])} / Budget {_fmt(item['budget'])} "
            f"({item['percentage']}%  —  {item['status']})"
        )
    lines.append("")
    return lines


def _forecast_block() -> list[str]:
    try:
        fc = _forecast_service.get_forecast()
        if not fc or not fc.get("forecast"):
            return []

        cur = fc.get("current_month", {})
        fcast = fc["forecast"]

        return [
            "── Spending Forecast ────────────────────────────────────────",
            f"Days elapsed this month   : {cur.get('days_elapsed', 'N/A')}",
            f"Days remaining            : {cur.get('days_remaining', 'N/A')}",
            f"Projected month-end spend : {_fmt(fcast.get('projected_month_end_expense', 0))}",
            f"Projected savings         : {_fmt(fcast.get('projected_savings', 0))}",
            f"Budget risk               : {fcast.get('budget_risk', 'Unknown')}",
            f"Daily average spend       : {_fmt(fc.get('daily_average', 0))}",
            "",
        ]
    except Exception:  # noqa: BLE001
        return []


def _recurring_block() -> list[str]:
    recurring = get_recurring_payments()
    if not recurring:
        return ["── Recurring Payments ──────────────────────────────────────", "None detected.", ""]

    lines = ["── Recurring Payments ──────────────────────────────────────"]
    for item in recurring[:15]:
        merchant = item.get("merchant", "Unknown")
        avg = item.get("average_amount", 0)
        freq = item.get("frequency", "")
        conf = item.get("confidence", "")
        lines.append(f"• {merchant:<25} {_fmt(avg):>12}  {freq}  (confidence: {conf})")
    lines.append("")
    return lines


def _category_block(category_totals: dict, entities: list[str]) -> list[str]:
    if not category_totals:
        return []

    total = sum(category_totals.values()) or 1
    sorted_cats = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)

    lines = ["── Spending by Category ─────────────────────────────────────"]
    for cat, amt in sorted_cats:
        # If entities are present, we can highlight them
        pct = amt / total * 100
        marker = ">> " if cat in entities else "   "
        lines.append(f"{marker}{cat:<20} {_fmt(amt):>14}  ({pct:.1f}% of total spend)")
    lines.append("")
    return lines


def _merchant_block(transactions: list, entities: list[str]) -> list[str]:
    """Top merchants by spend. Filters by entities if any match."""
    from collections import defaultdict
    merchant_totals: dict[str, float] = defaultdict(float)
    
    # Filter by entity if any merchant entity is detected
    lower_entities = [e.lower() for e in entities]
    
    for t in transactions:
        if t.transaction_type != "Credit":
            merchant_totals[t.merchant_name] += float(t.amount)

    if not merchant_totals:
        return []

    # If any entity matches a merchant, ONLY show those merchants (or top 5)
    filtered = {m: amt for m, amt in merchant_totals.items() if m.lower() in lower_entities or any(e in m.lower() for e in lower_entities)}
    
    if filtered:
        top = sorted(filtered.items(), key=lambda x: x[1], reverse=True)
        lines = ["── Searched Merchants ───────────────────────────────────────"]
    else:
        top = sorted(merchant_totals.items(), key=lambda x: x[1], reverse=True)[:20]
        lines = ["── Top Merchants by Spend ───────────────────────────────────"]

    for merchant, amt in top:
        lines.append(f"• {merchant:<30} {_fmt(amt)}")
    lines.append("")
    return lines


def _insights_block(health: dict) -> list[str]:
    from backend.insight_generator import InsightGenerator
    insights = InsightGenerator().generate(health)
    if not insights:
        return []

    lines = ["── AI Insights ──────────────────────────────────────────────"]
    for ins in insights:
        title = ins.get("title", "")
        value = ins.get("value", "")
        desc = ins.get("description", "")
        lines.append(f"• {title}: {value}  — {desc}")
    lines.append("")
    return lines
