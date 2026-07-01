from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class Transaction:
    """
    Universal Transaction Schema
    Every bank statement will be converted into this format.
    """

    transaction_id: Optional[str]

    date: datetime

    raw_description: str

    amount: float

    transaction_type: str

    balance: Optional[float]

    bank_name: str

    reference_number: Optional[str]