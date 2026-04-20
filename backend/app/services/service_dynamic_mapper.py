# app/services/service_dynamic_mapper.py
from typing import Dict, Any, List, Tuple

class DynamicETLMapper:
    
    @staticmethod
    def extract_and_split_legacy_record(
        legacy_record: Any, 
        core_fields: List[str]
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        
        full_record_dict = {
            column.name: getattr(legacy_record, column.name) 
            for column in legacy_record.__table__.columns
        }

        core_data = {}
        for field in core_fields:
            if field in full_record_dict:
                core_data[field] = full_record_dict.pop(field)

        dynamic_attributes = full_record_dict

        return core_data, dynamic_attributes