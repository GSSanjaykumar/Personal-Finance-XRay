class Statistics:

    def total_income(self, transactions):

        total = 0

        for transaction in transactions:

            if transaction.is_credit:
                total += transaction.amount

        return total

    def total_expense(self, transactions):

        total = 0

        for transaction in transactions:

            if transaction.is_debit:
                total += transaction.amount

        return total
    
    def net_savings(self, transactions):

        return (
            self.total_income(transactions)
            -
            self.total_expense(transactions)
        )
    
    def total_transactions(self, transactions):

        return len(transactions)
    
    def largest_expense(self, transactions):

        debit_transactions = []

        for transaction in transactions:

            if transaction.is_debit:
                debit_transactions.append(transaction)

        return max(
            debit_transactions,
            key=lambda transaction: transaction.amount
        )

    def largest_income(self, transactions):

        credit_transactions = []

        for transaction in transactions:

            if transaction.is_credit:
                credit_transactions.append(transaction)

        return max(
            credit_transactions,
            key=lambda transaction: transaction.amount
        )