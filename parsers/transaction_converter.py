from datetime import datetime
from parsers.schema import Transaction
from intelligence.normalizer import Normalizer
from analytics.merchant_extractor import MerchantExtractor
import re

class TransactionConverter:

    def __init__(self):
        self.normalizer = Normalizer()
        self.extractor = MerchantExtractor()

    def _parse_amount(self, val):
        if not val:
            return 0.0
        val = str(val).strip().replace(',', '')
        
        # Remove any leading/trailing non-numeric characters (except - and .)
        val = re.sub(r'^[^\d\-\(]+', '', val)
        val = re.sub(r'[^\d\.\)]+$', '', val)
        
        # Check if it has parentheses (e.g. (1,234.56) for negative)
        if val.startswith('(') and val.endswith(')'):
            val = '-' + val[1:-1]
            
        try:
            return float(val)
        except ValueError:
            return 0.0

    def _parse_date(self, date_str):
        if not date_str:
            return None
            
        date_str = str(date_str).strip()
        
        # Extract just the date portion using regex to avoid bleeding text (dd/mm/yyyy or dd-mm-yyyy or dd MMM yyyy)
        match = re.search(r'(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}|\d{1,2}\s+[a-zA-Z]{3}\s+\d{2,4})', date_str)
        if match:
            date_str = match.group(1)
            
        # Common formats
        formats = [
            "%d/%m/%Y", "%d-%m-%Y", "%d %b %Y", "%Y-%m-%d", "%d/%m/%y", "%d-%m-%y"
        ]
        
        # Clean up timestamp if present
        if " " in date_str and not any(m in date_str.lower() for m in ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']):
            date_str = date_str.split()[0]
            
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
                
        return None

    def convert(self, row, column_map, bank_name="Unknown"):
        # Helper to safely get from row list
        def get_val(col_name):
            if col_name in column_map:
                idx = column_map[col_name]
                if idx < len(row):
                    return row[idx]
            return None
            
        # 1. Amount and Type extraction
        amount = 0.0
        transaction_type = "Credit"
        
        if "Debit" in column_map and "Credit" in column_map:
            debit_str = str(get_val("Debit") or "").strip()
            credit_str = str(get_val("Credit") or "").strip()

            debit_amt = self._parse_amount(debit_str) if debit_str.lower() not in ["none", "null"] else 0.0
            credit_amt = self._parse_amount(credit_str) if credit_str.lower() not in ["none", "null"] else 0.0
            
            if debit_amt > 0 and credit_amt == 0:
                amount = debit_amt
                transaction_type = "Debit"
            elif credit_amt > 0 and debit_amt == 0:
                amount = credit_amt
                transaction_type = "Credit"
            elif debit_amt > 0 and credit_amt > 0:
                # Both have values? Pick the larger one or prioritize one.
                # Usually one should be zero.
                if debit_amt > credit_amt:
                    amount = debit_amt
                    transaction_type = "Debit"
                else:
                    amount = credit_amt
                    transaction_type = "Credit"
            else:
                return None # Neither debit nor credit > 0

        elif "Amount" in column_map:
            val_str = str(get_val("Amount") or "").strip()
            if not val_str or val_str.lower() in ["none", "null"]:
                return None
                
            val_lower = val_str.lower()
            
            # Ends with dr/cr
            if val_lower.endswith(" dr") or val_lower.endswith("dr"):
                amount_str = re.sub(r'dr$', '', val_lower).strip()
                amount = self._parse_amount(amount_str)
                transaction_type = "Debit"
            elif val_lower.endswith(" cr") or val_lower.endswith("cr"):
                amount_str = re.sub(r'cr$', '', val_lower).strip()
                amount = self._parse_amount(amount_str)
                transaction_type = "Credit"
            elif val_str.startswith("-") or (val_str.startswith("(") and val_str.endswith(")")):
                amount = abs(self._parse_amount(val_str))
                transaction_type = "Debit"
            else:
                amount = self._parse_amount(val_str)
                # If there's only an amount column and no sign/suffix, and no debit/credit column...
                # usually means we need to infer or it's just credit. But wait, if Debit column is present alone?
                transaction_type = "Credit" 

        elif "Debit" in column_map:
            debit_str = str(get_val("Debit") or "").strip()
            if debit_str and debit_str.lower() not in ["none", "null"]:
                amount = self._parse_amount(debit_str)
                transaction_type = "Debit"
            else:
                return None
                
        elif "Credit" in column_map:
            credit_str = str(get_val("Credit") or "").strip()
            if credit_str and credit_str.lower() not in ["none", "null"]:
                amount = self._parse_amount(credit_str)
                transaction_type = "Credit"
            else:
                return None
                
        else:
            return None # Should not happen if validated by header mapper

        if amount <= 0:
            return None

        # 2. Date
        date_str = get_val("Date")
        dt = self._parse_date(date_str)
        if not dt:
            return None

        # 3. Description
        raw_description = str(get_val("Narration") or "")
        if not raw_description.strip():
            return None
            
        normalized_text = self.normalizer.normalize(raw_description)
        merchant = self.extractor.extract(normalized_text)
        merchant_name = merchant["merchant_name"]
        category = merchant["category"]

        # 4. Balance
        balance = 0.0
        bal_str = str(get_val("Balance") or "")
        if bal_str:
            balance = self._parse_amount(bal_str)

        transaction = Transaction(
            transaction_id=None,
            date=dt,
            raw_description=raw_description,
            normalized_description=normalized_text,
            merchant_name=merchant_name,
            category=category,
            amount=amount,
            transaction_type=transaction_type,
            balance=balance,
            bank_name=bank_name,
            reference_number=None
        )

        return transaction