import os
import logging
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import PyMongoError
from backend.database.connection import get_db

logger = logging.getLogger(__name__)

def init_db():
    """
    Initializes the database collections and indexes.
    Executes automatically during startup.
    """
    db = get_db()
    if db is None:
        logger.error("Database connection failed, skipping initialization.")
        return

    try:
        # Load collection names from env
        tx_col = os.getenv("COLLECTION_TRANSACTIONS", "transactions")
        stmt_col = os.getenv("COLLECTION_STATEMENTS", "statements")
        recur_col = os.getenv("COLLECTION_RECURRING", "recurring")
        forecast_col = os.getenv("COLLECTION_FORECAST", "forecasts")
        chat_col = os.getenv("COLLECTION_CHAT", "chat_history")
        
        # Transactions indexes
        db[tx_col].create_index([("userId", ASCENDING)])
        db[tx_col].create_index([("merchant", ASCENDING)])
        db[tx_col].create_index([("category", ASCENDING)])
        db[tx_col].create_index([("date", DESCENDING)])
        db[tx_col].create_index([("statementId", ASCENDING)])
        # Compound indexes for transactions
        db[tx_col].create_index([("userId", ASCENDING), ("date", DESCENDING)])
        db[tx_col].create_index([("userId", ASCENDING), ("category", ASCENDING)])
        
        # Statements index
        db[stmt_col].create_index([("hash", ASCENDING)], unique=True)
        db[stmt_col].create_index([("userId", ASCENDING)])

        # Recurring indexes
        db[recur_col].create_index([("merchant", ASCENDING)])
        
        # Forecast indexes
        db[forecast_col].create_index([("userId", ASCENDING), ("month", ASCENDING)])
        
        # Chat indexes
        db[chat_col].create_index([("userId", ASCENDING), ("createdAt", DESCENDING)])
        
        logger.info("Successfully initialized MongoDB indexes.")
        
    except PyMongoError as e:
        logger.error(f"Error initializing MongoDB indexes: {e}")
