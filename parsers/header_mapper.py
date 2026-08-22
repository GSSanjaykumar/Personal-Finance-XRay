class HeaderMapper:
    def create_mapping(self, header):
        column_map = {}
        if not header:
            return column_map

        for index, column_name in enumerate(header):
            if not column_name:
                continue
                
            col_lower = str(column_name).strip().lower()
            # Remove any special characters to help normalization
            col_clean = ''.join(e for e in col_lower if e.isalnum() or e.isspace())
            
            # Fuzzy Matching Logic
            tokens = set(col_clean.split())
            
            # Simple substring for longer distinct words, token matching for short words
            if any(term in col_clean for term in ['date', 'posting']):
                column_map['Date'] = index
            elif any(term in col_clean for term in ['narration', 'description', 'particular', 'remark', 'detail', 'reference']):
                column_map['Narration'] = index
            elif any(term in col_clean for term in ['debit', 'withdraw', 'ithdrawal', 'paid out']) or any(t in tokens for t in ['dr']):
                column_map['Debit'] = index
            elif any(term in col_clean for term in ['credit', 'deposit', 'eposit', 'paid in']) or any(t in tokens for t in ['cr']):
                column_map['Credit'] = index
            elif any(term in col_clean for term in ['amount']):
                column_map['Amount'] = index
            elif any(term in col_clean for term in ['balance', 'closing', 'available']):
                column_map['Balance'] = index
            else:
                column_map[str(column_name).strip()] = index
                
        return column_map
        
    def is_valid_transaction_header(self, column_map):
        """
        Determines if a table is actually a transaction table based on extracted columns.
        A valid transaction table must have a Date, Narration, and either (Debit & Credit) or Amount.
        """
        has_date = "Date" in column_map
        has_narration = "Narration" in column_map
        has_amount = ("Debit" in column_map and "Credit" in column_map) or ("Amount" in column_map) or ("Debit" in column_map) or ("Credit" in column_map)
        
        return has_date and has_narration and has_amount