import time
import hashlib
import logging
from datetime import datetime, timezone
from fastapi import HTTPException
from parsers.pdf_parser import PDFParser
from analytics.statistics import Statistics
from analytics.category_statistics import CategoryStatistics
from analytics.spending_analyzer import SpendingAnalyzer
from backend.insight_generator import InsightGenerator
from backend.analytics import calculate_financial_health
from backend.budget import analyze_budget
from backend.transaction_store import save_transactions
from backend.budget_insights import generate_budget_insights
from analytics.recurring_detector import RecurringDetector
from backend.repositories.statement_repository import StatementRepository
from backend.auth.user_context import UserContext
from backend.database.models import StatementDocument

logger = logging.getLogger(__name__)

class FinanceService:
    def __init__(self):
        self.parser = PDFParser()
        self.statistics = Statistics()
        self.category_statistics = CategoryStatistics()
        self.spending_analyzer = SpendingAnalyzer()
        self.insight_generator = InsightGenerator()
        self.recurring_detector = RecurringDetector()
        self.statement_repo = StatementRepository()

    def analyze(self, pdf_path, filename="unknown"):
        start_time = time.perf_counter()
        user_id = UserContext.get_current_user_id()
        
        # 1. Generate SHA-256 Hash
        hasher = hashlib.sha256()
        with open(pdf_path, 'rb') as f:
            hasher.update(f.read())
        file_hash = hasher.hexdigest()

        # 2. Check for Duplicates
        existing_stmt = self.statement_repo.find_by_hash(file_hash)
        if existing_stmt:
            logger.warning(f"Duplicate upload attempt by user {user_id} for file {filename}")
            raise HTTPException(
                status_code=409, 
                detail={
                    "message": "This statement has already been uploaded.",
                    "original_upload_time": existing_stmt.createdAt.isoformat(),
                    "original_filename": existing_stmt.filename,
                    "statement_id": str(existing_stmt.id)
                }
            )

        # 3. Parse Transactions
        parse_start = time.perf_counter()
        transactions = self.parser.read_pdf(pdf_path)
        parse_time = time.perf_counter() - parse_start
        logger.info(f"Parsed PDF {filename} in {parse_time:.4f}s")

        if not transactions:
            raise HTTPException(status_code=400, detail="No transactions could be extracted from this PDF.")

        # 4. Save Statement Metadata
        bank_name = transactions[0].bank_name if getattr(transactions[0], 'bank_name', None) else "Unknown Bank"
        
        statement_doc = StatementDocument(
            userId=user_id,
            filename=filename,
            bank=bank_name,
            hash=file_hash,
            transactionCount=len(transactions),
            statementPeriod="Unknown",
            createdAt=datetime.now(timezone.utc)
        )
        statement_id = self.statement_repo.save_statement(statement_doc)
        logger.info(f"Created statement record {statement_id}")

        # 5. Save Transactions with Rollback Strategy
        db_start = time.perf_counter()
        try:
            save_transactions(transactions, statement_id=statement_id)
        except Exception as e:
            logger.error(f"Failed to bulk insert transactions. Triggering rollback. Error: {e}")
            self.statement_repo.delete({"_id": statement_id})
            raise HTTPException(status_code=500, detail="Database error during upload. Rollback successful.")
            
        db_time = time.perf_counter() - db_start
        logger.info(f"Inserted {len(transactions)} transactions in {db_time:.4f}s")

        # 6. Generate Metrics (Dashboard/Analytics)
        metrics_start = time.perf_counter()
        health = calculate_financial_health(transactions)
        budget = analyze_budget(health["category_totals"])
        budget_insights = generate_budget_insights(budget)
        expense_by_category, total_expense = self.spending_analyzer.analyze(transactions)
        recurring = self.recurring_detector.detect(transactions)
        metrics_time = time.perf_counter() - metrics_start
        logger.info(f"Generated dashboard metrics in {metrics_time:.4f}s")

        total_time = time.perf_counter() - start_time
        logger.info(f"Total analyze pipeline executed in {total_time:.4f}s")

        return {
            "transactions": transactions,
            "health": health,
            "summary": {
                "income": self.statistics.total_income(transactions),
                "expense": self.statistics.total_expense(transactions),
                "savings": self.statistics.net_savings(transactions),
                "transactions": self.statistics.total_transactions(transactions)
            },
            "category_summary": self.category_statistics.category_summary(transactions),
            "spending": {
                "total_expense": total_expense,
                "by_category": expense_by_category
            },
            "budget": budget,
            "recurring": recurring,
            "budget_insights": budget_insights,
            "insights": self.insight_generator.generate(health)
        }