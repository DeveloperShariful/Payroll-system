# app/models/legacy_mssql/ms_access_200_cols.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from app.core.db_legacy_mssql import BaseLegacy

class LegacyEmployeeMaster(BaseLegacy):
    """
    1000% Real-World Scenario:
    This model represents the bloated 200-300 column table from the legacy MS Access system.
    We don't need to define all 300 columns here if we use SQLAlchemy reflection, 
    but defining the key ones explicitly helps the ETL script understand the mapping.
    """
    __tablename__ = "tbl_EmployeeMaster_Legacy" # ক্লায়েন্টের পুরোনো ডাটাবেসের আসল টেবিলের নাম

    # Primary MS Access Key
    EmpID_PK = Column(String(50), primary_key=True, index=True)

    # Core details
    F_Name = Column(String(100))
    L_Name = Column(String(100))
    Email_Addr = Column(String(150))
    Date_Of_Hire = Column(DateTime)
    Is_Active_Status_YN = Column(Boolean)

    # Legacy Bloat (The 200+ Columns we are trying to escape)
    # MS Access e onek ogochalo column thake, segulo amra read kore JSON a convert korbo
    Address_Line_1 = Column(String(255))
    Spouse_Name_Txt = Column(String(100))
    Child_1_Name = Column(String(100))
    Child_2_Name = Column(String(100))
    Covid_Vaccine_Status = Column(String(50))
    Previous_Employer_Name = Column(String(200))
    Blood_Group_Code = Column(String(10))
    Emergency_Contact_Num = Column(String(50))
    # ... Imagine 200 more columns like 'Jan_Salary_2015', 'Feb_Salary_2015' etc.
    # Note: ETL process will automatically dynamically read unmapped columns 
    # and pack them into the JSONB field of the Modern PostgreSQL model.