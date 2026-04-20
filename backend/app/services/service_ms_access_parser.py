# app/services/service_ms_access_parser.py
from datetime import datetime
from typing import Any

def clean_ms_access_boolean(value: Any) -> bool:
    """
    MS Access often stores booleans as -1 (True) and 0 (False), 
    or as the strings 'Yes'/'No'. This parses them safely for PostgreSQL.
    """
    if isinstance(value, str):
        return value.strip().lower() in ['yes', 'true', '1', 'y']
    if isinstance(value, (int, float)):
        return value != 0
    return bool(value)

def parse_legacy_date(date_str: Any) -> datetime | None:
    """
    Handles corrupted or non-standard date formats coming from legacy MS Access tables.
    Prevents the ETL pipeline from crashing on invalid dates.
    """
    if not date_str:
        return None
    if isinstance(date_str, datetime):
        return date_str
    try:
        # Attempt to parse standard MS Access datetime format
        return datetime.strptime(str(date_str).strip(), "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None

def sanitize_legacy_string(value: Any) -> str:
    """
    Removes extra spaces, carriage returns, or null bytes from legacy text fields.
    Crucial for ensuring clean data in the new NextJS frontend.
    """
    if value is None:
        return ""
    return str(value).replace('\x00', '').strip()