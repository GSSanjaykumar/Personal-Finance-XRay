

class InsightGenerator:

    def generate(self, health):

        insights = []

        income = health["income"]
        expense = health["expense"]
        savings = health["savings"]
        score = health["score"]
        category_totals = health["category_totals"]

        # Savings Rate
        savings_rate = 0

        if income > 0:
            savings_rate = (savings / income) * 100

        insights.append({
            "title": "Savings Rate",
            "icon": "💰",
            "value": f"{savings_rate:.1f}%",
            "description": "Percentage of income saved."
        })

        # Largest Spending Category
        if category_totals:

            largest_category = max(
                category_totals,
                key=category_totals.get
            )

            largest_amount = category_totals[largest_category]

            insights.append({
                "title": "Highest Spending",
                "icon": "📊",
                "value": largest_category,
                "description": f"₹{largest_amount:,.2f}"
            })

        # Financial Health
        insights.append({
            "title": "Financial Health",
            "icon": "⭐",
            "value": f"{score}/100",
            "description": "Overall financial score."
        })

        # Recommendation
        recommendation = (
            "Excellent financial discipline. Keep maintaining your savings."
            if score >= 80
            else "Reduce unnecessary spending to improve your score."
        )

        insights.append({
            "title": "Recommendation",
            "icon": "🧠",
            "value": recommendation,
            "description": ""
        })

        return insights