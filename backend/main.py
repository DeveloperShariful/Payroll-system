# app/main.py
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config_settings import settings
from app.core.db_modern_postgres import MODERN_ENGINE, BaseModern
from app.core.middleware_logging import EnterpriseLoggingMiddleware

# Import all routers
from app.api.v1 import (
    route_auth,
    route_employees, 
    route_customers,
    route_payroll, 
    route_migration,
    route_timesheet,
    route_audit,
    route_reports,
    route_dashboard,
    route_users,
    route_tracking,
    route_invoices
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

BaseModern.metadata.create_all(bind=MODERN_ENGINE)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Enterprise Labor Staffing API - MS Access Migration",
    docs_url="/api/docs",
)

app.add_middleware(EnterpriseLoggingMiddleware)

# ==========================================
# ⚠️ DYNAMIC CORS SETTINGS FOR PRODUCTION
# ==========================================
# By default, allow localhost. In production, we read the Vercel frontend URL from the .env file.
allowed_origins = ["http://localhost:3000"]

# We will set FRONTEND_URL in Render's Environment Variables later (e.g. https://payroll.vercel.app)
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

# Register all API Endpoints
app.include_router(route_auth.router, prefix="/api/v1")
app.include_router(route_dashboard.router, prefix="/api/v1")
app.include_router(route_users.router, prefix="/api/v1")
app.include_router(route_customers.router, prefix="/api/v1")
app.include_router(route_employees.router, prefix="/api/v1")
app.include_router(route_tracking.router, prefix="/api/v1")
app.include_router(route_invoices.router, prefix="/api/v1")
app.include_router(route_timesheet.router, prefix="/api/v1")
app.include_router(route_payroll.router, prefix="/api/v1")
app.include_router(route_migration.router, prefix="/api/v1")
app.include_router(route_reports.router, prefix="/api/v1")
app.include_router(route_audit.router, prefix="/api/v1")

@app.get("/")
def health_check():
    return {"system": settings.PROJECT_NAME, "status": "Online"}

if __name__ == "__main__":
    import uvicorn
    # ONLY used for local testing. Render ignores this block.
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)