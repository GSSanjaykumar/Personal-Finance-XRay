import os
import pytest
from parsers.pdf_parser import PDFParser

def test_pdf_parser_integration():
    sample_pdf_path = "datasets/sample_statements/hdfc_sample.pdf"
    if not os.path.exists(sample_pdf_path):
        pytest.skip(f"Sample PDF not found at {sample_pdf_path}")
    
    parser = PDFParser()
    transactions = parser.read_pdf(sample_pdf_path)
    
    assert len(transactions) > 0, "No transactions parsed from PDF"
    assert transactions[0].transaction_type in ["Credit", "Debit"]
    assert transactions[0].amount > 0
