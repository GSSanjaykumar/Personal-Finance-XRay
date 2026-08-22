import pdfplumber
from parsers.header_mapper import HeaderMapper
from parsers.transaction_converter import TransactionConverter

class PDFParser:

    def read_pdf(self, pdf_path):
        transactions = []
        mapper = HeaderMapper()
        converter = TransactionConverter()
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                # Check if it has readable text at all
                total_text = ""
                for page in pdf.pages[:3]:
                    text = page.extract_text()
                    if text:
                        total_text += text
                
                if len(total_text.strip()) < 50:
                    raise ValueError("Scanned/image-only statement detected. OCR support is required for this statement.")
                
                print("=" * 50)
                print("PDF Opened Successfully")
                print("=" * 50)
                print(f"Total Pages : {len(pdf.pages)}\n")

                for page_number, page in enumerate(pdf.pages, start=1):
                    tables = page.extract_tables()
                    if not tables:
                        continue
                        
                    for table_number, table in enumerate(tables, start=1):
                        if not table or len(table) < 2:
                            continue # Skip empty or header-only tables

                        header = table[0]
                        column_map = mapper.create_mapping(header)
                        
                        # Only process tables that have transaction headers
                        if not mapper.is_valid_transaction_header(column_map):
                            continue
                            
                        # Iterate through rows, handling continuations
                        pending_row_data = None
                        
                        # Helper for safe row access
                        def get_row_val(r, col_name):
                            if col_name in column_map:
                                idx = column_map[col_name]
                                if idx < len(r):
                                    return str(r[idx] or "").strip()
                            return ""
                            
                        for row in table[1:]:
                            if not row:
                                continue
                                
                            # Extract key fields to determine if this is a new row or continuation
                            date_val = get_row_val(row, "Date")
                            desc_val = get_row_val(row, "Narration")
                            
                            has_date = bool(date_val)
                            
                            if has_date:
                                # New transaction row found. First, convert and append the pending one if exists
                                if pending_row_data:
                                    txn = converter.convert(pending_row_data, column_map, bank_name="Unknown")
                                    if txn:
                                        transactions.append(txn)
                                        
                                # Start new pending row
                                pending_row_data = list(row) # copy
                            else:
                                # Continuation row
                                if pending_row_data and desc_val:
                                    # Append description
                                    curr_desc = get_row_val(pending_row_data, "Narration")
                                    if curr_desc:
                                        curr_desc += " " + desc_val
                                    else:
                                        curr_desc = desc_val
                                        
                                    if "Narration" in column_map:
                                        idx = column_map["Narration"]
                                        # Ensure list is long enough
                                        while len(pending_row_data) <= idx:
                                            pending_row_data.append("")
                                        pending_row_data[idx] = curr_desc

                        # Flush the last pending row in this table
                        if pending_row_data:
                            txn = converter.convert(pending_row_data, column_map, bank_name="Unknown")
                            if txn:
                                transactions.append(txn)
        except Exception as e:
            if isinstance(e, ValueError) and "OCR" in str(e):
                raise
            print(f"Error parsing PDF: {e}")
            
        if not transactions:
            raise ValueError("Unsupported Statement: Finance X-Ray couldn't extract any transactions from this document. Please check the format.")
            
        return transactions