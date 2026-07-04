from collections import defaultdict


class RecurringDetector:

    def detect(self, transactions):

        merchant_frequency = defaultdict(int)

        for transaction in transactions:
            merchant_frequency[transaction.merchant_name] += 1

        recurring = []

        for merchant, count in merchant_frequency.items():

            if count >= 2:
                recurring.append((merchant, count))

        return recurring