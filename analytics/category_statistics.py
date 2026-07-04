class CategoryStatistics:

    def category_summary(self, transactions):

        summary = {}

        for transaction in transactions:

            category = transaction.category

            if category not in summary:
                summary[category] = 0

            summary[category] += transaction.amount

        return summary