from backend.budget_store import get_budget


def analyze_budget(category_totals):

    budgets = get_budget()

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