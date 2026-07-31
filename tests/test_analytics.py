import pytest
from datetime import datetime, timedelta
from parsers.schema import Transaction
from analytics.statistics import Statistics
from analytics.category_statistics import CategoryStatistics
from analytics.spending_analyzer import SpendingAnalyzer
from analytics.recurring_detector import RecurringDetector
from analytics.insight_generator import InsightGenerator
from analytics.merchant_extractor import MerchantExtractor


# ---------------------------------------------------------------------------
# Helper to create Transaction objects quickly
# ---------------------------------------------------------------------------
def _txn(merchant, category, amount, date, txn_type="Debit"):
    return Transaction(
        transaction_id=None,
        date=date,
        raw_description=merchant,
        normalized_description=merchant.upper(),
        merchant_name=merchant,
        category=category,
        amount=amount,
        transaction_type=txn_type,
        balance=0.0,
        bank_name="Test Bank",
        reference_number=None,
    )


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def sample_transactions():
    t1 = Transaction(
        transaction_id="1", date=datetime.now(), raw_description="Salary",
        normalized_description="Salary", merchant_name="Employer",
        category="Income", amount=5000.0, transaction_type="Credit",
        balance=5000.0, bank_name="Test Bank", reference_number="111",
    )
    t2 = Transaction(
        transaction_id="2", date=datetime.now(), raw_description="Groceries",
        normalized_description="Groceries", merchant_name="Supermarket",
        category="Food", amount=150.0, transaction_type="Debit",
        balance=4850.0, bank_name="Test Bank", reference_number="222",
    )
    t3 = Transaction(
        transaction_id="3", date=datetime.now(), raw_description="Netflix",
        normalized_description="Netflix", merchant_name="Netflix",
        category="Entertainment", amount=15.0, transaction_type="Debit",
        balance=4835.0, bank_name="Test Bank", reference_number="333",
    )
    t4 = Transaction(
        transaction_id="4", date=datetime.now(), raw_description="Netflix",
        normalized_description="Netflix", merchant_name="Netflix",
        category="Entertainment", amount=15.0, transaction_type="Debit",
        balance=4820.0, bank_name="Test Bank", reference_number="444",
    )
    return [t1, t2, t3, t4]


# ===================================================================
# Original analytics tests (unchanged logic)
# ===================================================================
def test_statistics(sample_transactions):
    stats = Statistics()
    assert stats.total_income(sample_transactions) == 5000.0
    assert stats.total_expense(sample_transactions) == 180.0
    assert stats.net_savings(sample_transactions) == 4820.0
    assert stats.total_transactions(sample_transactions) == 4
    assert stats.largest_expense(sample_transactions).merchant_name == "Supermarket"
    assert stats.largest_income(sample_transactions).merchant_name == "Employer"


def test_category_statistics(sample_transactions):
    category_stats = CategoryStatistics()
    summary = category_stats.category_summary(sample_transactions)
    assert summary["Income"] == 5000.0
    assert summary["Food"] == 150.0
    assert summary["Entertainment"] == 30.0


def test_spending_analyzer(sample_transactions):
    analyzer = SpendingAnalyzer()
    by_category, total = analyzer.analyze(sample_transactions)
    assert total == 180.0
    assert by_category["Food"] == 150.0
    assert by_category["Entertainment"] == 30.0
    assert "Income" not in by_category


def test_insight_generator(sample_transactions):
    generator = InsightGenerator()
    insights = generator.generate(sample_transactions)
    assert len(insights) > 0
    assert any("83.3%" in i and "Food" in i for i in insights)


