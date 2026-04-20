# backend/seed_legacy_data.py
import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy import text

# Core DB Setup
from app.core.db_setup import MODERN_ENGINE, ModernSessionLocal, BaseModern
from app.core.security import get_password_hash

# Consolidated Models Import (Must import all to register metadata)
from app.models.models_core import User, UserRole, Department, AuditLog, MigrationLog
from app.models.models_profiles import Customer, Employee
from app.models.models_tracking import Job, AssignmentTracking, Timesheet
from app.models.models_finance import PayrollRule, Payroll, Invoice

def generate_enterprise_dummy_data():
    print("🔄 Starting Enterprise Database Reset & Seeding...")

    # 1. FORCE DROP OLD SCHEMA (Fixes the UndefinedColumn Error)
    with MODERN_ENGINE.connect() as conn:
        print("⚠️ Forcefully dropping old corrupted schema...")
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        conn.commit()

    # 2. CREATE NEW TABLES
    print("✅ Creating fresh tables from consolidated models...")
    BaseModern.metadata.create_all(bind=MODERN_ENGINE)

    db = ModernSessionLocal()
    try:
        # 3. SETUP DEFAULT ADMIN & RULES
        print("🔑 Setting up Admin User and Payroll Rules...")
        dept = Department(id=1, name="General Labor", department_code="GEN-01", is_active=True)
        db.add(dept)

        db.add_all([
            PayrollRule(rule_name="Default Federal Tax", rule_type="FEDERAL_TAX", percentage_rate=Decimal('0.1500')),
            PayrollRule(rule_name="Default State Tax", rule_type="STATE_TAX", percentage_rate=Decimal('0.0500')),
            PayrollRule(rule_name="Standard Union Dues", rule_type="UNION_DUES", percentage_rate=Decimal('0.0250'))
        ])

        admin_user = User(
            email="admin@payrollsystem.com",
            hashed_password=get_password_hash("Admin@12345!"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)
        db.commit()

        # 4. CREATE 5 DUMMY CUSTOMERS (Clients)
        print("🏢 Generating 5 Dummy Customers...")
        companies = ["Apex Construction", "Metro Logistics", "Global Manufacturing", "City Maintenance Group", "Prime Labor Solutions"]
        customers = []
        for i, name in enumerate(companies):
            cust = Customer(
                name=name,
                customer_code=f"CUST-100{i+1}",
                industry="Construction",
                contact_email=f"contact@{name.replace(' ', '').lower()}.com",
                is_active=True
            )
            db.add(cust)
            customers.append(cust)
        db.commit()

        # 5. CREATE JOBS WITH COMPLIANCE DATES (For Dashboard Alerts)
        print("🏗️ Generating Jobs with License Expiration Dates...")
        jobs = []
        today = datetime.now(timezone.utc).date()
        for cust in customers:
            job = Job(
                customer_id=cust.id,
                job_name=f"{cust.name} - Site A",
                job_location="100 Main St",
                wc_expire_date=today - timedelta(days=random.randint(10, 50)), # Overdue Alert
                gl_expire_date=today + timedelta(days=random.randint(10, 50)), # Upcoming Alert
                is_active=True
            )
            db.add(job)
            jobs.append(job)
        db.commit()

        # 6. CREATE 20 DUMMY EMPLOYEES WITH JSONB
        print("👷 Generating 20 Employees with JSONB Data...")
        first_names = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles"]
        employees = []
        for i in range(10):
            legacy_fields = {f"Legacy_Col_{j}": f"Val_{j}" for j in range(1, 251)}
            
            emp = Employee(
                first_name=first_names[i],
                last_name="Smith",
                email=f"{first_names[i].lower()}.{i}@laborforce.com",
                ssn_last_four=f"{random.randint(1000, 9999)}",
                hire_date=today - timedelta(days=500),
                is_active=True,
                department_id=1,
                compliance_tracking={
                    "Plumbers License": str(today - timedelta(days=15)), # Overdue
                    "Electrical License": str(today + timedelta(days=30)) # Upcoming
                },
                dynamic_attributes={"legacy_custom_fields": legacy_fields}
            )
            db.add(emp)
            employees.append(emp)
        db.commit()

        # 7. ASSIGN EMPLOYEES TO JOBS
        print("🔗 Assigning Employees to Jobs (Tracking)...")
        for emp in employees:
            assign = AssignmentTracking(
                job_id=random.choice(jobs).id,
                employee_id=emp.id,
                pay_rate=Decimal("18.50"),
                bill_rate=Decimal("45.00"),
                bill_rate_ot=Decimal("67.50"),
                assignment_start_date=today - timedelta(days=30),
                is_active=True
            )
            db.add(assign)
        
        db.commit()
        print("🎉 SUCCESS! Database Reset and Enterprise Dummy Data Generated.")

    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    generate_enterprise_dummy_data()