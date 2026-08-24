from backend.transaction_store import get_transactions
from analytics.recurring_detector import RecurringDetector


def get_recurring_payments(user_id: str):
    """
    Retrieve stored transactions and detect recurring payments.

    Returns:
        A list of recurring payment dicts, sorted by confidence.
    """
    transactions = get_transactions(user_id)

    if not transactions:
        return []

    detector = RecurringDetector()
    return detector.detect(transactions)
