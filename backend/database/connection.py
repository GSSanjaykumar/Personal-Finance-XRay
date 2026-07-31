import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, PyMongoError
import logging

logger = logging.getLogger(__name__)

class MongoDBConnection:
    """Singleton MongoDB Connection Manager."""
    _instance = None
    _client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDBConnection, cls).__new__(cls)
            cls._instance._init_client()
        return cls._instance

    def _init_client(self):
        uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")

        try:
            self._client = MongoClient(
            uri,
            serverSelectionTimeoutMS=5000,
            tls=True,
        )
            # Send a ping to confirm a successful connection
            self._client.admin.command('ping')
            logger.info("Successfully connected to MongoDB")
        except PyMongoError as e:
            logger.exception("MongoDB connection failed")
            raise

    @property
    def client(self) -> MongoClient:
        return self._client

    @property
    def db(self):
        db_name = os.getenv("DATABASE_NAME", "finance_xray")
        if self._client is not None:
            return self._client[db_name]
        return None

def get_db():
    return MongoDBConnection().db

def get_client():
    return MongoDBConnection().client
