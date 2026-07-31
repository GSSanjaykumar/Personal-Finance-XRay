import backend.config  # MUST be the first import to load env before services initialize

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError
import logging

from backend.routes import router
from backend.api.chat import chat_router
from backend.api.auth_routes import router as auth_router
from backend.database.init_db import init_db
from backend.middleware import RequestContextMiddleware

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application starting up...")
    
    # Initialize DB (which connects to Mongo and creates indexes)
    init_db()
    
    logger.info("Application startup complete.")
    yield
    logger.info("Application shutting down...")

app = FastAPI(
    title="Personal Finance X-Ray",
    version="1.0",
    lifespan=lifespan
)

# Custom Middleware (applied first so it wraps CORS as well, though order with CORS can be tricky; Starlette executes bottom-up for add_middleware)
app.add_middleware(RequestContextMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(router)
app.include_router(chat_router)

@app.exception_handler(PyMongoError)
async def pymongo_exception_handler(request: Request, exc: PyMongoError):
    logger.error(f"Database error on {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=503,
        content={
            "detail": "Database service is temporarily unavailable. Please try again later.",
            "error_type": "DatabaseError"
        },
    )