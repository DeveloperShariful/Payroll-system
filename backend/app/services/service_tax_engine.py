# app/services/service_tax_engine.py
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.modern_postgres.table_payroll_rules import PayrollRule

class SpecializedLaborTaxEngine:
    
    @staticmethod
    def get_rule_rate(db: Session, rule_type: str, state_code: str = None) -> Decimal:
        query = db.query(PayrollRule).filter(PayrollRule.rule_type == rule_type, PayrollRule.is_active == True)
        if state_code:
            query = query.filter(PayrollRule.state_code == state_code)
        
        rule = query.first()
        return rule.percentage_rate if rule else Decimal('0.0000')

    @staticmethod
    def calculate_federal_tax(db: Session, gross_pay: Decimal, dependents: int = 0) -> Decimal:
        taxable_amount = max(Decimal('0.00'), gross_pay - (Decimal('50.00') * dependents))
        rate = SpecializedLaborTaxEngine.get_rule_rate(db, "FEDERAL_TAX")
        return round(taxable_amount * rate, 4)

    @staticmethod
    def calculate_union_dues(db: Session, gross_pay: Decimal, is_union_member: bool) -> Decimal:
        if not is_union_member:
            return Decimal('0.00')
        rate = SpecializedLaborTaxEngine.get_rule_rate(db, "UNION_DUES")
        return round(gross_pay * rate, 4)
        
    @staticmethod
    def calculate_state_tax(db: Session, gross_pay: Decimal, state_code: str) -> Decimal:
        rate = SpecializedLaborTaxEngine.get_rule_rate(db, "STATE_TAX", state_code)
        return round(gross_pay * rate, 4)