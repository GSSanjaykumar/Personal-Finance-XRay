class SpendingAnalyzer:

    def analyze(self, transactions):

        expense_by_category = {}

        total_expense = 0

        for transaction in transactions:

            if transaction.transaction_type == "Credit":
                continue

            total_expense += transaction.amount

            category = transaction.category

            expense_by_category[category] = (
                expense_by_category.get(category, 0)
                + transaction.amount
            )

        return expense_by_category, total_expense