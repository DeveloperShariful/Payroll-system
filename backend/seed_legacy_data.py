# backend/seed_legacy_data.py
import random
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from app.core.db_modern_postgres import ModernSessionLocal

# SQLAlchemy রিলেশনশিপ ঠিক রাখার জন্য সবগুলো মডেল এখানে ইমপোর্ট করা থাকতে হবে
from app.models.modern_postgres.table_user import User
from app.models.modern_postgres.table_department import Department
from app.models.modern_postgres.table_customer import Customer
from app.models.modern_postgres.table_job import Job # <--- ইমপোর্ট করা হয়েছে
from app.models.modern_postgres.table_employee import Employee
from app.models.modern_postgres.table_assignment import AssignmentTracking # <--- ইমপোর্ট করা হয়েছে
from app.models.modern_postgres.table_timesheet import Timesheet, TimesheetStatus
from app.models.modern_postgres.table_payroll import Payroll

def generate_enterprise_dummy_data():
    db = ModernSessionLocal()
    try:
        print("🚀 Starting Enterprise Dummy Data Generation...")

        # 1. ENSURE DEFAULT DEPARTMENT
        dept = db.query(Department).filter(Department.id == 1).first()
        if not dept:
            dept = Department(id=1, name="General Labor", department_code="GEN-01", is_active=True)
            db.add(dept)
            db.commit()

        # 2. CREATE 5 DUMMY CUSTOMERS (Clients)
        print("🏢 Generating 5 Dummy Customers...")
        companies = ["Apex Construction", "Metro Logistics", "Global Manufacturing", "City Maintenance Group", "Prime Labor Solutions"]
        industries = ["Construction", "Logistics", "Manufacturing", "Facilities", "Staffing"]
        
        customers = []
        for i in range(5):
            cust_code = f"CUST-100{i+1}"
            cust = db.query(Customer).filter(Customer.customer_code == cust_code).first()
            if not cust:
                cust = Customer(
                    name=companies[i],
                    customer_code=cust_code,
                    industry=industries[i],
                    contact_email=f"contact@{companies[i].replace(' ', '').lower()}.com",
                    is_active=True
                )
                db.add(cust)
                db.commit()
                db.refresh(cust)
            customers.append(cust)

        # 3. CREATE 2 JOBS PER CUSTOMER (Total 10 Jobs)
        print("🏗️ Generating 10 Jobs (Projects)...")
        jobs = []
        for cust in customers:
            for j in range(1, 3):
                job_name = f"{cust.name} - Site Phase {j}"
                job = db.query(Job).filter(Job.job_name == job_name).first()
                if not job:
                    job = Job(
                        customer_id=cust.id,
                        job_name=job_name,
                        job_location=f"{random.randint(100, 999)} Industrial Ave",
                        is_active=True
                    )
                    db.add(job)
                    db.commit()
                    db.refresh(job)
                jobs.append(job)

        # 4. CREATE 20 DUMMY EMPLOYEES
        print("👷 Generating 20 Employees with 250 Legacy Columns each...")
        first_names = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen"]
        
        employees = []
        for i in range(20):
            email = f"{first_names[i].lower()}.{random.randint(100,999)}@laborforce.com"
            emp = db.query(Employee).filter(Employee.email == email).first()
            if not emp:
                legacy_fields = {f"Legacy_Col_{j}": f"Val_{j}" for j in range(1, 251)}
                emp = Employee(
                    first_name=first_names[i],
                    last_name="Smith",
                    email=email,
                    ssn_last_four=f"{random.randint(1000, 9999)}",
                    hire_date=(datetime.now() - timedelta(days=500)).date(),
                    is_active=True,
                    department_id=1,
                    dynamic_attributes={"legacy_custom_fields": legacy_fields}
                )
                db.add(emp)
                db.commit()
                db.refresh(emp)
            employees.append(emp)

        # 5. ASSIGN EMPLOYEES TO JOBS (The Intersection / Tracking)
        print("🔗 Assigning Employees to Jobs (Tracking)...")
        for emp in employees:
            # Check if already assigned
            existing = db.query(AssignmentTracking).filter(AssignmentTracking.employee_id == emp.id).first()
            if not existing:
                assign = AssignmentTracking(
                    job_id=random.choice(jobs).id,
                    employee_id=emp.id,
                    pay_rate=Decimal("18.50"),
                    bill_rate=Decimal("45.00"),
                    bill_rate_ot=Decimal("67.50"),
                    assignment_start_date=(datetime.now() - timedelta(days=30)).date(),
                    is_active=True
                )
                db.add(assign)
        
        db.commit()
        print("✅ SUCCESS! Enterprise Tracking Data is ready.")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    generate_enterprise_dummy_data()