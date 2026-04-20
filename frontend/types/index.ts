// src/types/index.ts
export interface User {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface BankDetails {
  bank_name: string;
  account_number: string;
  routing_number: string;
  account_type: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone_number: string;
}

export interface UnionInfo {
  is_union_member: boolean;
  union_local_number?: string;
}

export interface EmployeeDynamicAttributes {
  bank_details?: BankDetails;
  emergency_contact?: EmergencyContact;
  union_info?: UnionInfo;
  legacy_custom_fields?: Record<string, any>;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  department_id: number;
  customer_id?: number;
  hire_date: string;
  ssn_last_four?: string;
  is_active: boolean;
  legacy_id?: string;
  dynamic_attributes: EmployeeDynamicAttributes;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  customer_code: string;
  industry?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  legacy_id?: string;
  dynamic_attributes: Record<string, any>;
  created_at: string;
  updated_at: string;
}