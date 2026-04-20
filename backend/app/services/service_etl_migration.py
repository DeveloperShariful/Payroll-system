# app/services/service_etl_migration.py
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.legacy_mssql.ms_access_200_cols import LegacyEmployeeMaster
from app.models.modern_postgres.table_employee import Employee
from app.models.modern_postgres.table_department import Department

def run_employee_migration_batch(legacy_db: Session, modern_db: Session, batch_size: int = 500):
    """
    Extracts 200+ column data from MS Access, Transforms it, 
    and Loads core fields to columns and legacy fields to JSONB.
    """
    try:
        # 1. Fetch from Legacy DB (Using yield_per for memory efficiency with large MS Access tables)
        legacy_records = legacy_db.query(LegacyEmployeeMaster).yield_per(batch_size).limit(batch_size).all()
        
        migrated_count = 0
        skipped_count = 0

        # Ensure a default department exists (since legacy might not have strict relations)
        default_dept = modern_db.query(Department).filter(Department.department_code == "MIG-01").first()
        if not default_dept:
            default_dept = Department(name="Legacy Migrated Dept", department_code="MIG-01")
            modern_db.add(default_dept)
            modern_db.commit()

        for old_record in legacy_records:
            # Check if already migrated
            exists = modern_db.query(Employee).filter(Employee.legacy_id == old_record.EmpID_PK).first()
            if exists:
                skipped_count += 1
                continue

            # 2. Convert SQLAlchemy object to Dictionary dynamically (Handles all 200 columns automatically)
            record_dict = {column.name: getattr(old_record, column.name) for column in old_record.__table__.columns}

            # 3. Extract Core Fields & Remove them from the dictionary
            emp_id = record_dict.pop("EmpID_PK", None)
            f_name = record_dict.pop("F_Name", "Unknown")
            l_name = record_dict.pop("L_Name", "Unknown")
            email = record_dict.pop("Email_Addr", f"migrated_{emp_id}@legacy.com")
            hire_date = record_dict.pop("Date_Of_Hire", "2000-01-01")
            is_active = record_dict.pop("Is_Active_Status_YN", True)

            # 4. The rest of the dictionary (190+ columns) is now our JSONB payload!
            dynamic_json_payload = record_dict

            # 5. Load into Modern Database
            new_employee = Employee(
                legacy_id=emp_id,
                first_name=f_name,
                last_name=l_name,
                email=email,
                hire_date=hire_date,
                is_active=is_active,
                department_id=default_dept.id,
                dynamic_attributes=dynamic_json_payload # Magic happens here!
            )
            
            modern_db.add(new_employee)
            migrated_count += 1

        # Commit batch
        modern_db.commit()
        return {"status": "success", "migrated": migrated_count, "skipped": skipped_count}

    except Exception as e:
        modern_db.rollback()
        raise HTTPException(status_code=500, detail=f"ETL Migration Failed: {str(e)}")