def test_merchant_extractor():
    extractor = MerchantExtractor()
    assert extractor.extract("UPI SWIGGY YBL") == {"merchant_name": "Swiggy", "category": "Food & Dining"}
    assert extractor.extract("NETFLIX SUBSCRIPTION") == {"merchant_name": "Netflix", "category": "Entertainment"}
    assert extractor.extract("SPOTIFY PREMIUM") == {"merchant_name": "Spotify", "category": "Entertainment"}
    assert extractor.extract("AMAZONPAY RECHARGE") == {"merchant_name": "Amazon Pay", "category": "Shopping"}
    assert extractor.extract("BIGBASKET ORDER") == {"merchant_name": "BigBasket", "category": "Groceries"}
    assert extractor.extract("RAPIDO RIDE") == {"merchant_name": "Rapido", "category": "Transport"}
    assert extractor.extract("RANDOM STORE PURCHASE") == {"merchant_name": "Unknown Merchant", "category": "Others"}


# ===================================================================
# Recurring Detector – comprehensive tests
# ===================================================================
class TestRecurringDetector:
    """Tests for the smart RecurringDetector."""

    def _make_recurring(self, merchant, category, amount, start, interval_days, count):
        """Helper: create `count` transactions spaced `interval_days` apart."""
        return [
            _txn(merchant, category, amount, start + timedelta(days=i * interval_days))
            for i in range(count)
        ]

    # -- Monthly subscription (e.g. Netflix ₹199 every 30 days) ----------
    def test_monthly_subscription(self):
        start = datetime(2026, 1, 1)
        txns = self._make_recurring("Netflix", "Entertainment", 199.0, start, 30, 6)
        detector = RecurringDetector()
        results = detector.detect(txns, reference_date=start + timedelta(days=150))

        assert len(results) == 1
        r = results[0]
        assert r["merchant"] == "Netflix"
        assert r["frequency"] == "monthly"
        assert r["count"] == 6
        assert r["average_amount"] == 199.0
        assert r["first_seen"] == "2026-01-01"
        assert r["last_seen"] == "2026-05-31"
        assert r["next_expected"] == "2026-06-30"
        assert r["confidence"] > 0.8

    # -- Weekly recurring (e.g. cleaning service every 7 days) -----------
    def test_weekly_recurring(self):
        start = datetime(2026, 3, 1)
        txns = self._make_recurring("CleanCo", "Services", 500.0, start, 7, 5)
        detector = RecurringDetector()
        results = detector.detect(txns, reference_date=start + timedelta(days=28))

        assert len(results) == 1
        assert results[0]["frequency"] == "weekly"
        assert results[0]["confidence"] > 0.7

    # -- Quarterly payments (e.g. insurance every ~90 days) --------------
    def test_quarterly_recurring(self):
        start = datetime(2025, 1, 15)
        txns = self._make_recurring("InsureCo", "Insurance", 5000.0, start, 90, 4)
        detector = RecurringDetector()
        results = detector.detect(txns, reference_date=start + timedelta(days=270))

        assert len(results) == 1
        assert results[0]["frequency"] == "quarterly"

    # -- Yearly payment (e.g. domain renewal ~365 days) ------------------
    def test_yearly_recurring(self):
        start = datetime(2023, 6, 1)
        txns = self._make_recurring("GoDaddy", "Tech", 1200.0, start, 365, 3)
        detector = RecurringDetector()
        results = detector.detect(txns, reference_date=start + timedelta(days=730))

        assert len(results) == 1
        assert results[0]["frequency"] == "yearly"

    # -- Irregular intervals → classified as irregular -------------------
    def test_irregular_transactions(self):
        start = datetime(2026, 1, 1)
        txns = [
            _txn("RandomShop", "Shopping", 100.0, start),
            _txn("RandomShop", "Shopping", 250.0, start + timedelta(days=5)),
            _txn("RandomShop", "Shopping", 80.0, start + timedelta(days=47)),
            _txn("RandomShop", "Shopping", 300.0, start + timedelta(days=120)),
        ]
        detector = RecurringDetector()
        results = detector.detect(txns, reference_date=start + timedelta(days=120))

        assert len(results) == 1
        assert results[0]["frequency"] == "irregular"
        # Confidence should be relatively low due to high variance
        assert results[0]["confidence"] < 0.6

    # -- Variable-amount subscription (e.g. utility bill) ----------------
    def test_variable_amount_subscription(self):
        start = datetime(2026, 1, 1)
        amounts = [1200.0, 1350.0, 1180.0, 1400.0, 1250.0]
        txns = [
            _txn("ElectricCo", "Utilities", amt, start + timedelta(days=i * 30))
            for i, amt in enumerate(amounts)
        ]
        detector = RecurringDetector()
        results = detector.detect(txns, reference_date=start + timedelta(days=120))

        assert len(results) == 1
        r = results[0]
        assert r["frequency"] == "monthly"
        # Amount consistency should be slightly lower but interval is perfect
        assert r["confidence"] > 0.6

    # -- Credits are ignored ---------------------------------------------
    def test_credits_ignored(self):
        start = datetime(2026, 1, 1)
        txns = [
            _txn("Employer", "Income", 50000.0, start + timedelta(days=i * 30), txn_type="Credit")
            for i in range(6)
        ]
        detector = RecurringDetector()
        results = detector.detect(txns)

        assert len(results) == 0

    # -- Unknown merchants are ignored -----------------------------------
    def test_unknown_merchants_ignored(self):
        start = datetime(2026, 1, 1)
        txns = [
            _txn("Unknown Merchant", "Others", 100.0, start + timedelta(days=i * 30))
            for i in range(5)
        ]
        detector = RecurringDetector()
        results = detector.detect(txns)

        assert len(results) == 0

    # -- Only 1 transaction → not recurring (below threshold of 3) ------
    def test_single_transaction_not_recurring(self):
        txns = [_txn("OneTimeShop", "Shopping", 999.0, datetime(2026, 5, 1))]
        detector = RecurringDetector()
        results = detector.detect(txns)

        assert len(results) == 0

    # -- Only 2 transactions → not recurring (below threshold of 3) -----
    def test_two_transactions_not_recurring(self):
        start = datetime(2026, 1, 1)
        txns = [
            _txn("TwoTimer", "Shopping", 200.0, start),
            _txn("TwoTimer", "Shopping", 200.0, start + timedelta(days=30)),
        ]
        detector = RecurringDetector()
        results = detector.detect(txns)

        assert len(results) == 0

    # -- Empty list → returns empty list ---------------------------------
    def test_empty_transactions(self):
        detector = RecurringDetector()
        assert detector.detect([]) == []

    # -- Sorting: higher confidence appears first -----------------------
    def test_sorting_by_confidence(self):
        start = datetime(2026, 1, 1)
        # High-confidence monthly (perfect intervals, same amount)
        high_conf = self._make_recurring("Netflix", "Entertainment", 199.0, start, 30, 6)
        # Low-confidence irregular (wild intervals and amounts)
        low_conf = [
            _txn("RandomShop", "Shopping", 100.0, start),
            _txn("RandomShop", "Shopping", 500.0, start + timedelta(days=3)),
            _txn("RandomShop", "Shopping", 50.0, start + timedelta(days=60)),
        ]
        detector = RecurringDetector()
        results = detector.detect(high_conf + low_conf, reference_date=start + timedelta(days=150))

        assert len(results) == 2
        assert results[0]["merchant"] == "Netflix"
        assert results[0]["confidence"] >= results[1]["confidence"]

    # -- Metadata fields are all present --------------------------------
    def test_metadata_fields(self):
        start = datetime(2026, 1, 1)
        txns = self._make_recurring("Spotify", "Entertainment", 119.0, start, 30, 4)
        detector = RecurringDetector()
        results = detector.detect(txns, reference_date=start + timedelta(days=90))

        r = results[0]
        required_keys = [
            "merchant", "category", "count", "frequency",
            "average_amount", "first_seen", "last_seen",
            "next_expected", "days_until_next", "confidence",
        ]
        for key in required_keys:
            assert key in r, f"Missing key: {key}"
