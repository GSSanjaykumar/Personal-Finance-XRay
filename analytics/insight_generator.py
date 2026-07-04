class InsightGenerator:

    def generate(self, transactions):

        expenses = [
            t for t in transactions
            if t.transaction_type == "Debit"
        ]

        total_expense = sum(t.amount for t in expenses)

        insights = []

        if total_expense == 0:
            insights.append("No expenses found.")
            return insights

        category_total = {}

        for transaction in expenses:

            category_total[transaction.category] = (
                category_total.get(transaction.category, 0)
                + transaction.amount
            )

        for category, amount in category_total.items():

            percent = amount / total_expense * 100

            if percent > 50:

                insights.append(
                    f"⚠️ {percent:.1f}% of your expenses were spent on {category}."
                )

            elif percent > 20:

                insights.append(
                    f"📊 {category} accounts for {percent:.1f}% of your spending."
                )

        return insights