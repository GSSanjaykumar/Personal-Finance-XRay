import pytest
from unittest.mock import patch, MagicMock
from parsers.pdf_parser import PDFParser

class MockPage:
    def __init__(self, text, tables):
        self._text = text
        self._tables = tables
        
    def extract_text(self):
        return self._text
        
    def extract_tables(self):
        return self._tables

@pytest.fixture
def parser():
    return PDFParser()

def mock_pdf(pages_data):
    mock = MagicMock()
    mock.pages = [MockPage(p["text"], p["tables"]) for p in pages_data]
    mock.__enter__.return_value = mock
    return mock

LONG_TEXT = "This is a sufficiently long dummy text to pass the OCR validation check inside pdf_parser.py which requires at least 50 chars..."

def test_metadata_then_transactions(parser):
    with patch("pdfplumber.open") as mock_open:
        mock_open.return_value = mock_pdf([
            {
                "text": LONG_TEXT,
                "tables": [
                    # Metadata table
                    [["Account Name", "John Doe"], ["Account Number", "123456789"]],
                    # Transaction table
                    [
                        ["Date", "Narration", "Debit", "Credit", "Balance"],
                        ["01/08/2026", "Grocery", "50.00", "", "1000.00"],
                        ["02/08/2026", "Salary", "", "2000.00", "3000.00"]
                    ]
                ]
            }
        ])
        
        txns = parser.read_pdf("dummy.pdf")
        assert len(txns) == 2
        assert txns[0].amount == 50.0
        assert txns[0].transaction_type == "Debit"
        assert txns[1].amount == 2000.0
        assert txns[1].transaction_type == "Credit"

def test_amount_with_type(parser):
    with patch("pdfplumber.open") as mock_open:
        mock_open.return_value = mock_pdf([
            {
                "text": LONG_TEXT,
                "tables": [
                    [
                        ["Txn Date", "Description", "Amount", "Balance"],
                        ["01-08-2026", "Rent", "1500.00 Dr", "5000.00"],
                        ["02-08-2026", "Refund", "100.00 Cr", "5100.00"]
                    ]
                ]
            }
        ])
        
        txns = parser.read_pdf("dummy.pdf")
        assert len(txns) == 2
        assert txns[0].transaction_type == "Debit"
        assert txns[0].amount == 1500.0
        assert txns[1].transaction_type == "Credit"
        assert txns[1].amount == 100.0

def test_negative_positive_amount(parser):
    with patch("pdfplumber.open") as mock_open:
        mock_open.return_value = mock_pdf([
            {
                "text": LONG_TEXT,
                "tables": [
                    [
                        ["Value Date", "Particulars", "Transaction Amount", "Balance"],
                        ["01-08-2026", "Rent", "-1500.00", "5000.00"],
                        ["02-08-2026", "Refund", "100.00", "5100.00"],
                        ["03-08-2026", "Coffee", "(5.00)", "5095.00"]
                    ]
                ]
            }
        ])
        
        txns = parser.read_pdf("dummy.pdf")
        assert len(txns) == 3
        assert txns[0].transaction_type == "Debit"
        assert txns[0].amount == 1500.0
        assert txns[1].transaction_type == "Credit"
        assert txns[1].amount == 100.0
        assert txns[2].transaction_type == "Debit"
        assert txns[2].amount == 5.0

def test_multiline_narration(parser):
    with patch("pdfplumber.open") as mock_open:
        mock_open.return_value = mock_pdf([
            {
                "text": LONG_TEXT,
                "tables": [
                    [
                        ["Date", "Narration", "Debit", "Credit", "Balance"],
                        ["01/08/2026", "UPI/AMAZON", "1250.00", "", "1000.00"],
                        ["", "PAY/AMAZON@HDFC", "", "", ""],
                        ["", "REF: 123456", "", "", ""]
                    ]
                ]
            }
        ])
        
        txns = parser.read_pdf("dummy.pdf")
        assert len(txns) == 1
        assert "UPI/AMAZON PAY/AMAZON@HDFC REF: 123456" in txns[0].raw_description

def test_missing_balance_and_withdrawal_deposit(parser):
    with patch("pdfplumber.open") as mock_open:
        mock_open.return_value = mock_pdf([
            {
                "text": LONG_TEXT,
                "tables": [
                    [
                        ["Date", "Remarks", "Withdrawal", "Deposit"],
                        ["01/08/2026", "Snack", "10.00", ""]
                    ]
                ]
            }
        ])
        
        txns = parser.read_pdf("dummy.pdf")
        assert len(txns) == 1
        assert txns[0].amount == 10.0
        assert txns[0].transaction_type == "Debit"
        assert txns[0].balance == 0.0

def test_repeated_headers(parser):
    with patch("pdfplumber.open") as mock_open:
        mock_open.return_value = mock_pdf([
            {
                "text": LONG_TEXT,
                "tables": [
                    [
                        ["Date", "Narration", "Debit", "Credit"],
                        ["01/08/2026", "Txn 1", "10", ""]
                    ]
                ]
            },
            {
                "text": LONG_TEXT,
                "tables": [
                    [
                        ["Date", "Narration", "Debit", "Credit"],
                        ["02/08/2026", "Txn 2", "20", ""]
                    ]
                ]
            }
        ])
        
        txns = parser.read_pdf("dummy.pdf")
        assert len(txns) == 2

def test_unsupported_statement(parser):
    with patch("pdfplumber.open") as mock_open:
        mock_open.return_value = mock_pdf([
            {
                "text": LONG_TEXT,
                "tables": []
            }
        ])
        
        with pytest.raises(ValueError, match="Unsupported Statement"):
            parser.read_pdf("dummy.pdf")
            
def test_image_only_pdf(parser):
    with patch("pdfplumber.open") as mock_open:
        mock_open.return_value = mock_pdf([
            {
                "text": "", # Empty text means OCR required
                "tables": []
            }
        ])
        
        with pytest.raises(ValueError, match="OCR support is required"):
            parser.read_pdf("dummy.pdf")
