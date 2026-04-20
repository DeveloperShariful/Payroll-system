# README.md
# Enterprise Labor Payroll Migration API

This backend is designed to migrate a complex MS Access + MS SQL Server legacy payroll application into a modern, highly scalable FastAPI + PostgreSQL architecture.

## Architecture Highlights
- **ETL Migration Engine**: Dynamically parses 200+ column MS Access tables and normalizes them into PostgreSQL `JSONB` for performance.
- **Role-Based Access Control (RBAC)**: Secure JWT-based authentication with distinct roles (Admin, HR, Supervisor, Employee).
- **Specialized Tax Engine**: Calculates complex union dues, federal, and state taxes before database insertion.
- **Audit Trails**: Enterprise-grade compliance tracking for every data mutation (Insert/Update/Delete).

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt