from parsers.pdf_parser import PDFParser
from analytics.statistics import Statistics
from analytics.category_statistics import CategoryStatistics
from analytics.spending_analyzer import SpendingAnalyzer
from analytics.insight_generator import InsightGenerator
from analytics.recurring_detector import RecurringDetector


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

    print("\n" + "=" * 60)
    print("📂 CATEGORY ANALYTICS")
    print("=" * 60)

    category_stats = CategoryStatistics()

    summary = category_stats.category_summary(transactions)

    sorted_summary = sorted(
    summary.items(),
    key=lambda item: item[1],
    reverse=True)

    for category, amount in sorted_summary:
        print(f"{category:<20} ₹{amount:,.2f}")


    print("\n" + "=" * 60)
    print("🧠 SPENDING ANALYSIS")
    print("=" * 60)

    analyzer = SpendingAnalyzer()

    expense_map, total = analyzer.analyze(transactions)

    for category, amount in sorted(
            expense_map.items(),
            key=lambda x: x[1],
            reverse=True):

        percentage = amount / total * 100

        print(
            f"{category:<20}"
            f"₹{amount:>10,.2f}"
            f" ({percentage:.1f}%)"
        )

    print("\n" + "=" * 60)
    print("🤖 AI FINANCIAL INSIGHTS")
    print("=" * 60)

    generator = InsightGenerator()

    insights = generator.generate(transactions)

    for insight in insights:
        print(insight)

    print("\n" + "=" * 60)
    print("🔁 RECURRING TRANSACTIONS")
    print("=" * 60)

    detector = RecurringDetector()

    recurring = detector.detect(transactions)

    if not recurring:
        print("No recurring merchants found.")

    for merchant, count in recurring:
        print(f"{merchant} ({count} transactions)")


if __name__ == "__main__":
    main()