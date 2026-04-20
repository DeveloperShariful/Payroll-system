# app/core/init_db.py
from sqlalchemy.orm import Session
from decimal import Decimal
from app.core.db_modern_postgres import ModernSessionLocal, MODERN_ENGINE, BaseModern
from app.models.modern_postgres.table_user import User, UserRole
from app.models.modern_postgres.table_department import Department
from app.models.modern_postgres.table_customer import Customer
from app.models.modern_postgres.table_employee import Employee
from app.models.modern_postgres.table_payroll import Payroll
from app.models.modern_postgres.table_timesheet import Timesheet
from app.models.modern_postgres.table_audit_log import AuditLog
from app.models.modern_postgres.table_migration_logs import MigrationLog
from app.models.modern_postgres.table_payroll_rules import PayrollRule
from app.core.security import get_password_hash
from app.models.modern_postgres.table_job import Job
from app.models.modern_postgres.table_assignment import AssignmentTracking
from app.models.modern_postgres.table_invoice import Invoice

def setup_admin():
    db = ModernSessionLocal()
    try:
        BaseModern.metadata.drop_all(bind=MODERN_ENGINE)
        BaseModern.metadata.create_all(bind=MODERN_ENGINE)

        if not db.query(Department).filter(Department.id == 1).first():
            db.add(Department(id=1, name="HR & General", department_code="HR-001", is_active=True))

        if not db.query(PayrollRule).first():
            db.add_all([
                PayrollRule(rule_name="Default Federal Tax", rule_type="FEDERAL_TAX", percentage_rate=Decimal('0.1500')),
                PayrollRule(rule_name="Default State Tax", rule_type="STATE_TAX", percentage_rate=Decimal('0.0500')),
                PayrollRule(rule_name="Standard Union Dues", rule_type="UNION_DUES", percentage_rate=Decimal('0.0250'))
            ])

        admin_email = "admin@payrollsystem.com"
        if not db.query(User).filter(User.email == admin_email).first():
            db.add(User(
                email=admin_email,
                hashed_password=get_password_hash("Admin@12345!"),
                role=UserRole.ADMIN,
                is_active=True
            ))
            
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    setup_admin()