from fastapi import APIRouter, UploadFile, File
from fastapi.responses import Response
import shutil
import os
from backend.service import FinanceService
from backend.analytics import calculate_financial_health
from backend.budget_store import get_budget, save_budget
from fastapi import Body
from backend.transaction_store import get_transactions
from backend.budget import analyze_budget
from backend.recurring_service import get_recurring_payments
from backend.dashboard_service import DashboardService
from backend.forecast_service import ForecastService
from backend.report_service import ReportService
from fastapi import Depends
from backend.auth.dependencies import get_current_user

router = APIRouter()
service = FinanceService()
dashboard_service = DashboardService()
forecast_service = ForecastService()
report_service = ReportService()

@router.get("/health")
def health():
    from backend.database.connection import get_client
    try:
        get_client().admin.command('ping')
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "ai_router": "ready",
        "version": "1.0"
    }

@router.get("/ready")
def ready():
    from backend.database.connection import get_client
    from fastapi import HTTPException
    try:
        get_client().admin.command('ping')
        return {"status": "ready"}
    except Exception:
        raise HTTPException(status_code=503, detail="Service not ready")


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...), current_user = Depends(get_current_user)):

    os.makedirs("uploads", exist_ok=True)

    file_path = f"uploads/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = service.analyze(file_path, filename=file.filename)

    return result

@router.get("/budget")
def read_budget(current_user = Depends(get_current_user)):
    return get_budget()

@router.put("/budget")
def update_budget(budget: dict = Body(...), current_user = Depends(get_current_user)):

    print("Received:", budget)

    save_budget(budget)

    print("Stored:", get_budget())

    return {
        "message": "Budget updated successfully",
        "budget": get_budget()
    }

@router.get("/budget-analysis")
def budget_analysis(current_user = Depends(get_current_user)):

    transactions = get_transactions()

    if not transactions:
        return []

    category_totals = calculate_financial_health(
        transactions
    )["category_totals"]

    return analyze_budget(category_totals)

@router.get("/recurring")
def recurring_payments(current_user = Depends(get_current_user)):
    return get_recurring_payments()


@router.get("/dashboard")
def get_dashboard(current_user = Depends(get_current_user)):
    """
    Aggregated dashboard endpoint.
    Delegates entirely to DashboardService — no business logic here.
    """
    return dashboard_service.get_dashboard()


@router.get("/forecast")
def get_forecast(current_user = Depends(get_current_user)):
    """
    Spending forecast & cash-flow prediction endpoint.
    Delegates entirely to ForecastService — no business logic here.
    """
    return forecast_service.get_forecast()


@router.get("/report")
def get_report(format: str = "pdf", current_user = Depends(get_current_user)):
    """
    Financial Report download endpoint.
    Delegates entirely to ReportService — no business logic here.
    Returns a downloadable PDF file.
    """
    from datetime import date
    filename = f"Financial_Report_{date.today().isoformat()}.pdf"
    pdf_bytes = report_service.generate_pdf()
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )


@router.get("/transactions")
def list_transactions(current_user = Depends(get_current_user)):
    """
    Returns all transactions in the store.
    """
    return get_transactions()