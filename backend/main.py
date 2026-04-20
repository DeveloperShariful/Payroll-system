# backend/main.py  (বা রুট ডিরেক্টরির main.py)
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config_settings import settings
from app.core.db_setup import MODERN_ENGINE, BaseModern
from app.core.middleware_logging import EnterpriseLoggingMiddleware

# =================================================================
# 1. IMPORT ALL CONSOLIDATED ROUTERS
# =================================================================
from app.api.v1.api_core import router_auth, router_users, router_audit
from app.api.v1.api_profiles import router_customers, router_employees
from app.api.v1.api_tracking import router_jobs_assignments, router_timesheets
from app.api.v1.api_finance import router_payrolls, router_invoices, router_reports
from app.api.v1.api_dashboard import router_dashboard
from app.services.service_migration import router_migration

# =================================================================
# 2. IMPORT MODELS TO REGISTER METADATA FOR SQLALCHEMY
# =================================================================
from app.models import models_core, models_profiles, models_tracking, models_finance

# =================================================================
# 3. SETUP & INITIALIZATION
# =================================================================
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Create all database tables based on the consolidated models
BaseModern.metadata.create_all(bind=MODERN_ENGINE)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Enterprise Labor Staffing API - MS Access Migration",
    docs_url="/api/docs",
)

# =================================================================
# 4. MIDDLEWARE CONFIGURATION
# =================================================================
# Add custom logging middleware (Tracks request time and details)
app.add_middleware(EnterpriseLoggingMiddleware)

# Dynamic CORS settings for production and local NextJS frontend
allowed_origins = ["http://localhost:3000"]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =================================================================
# 5. REGISTER API ENDPOINTS (Grouped by Domain)
# =================================================================
API_PREFIX = "/api/v1"

# Core & Admin System
app.include_router(router_auth, prefix=API_PREFIX)
app.include_router(router_users, prefix=API_PREFIX)
app.include_router(router_audit, prefix=API_PREFIX)

# Dashboard (Including Renewals Alerts)
app.include_router(router_dashboard, prefix=API_PREFIX)

# Profiles (Customers & Employees)
app.include_router(router_customers, prefix=API_PREFIX)
app.include_router(router_employees, prefix=API_PREFIX)

# Tracking (Jobs, Assignments, Timesheets)
app.include_router(router_jobs_assignments, prefix=API_PREFIX)
app.include_router(router_timesheets, prefix=API_PREFIX)

# Financial Engine (Payroll, Invoices, Reports)
app.include_router(router_payrolls, prefix=API_PREFIX)
app.include_router(router_invoices, prefix=API_PREFIX)
app.include_router(router_reports, prefix=API_PREFIX)

# Legacy Migration Engine
app.include_router(router_migration, prefix=API_PREFIX)


# =================================================================
# 6. ROOT ENDPOINT
# =================================================================
@app.get("/")
def health_check():
    return {"system": settings.PROJECT_NAME, "status": "Online"}

if __name__ == "__main__":
    import uvicorn
    # যেহেতু main.py এখন app ফোল্ডারের বাইরে (রুটে) আছে, 
    # তাই কমান্ডটি "app.main:app" এর বদলে "main:app" হবে।
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)