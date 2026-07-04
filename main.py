from parsers.pdf_parser import PDFParser
from analytics.statistics import Statistics


def main():

    parser = PDFParser()

    transactions = parser.read_pdf("datasets/sample_statements/hdfc_sample.pdf")

    print("\n" + "=" * 60)
    print("📊 FINAL TRANSACTION LIST")
    print("=" * 60)

    for transaction in transactions:
        print(transaction)

    print("\n" + "=" * 60)
    print("📊 BASIC STATISTICS")
    print("=" * 60)

    stats = Statistics()

    print(f"💰 Total Income  : ₹{stats.total_income(transactions):,.2f}")
    print(f"💸 Total Expense : ₹{stats.total_expense(transactions):,.2f}")

    print(f"💵 Net Savings    : ₹{stats.net_savings(transactions):,.2f}")

    print(f"📈 Transactions  : {stats.total_transactions(transactions)}")

    largest_debit = stats.largest_expense(transactions)

    print(
        f"🔥 Largest Expense : "
        f"{largest_debit.merchant_name}"
        f" (₹{largest_debit.amount:,.2f})"
    )

    largest_credit = stats.largest_income(transactions)

    print(
        f"💰 Largest Income  : "
        f"{largest_credit.merchant_name}"
        f" (₹{largest_credit.amount:,.2f})"
    )


if __name__ == "__main__":
    main()