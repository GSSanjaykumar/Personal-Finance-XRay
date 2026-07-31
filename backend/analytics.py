from collections import defaultdict


def calculate_financial_health(transactions):
    income = 0
    expense = 0

    category_totals = defaultdict(float)

    for t in transactions:

        amount = float(t.amount)

        if t.transaction_type == "Credit":
            income += amount
        else:
            expense += amount
            category_totals[t.category] += amount

    savings = income - expense

    score = 100

    if income > 0:
        expense_ratio = expense / income

        if expense_ratio > 0.9:
            score -= 40
        elif expense_ratio > 0.7:
            score -= 25
        elif expense_ratio > 0.5:
            score -= 15

    if savings < 0:
        score -= 30

    score = max(0, min(score, 100))

    return {
        "score": score,
        "income": income,
        "expense": expense,
        "savings": savings,
        "category_totals": dict(category_totals),
    }