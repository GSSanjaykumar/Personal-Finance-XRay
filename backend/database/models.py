from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class MongoDocument(BaseModel):
    id: Optional[str] = Field(None, alias="_id")

class UserDocument(MongoDocument):
    email: str
    google_sub: Optional[str] = None
    password_hash: Optional[str] = None
    provider: str = "local"
    picture: Optional[str] = None
    is_active: bool = True
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class StatementDocument(MongoDocument):
    userId: str
    filename: str
    bank: str
    hash: str
    transactionCount: int
    statementPeriod: str
    createdAt: datetime

class TransactionDocument(MongoDocument):
    userId: str
    statementId: str
    date: datetime
    raw_description: str
    normalized_description: str
    merchant: str
    category: str
    amount: float
    transaction_type: str
    balance: Optional[float] = None
    bank_name: str
    reference_number: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

class BudgetDocument(MongoDocument):
    userId: str
    budget: Dict[str, float]
    createdAt: datetime
    updatedAt: datetime

class ChatDocument(MongoDocument):
    userId: str
    question: str
    answer: str
    provider: str
    model: str
    latency: float
    intent: str
    confidence: float
    createdAt: datetime

class ForecastDocument(MongoDocument):
    userId: str
    month: str
    prediction: float
    confidence: float

class ReportDocument(MongoDocument):
    userId: str
    filePath: str
    generatedAt: datetime
