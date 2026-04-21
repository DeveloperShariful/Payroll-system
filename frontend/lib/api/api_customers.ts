// frontend/lib/api/api_customers.ts
import axiosClient from "./axiosClient";
import { Customer } from "../../types";

/**
 * 1. GET ALL CUSTOMERS (With Search, Status Filter & Pagination)
 * -----------------------------------------------------------
 * Essential for managing 93,000+ records without crashing the server.
 * @param search - Search by company name, code or email
 * @param isActive - Filter by status (Active/Inactive)
 * @param limit - Number of records per batch (default 100)
 * @param offset - Starting point for the next batch
 */
export const getCustomers = async (
  search?: string, 
  isActive?: boolean, 
  limit: number = 100, 
  offset: number = 0
): Promise<Customer[]> => {
  const params = new URLSearchParams();
  
  if (search) params.append("search", search);
  
  // Handle optional boolean status filter
  if (isActive !== undefined) {
    params.append("is_active", isActive.toString());
  }

  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  const response = await axiosClient.get("/customers/", { params });
  return response.data;
};

/**
 * 2. GET SINGLE CUSTOMER DETAILS
 * ------------------------------
 * Fetches the master record including JSONB compliance trackers and legacy metadata.
 */
export const getCustomerById = async (id: number): Promise<Customer> => {
  const response = await axiosClient.get(`/customers/${id}`);
  return response.data;
};

/**
 * 3. CREATE NEW CUSTOMER
 * ----------------------
 * Primary endpoint for adding new clients to the relational database.
 */
export const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
  const response = await axiosClient.post("/customers/", data);
  return response.data;
};

/**
 * 4. UPDATE CUSTOMER PROFILE (MATCHES THE NEW EDIT DRAWER)
 * ------------------------------------------------------
 * Performs a partial update (PATCH) to the database.
 * Updates core fields + Compliance JSONB + Dynamic JSONB fields.
 */
export const updateCustomer = async (id: number, data: Partial<Customer>): Promise<Customer> => {
  // Enterprise Standard: We use PATCH to only send changed fields
  const response = await axiosClient.patch(`/customers/${id}`, data);
  return response.data;
};

/**
 * 5. DELETE CUSTOMER (SOFT DELETE)
 * --------------------------------
 * In enterprise payroll systems, we never "hard delete" financial records.
 * This triggers a soft-delete in the backend using the AuditTrailMixin.
 */
export const deleteCustomer = async (id: number): Promise<{ message: string }> => {
  const response = await axiosClient.delete(`/customers/${id}`);
  return response.data;
};

/**
 * 6. BULK EXPORT CUSTOMERS (EXCEL/CSV HELPER)
 * -------------------------------------------
 * Although it returns data, it can be piped to an Excel downloader in the UI.
 */
export const exportCustomerList = async (search?: string, isActive?: boolean): Promise<any> => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (isActive !== undefined) params.append("is_active", isActive.toString());
  
  // Note: For export, we don't send limit/offset to get the full filtered set
  const response = await axiosClient.get("/customers/export", { params });
  return response.data;
};