import os
from dotenv import load_dotenv
from pathlib import Path
from pymongo import MongoClient

load_dotenv(Path("backend") / ".env")

uri = os.getenv("MONGODB_URI")
print(repr(uri))

client = MongoClient(uri)
print(client.admin.command("ping"))