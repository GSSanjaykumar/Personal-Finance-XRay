from tests.conftest import TEST_USER_ID
import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from backend.service import FinanceService
from parsers.schema import Transaction
from datetime import datetime

@patch('backend.service.save_transactions')
@patch('backend.service.calculate_financial_health')
@patch('backend.service.analyze_budget')
@patch('backend.service.generate_budget_insights')
def test_duplicate_upload_detection(mock_gen, mock_analyze, mock_health, mock_save, mock_mongo, tmp_path):
    service = FinanceService()
    
    # Create a dummy PDF
    dummy_pdf = tmp_path / "dummy.pdf"
    dummy_pdf.write_bytes(b"dummy pdf content")
    
    # Mock the parser to return some transactions
    service.parser.read_pdf = MagicMock(return_value=[
        Transaction(
            transaction_id="1", date=datetime.now(), raw_description="raw", 
            normalized_description="norm", merchant_name="merch", category="cat",
            amount=10.0, transaction_type="Debit", balance=100.0, bank_name="Bank", reference_number="123"
        )
    ])
    
    # Set up realistic return values for analytics mocks
    mock_health.return_value = {"income": 100, "expense": 50, "savings": 50, "score": 80, "category_totals": {}}
    mock_analyze.return_value = {}
    mock_gen.return_value = []

    # First upload should succeed
    service.analyze(TEST_USER_ID, str(dummy_pdf), "dummy.pdf")
    
    # Second upload of the same file should raise HTTP 409
    with pytest.raises(HTTPException) as excinfo:
        service.analyze(TEST_USER_ID, str(dummy_pdf), "dummy.pdf")
        
    assert excinfo.value.status_code == 409
    assert "original_upload_time" in excinfo.value.detail

@patch('backend.service.save_transactions')
def test_rollback_on_transaction_failure(mock_save_transactions, mock_mongo, tmp_path):
    service = FinanceService()
    
    # Create a dummy PDF
    dummy_pdf = tmp_path / "dummy2.pdf"
    dummy_pdf.write_bytes(b"dummy pdf content 2")
    
    service.parser.read_pdf = MagicMock(return_value=[
        Transaction(
            transaction_id="2", date=datetime.now(), raw_description="raw", 
            normalized_description="norm", merchant_name="merch", category="cat",
            amount=10.0, transaction_type="Debit", balance=100.0, bank_name="Bank", reference_number="123"
        )
    ])
    
    # Simulate a database failure during bulk insert
    mock_save_transactions.side_effect = Exception("Database insertion failed")
    
    with pytest.raises(HTTPException) as excinfo:
        service.analyze(TEST_USER_ID, str(dummy_pdf), "dummy2.pdf")
        
    assert excinfo.value.status_code == 500
    
    # Verify that the statement was successfully deleted due to the bug fix in base_repository
    # We can check the repository directly
    statements = service.statement_repo.find_many({})
    assert len(statements) == 0, "Regression: Orphaned statement left in database after transaction rollback failure"

@patch('backend.service.save_transactions')
@patch('backend.service.calculate_financial_health')
@patch('backend.service.analyze_budget')
@patch('backend.service.generate_budget_insights')
def test_successful_upload(mock_gen, mock_analyze, mock_health, mock_save, mock_mongo, tmp_path):
    service = FinanceService()
    dummy_pdf = tmp_path / "success.pdf"
    dummy_pdf.write_bytes(b"dummy")
    
    service.parser.read_pdf = MagicMock(return_value=[
        Transaction(
            transaction_id="3", date=datetime.now(), raw_description="raw", 
            normalized_description="norm", merchant_name="merch", category="cat",
            amount=10.0, transaction_type="Debit", balance=100.0, bank_name="Bank", reference_number="123"
        )
    ])
    
    mock_health.return_value = {"income": 100, "expense": 50, "savings": 50, "score": 80, "category_totals": {}}
    mock_analyze.return_value = {}
    mock_gen.return_value = []
    
    result = service.analyze(TEST_USER_ID, str(dummy_pdf), "success.pdf")
    
    assert "transactions" in result
    assert "health" in result
    assert "summary" in result
    assert mock_save.called
    assert len(service.statement_repo.find_many({})) == 1

def test_upload_no_transactions(mock_mongo, tmp_path):
    service = FinanceService()
    dummy_pdf = tmp_path / "empty.pdf"
    dummy_pdf.write_bytes(b"dummy")
    
    service.parser.read_pdf = MagicMock(return_value=[])
    
    with pytest.raises(HTTPException) as excinfo:
        service.analyze(TEST_USER_ID, str(dummy_pdf), "empty.pdf")
    
    assert excinfo.value.status_code == 400
    assert "No transactions" in str(excinfo.value.detail)
