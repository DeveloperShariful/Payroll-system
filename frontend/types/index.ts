// frontend/types/index.ts

// ==========================================
// 1. CORE & AUTH TYPES
// ==========================================
export interface User {
  id: number;
  email: string;
  role: "ADMIN" | "HR_MANAGER" | "SUPERVISOR" | "EMPLOYEE";
  is_active: boolean;
  is_locked?: boolean;
  last_login_at?: string;
  created_at: string;
}

// ==========================================
// 2. PROFILE TYPES (Customer & Employee)
// ==========================================
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
  compliance_tracking: Record<string, string>; // NEW: For License Renewals Alert
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
  compliance_tracking: Record<string, string>; // NEW: For License Renewals Alert
  dynamic_attributes: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ==========================================
// 3. TRACKING TYPES (Jobs, Assignments, Timesheets)
// ==========================================
export interface Job {
  id: number;
  customer_id: number;
  job_name: string;
  job_location?: string;
  contract_date?: string;
  wc_expire_date?: string;
  gl_expire_date?: string;
  is_active: boolean;
}

export interface Assignment {
  assignment_id: number;
  job_id: number;
  employee_id: number;
  employee_name: string;
  ssn_last_four: string;
  pay_rate: number;
  bill_rate: number;
  bill_rate_ot: number;
  start_date: string;
  is_active: boolean;
}

export interface Timesheet {
  id: number;
  employee_id: number;
  customer_id?: number;
  job_id?: number;
  work_date: string;
  regular_hours: number;
  overtime_hours: number;
  double_time_hours: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "DISPUTED" | "PROCESSED";
  supervisor_notes?: string;
  approved_by_id?: number;
}

// ==========================================
// 4. FINANCE TYPES (Payroll & Invoice)
// ==========================================
export interface PayrollRecord {
  id: number;
  employee_id: number;
  employee_name: string;
  period: string;
  gross_pay: number;
  taxes: number;
  net_pay: number;
  status: string;
  processed_at: string;
}

export interface InvoiceRecord {
  id: number;
  customer_id: number;
  job_id?: number;
  invoice_number: string;
  billing_period_start: string;
  billing_period_end: string;
  total_hours: number;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  status: "UNPAID" | "PAID" | "OVERDUE" | "VOID";
}