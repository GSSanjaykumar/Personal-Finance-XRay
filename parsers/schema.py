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

    normalized_description: str

    merchant_name: str
    
    category: str

    amount: float

    transaction_type: str

    balance: Optional[float]

    bank_name: str

    reference_number: Optional[str]

    

    @property
    def is_debit(self):
        return self.transaction_type == "Debit"


    @property
    def is_credit(self):
        return self.transaction_type == "Credit"

    