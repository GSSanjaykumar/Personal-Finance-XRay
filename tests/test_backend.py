import pytest
from fastapi.testclient import TestClient
from backend.app import app
from backend.analytics import calculate_financial_health
from backend.budget import analyze_budget
from parsers.schema import Transaction
from datetime import datetime

client = TestClient(app)

@pytest.fixture
def sample_health_transactions():
    t1 = Transaction(
        transaction_id="1", date=datetime.now(), raw_description="Salary", normalized_description="Salary",
        merchant_name="Employer", category="Income", amount=1000.0, transaction_type="Credit", balance=1000.0,
        bank_name="Test Bank", reference_number="111"
    )
    t2 = Transaction(
        transaction_id="2", date=datetime.now(), raw_description="Groceries", normalized_description="Groceries",
        merchant_name="Supermarket", category="Food", amount=200.0, transaction_type="Debit", balance=800.0,
        bank_name="Test Bank", reference_number="222"
    )
    return [t1, t2]

def test_calculate_financial_health(sample_health_transactions):
    health = calculate_financial_health(sample_health_transactions)
    assert health["income"] == 1000.0
    assert health["expense"] == 200.0
    assert health["savings"] == 800.0
    assert health["score"] == 100
    assert health["category_totals"]["Food"] == 200.0

def test_analyze_budget():
    category_totals = {"Food": 12000.0, "Entertainment": 5000.0}
    # default budget is 10000
    result = analyze_budget(category_totals)
    food_budget = next(b for b in result if b["category"] == "Food")
    ent_budget = next(b for b in result if b["category"] == "Entertainment")
    
    assert food_budget["status"] == "Exceeded"
    assert food_budget["percentage"] == 120.0
    
    assert ent_budget["status"] == "Within Budget"
    assert ent_budget["percentage"] == 50.0

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "running", "project": "Personal Finance X-Ray"}

def test_budget_endpoints():
    budget_data = {"Food": 5000, "Rent": 20000}
    response = client.put("/budget", json=budget_data)
    assert response.status_code == 200
    assert response.json()["message"] == "Budget updated successfully"
    assert response.json()["budget"] == budget_data

    response = client.get("/budget")
    assert response.status_code == 200
    assert response.json() == budget_data

def test_recurring_endpoint():
    """GET /recurring should return 200 with a list (empty if no uploads)."""
    response = client.get("/recurring")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
