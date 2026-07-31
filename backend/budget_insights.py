def generate_budget_insights(budget_data):

    insights = []

    for item in budget_data:

        category = item["category"]

        spent = item["spent"]

        budget = item["budget"]

        remaining = item["remaining"]

        status = item["status"]

        if status == "Exceeded":

            message = (
                f"You exceeded your {category} budget by "
                f"₹{abs(remaining):,.0f}. "
                f"Try reducing unnecessary spending."
            )

        elif status == "Near Limit":

            message = (
                f"You have used {item['percentage']:.0f}% "
                f"of your {category} budget."
            )

        else:

            message = (
                f"Great! You still have "
                f"₹{remaining:,.0f} remaining."
            )

        insights.append({

            "category": category,

            "message": message

        })

    return insights