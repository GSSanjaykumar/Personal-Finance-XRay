from datetime import datetime

from parsers.schema import Transaction


class TransactionConverter:

    def convert(self, row, column_map):

        debit = row[column_map["Debit"]]
        credit = row[column_map["Credit"]]

        if debit != "":
            amount = float(debit)
            transaction_type = "Debit"
        else:
            amount = float(credit)
            transaction_type = "Credit"

        transaction = Transaction(
            transaction_id=None,
            date=datetime.strptime(
                row[column_map["Date"]],
                "%d/%m/%Y"
            ),
            raw_description=row[column_map["Narration"]],
            amount=amount,
            transaction_type=transaction_type,
            balance=float(row[column_map["Balance"]]),
            bank_name="HDFC",
            reference_number=None
        )

        return transaction 