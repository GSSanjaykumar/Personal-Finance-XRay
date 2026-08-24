from backend.budget_store import get_budget


def analyze_budget(user_id: str, category_totals: dict):

    budgets = get_budget(user_id)

    result = []

    for category, spent in category_totals.items():

        budget = budgets.get(category, 10000)

        percentage = round((spent / budget) * 100, 1)

        remaining = budget - spent

        if percentage >= 100:
            status = "Exceeded"
        elif percentage >= 80:
            status = "Near Limit"
        else:
            status = "Within Budget"

        result.append({
            "category": category,
            "spent": spent,
            "budget": budget,
            "percentage": percentage,
            "remaining": remaining,
            "status": status
        })

    return result