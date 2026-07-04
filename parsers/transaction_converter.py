from datetime import datetime
from parsers.schema import Transaction
from intelligence.normalizer import Normalizer
from intelligence.matcher import Matcher



class TransactionConverter:

    def __init__(self):
        self.normalizer = Normalizer()
        self.matcher = Matcher()
      

    def convert(self, row, column_map):

        debit = row[column_map["Debit"]]
        credit = row[column_map["Credit"]]

        if debit != "":
            amount = float(debit)
            transaction_type = "Debit"
        else:
            amount = float(credit)
            transaction_type = "Credit"

        # Original description
        raw_description = row[column_map["Narration"]]

        # Normalize
        normalized_text = self.normalizer.normalize(raw_description)

        # Match merchant
        merchant = self.matcher.match(normalized_text)

        merchant_name = merchant["merchant_name"]

        category = merchant["category"]

        # Create transaction object
        transaction = Transaction(
            transaction_id=None,
            date=datetime.strptime(
                row[column_map["Date"]],
                "%d/%m/%Y"
            ),
            raw_description=raw_description,
            normalized_description=normalized_text,
            merchant_name=merchant_name,
            category=category,
            amount=amount,
            transaction_type=transaction_type,
            balance=float(row[column_map["Balance"]]),
            bank_name="HDFC",
            reference_number=None
        )

        return transaction