from collections import defaultdict
from datetime import timedelta
import statistics


# Frequency classification based on median interval (days)
FREQUENCY_RANGES = [
    (1, 2, "daily"),
    (5, 9, "weekly"),
    (12, 18, "biweekly"),
    (25, 35, "monthly"),
    (80, 100, "quarterly"),
    (340, 395, "yearly"),
]


class RecurringDetector:
    """
    Smart Recurring Payments Detection Engine.

    Groups debit transactions by merchant, calculates date intervals,
    classifies payment frequency, computes a weighted confidence score,
    and predicts the next expected payment date.

    Confidence Score Weights:
        - Occurrence Count:      30%
        - Interval Consistency:  40%
        - Amount Consistency:    30%
    """

    MIN_OCCURRENCES = 3

    def detect(self, transactions, reference_date=None):
        """
        Detect recurring payments from a list of Transaction objects.

        Args:
            transactions: List of Transaction dataclass instances.
            reference_date: Optional datetime for calculating days_until_next.
                            Defaults to the latest transaction date if not provided.

        Returns:
            A list of dicts sorted by confidence (desc), then count (desc).
        """
        merchant_groups = self._group_by_merchant(transactions)

        if not merchant_groups:
            return []

        # Determine the reference date for days_until_next calculation
        if reference_date is None:
            all_dates = [
                t.date for t in transactions
                if t.transaction_type == "Debit"
                and t.merchant_name != "Unknown Merchant"
            ]
            reference_date = max(all_dates) if all_dates else None

        results = []
        for merchant, txns in merchant_groups.items():
            if len(txns) < self.MIN_OCCURRENCES:
                continue

            result = self._analyze_merchant(merchant, txns, reference_date)
            results.append(result)

        # Sort by confidence descending, then by count descending
        results.sort(key=lambda r: (-r["confidence"], -r["count"]))
        return results

    def _group_by_merchant(self, transactions):
        """Group only debit transactions from known merchants, sorted by date."""
        groups = defaultdict(list)

        for t in transactions:
            if t.transaction_type == "Credit":
                continue
            if t.merchant_name == "Unknown Merchant":
                continue
            groups[t.merchant_name].append(t)

        # Sort each group chronologically
        for merchant in groups:
            groups[merchant].sort(key=lambda t: t.date)

        return groups

    def _analyze_merchant(self, merchant, txns, reference_date):
        """Perform full analysis on a single merchant's transaction list."""
        amounts = [t.amount for t in txns]
        dates = [t.date for t in txns]
        intervals = [
            (dates[i + 1] - dates[i]).days
            for i in range(len(dates) - 1)
        ]

        median_interval = statistics.median(intervals)
        avg_amount = statistics.mean(amounts)

        frequency = self._classify_frequency(median_interval)
        confidence = self._calculate_confidence(
            len(txns), intervals, amounts
        )

        next_expected = dates[-1] + timedelta(days=median_interval)

        days_until_next = None
        if reference_date is not None:
            days_until_next = (next_expected - reference_date).days

        return {
            "merchant": merchant,
            "category": txns[-1].category,
            "count": len(txns),
            "frequency": frequency,
            "average_amount": round(avg_amount, 2),
            "first_seen": dates[0].strftime("%Y-%m-%d"),
            "last_seen": dates[-1].strftime("%Y-%m-%d"),
            "next_expected": next_expected.strftime("%Y-%m-%d"),
            "days_until_next": days_until_next,
            "confidence": confidence,
        }

    def _classify_frequency(self, median_interval):
        """Classify the payment frequency based on the median interval in days."""
        for low, high, label in FREQUENCY_RANGES:
            if low <= median_interval <= high:
                return label
        return "irregular"

    def _calculate_confidence(self, count, intervals, amounts):
        """
        Calculate a weighted confidence score between 0.0 and 1.0.

        Weights:
            - Occurrence Count:      30%  (more transactions = higher score)
            - Interval Consistency:  40%  (lower CV of intervals = higher score)
            - Amount Consistency:    30%  (lower CV of amounts = higher score)

        CV (Coefficient of Variation) = stdev / mean.
        A lower CV means more consistency, yielding a higher score component.
        """
        # --- Occurrence Score (30%) ---
        # Scales linearly: 3 txns = 0.3, 6 txns = 0.6, 10+ txns = 1.0
        occurrence_score = min(count / 10.0, 1.0)

        # --- Interval Consistency Score (40%) ---
        interval_score = self._cv_to_score(intervals)

        # --- Amount Consistency Score (30%) ---
        amount_score = self._cv_to_score(amounts)

        confidence = (
            0.30 * occurrence_score
            + 0.40 * interval_score
            + 0.30 * amount_score
        )

        return round(confidence, 2)

    def _cv_to_score(self, values):
        """
        Convert a list of values to a consistency score (0.0 to 1.0)
        using the Coefficient of Variation (CV = stdev / mean).

        A CV of 0 maps to a score of 1.0 (perfect consistency).
        A CV of 1 or higher maps to a score of 0.0 (no consistency).
        """
        if len(values) < 2:
            return 1.0

        mean_val = statistics.mean(values)

        if mean_val == 0:
            return 1.0

        stdev_val = statistics.stdev(values)
        cv = stdev_val / abs(mean_val)

        # Clamp CV to [0, 1] and invert: low CV = high score
        return round(max(0.0, 1.0 - cv), 4)