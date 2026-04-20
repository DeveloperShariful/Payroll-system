// lib/api/api_payroll.ts
import axiosClient from "@/lib/api/axiosClient";

// =====================================
// PAYROLL PROCESSING ENDPOINTS
// =====================================

export const getReadyPayrolls = async () => {
  const response = await axiosClient.get("/payrolls/ready");
  return response.data;
};

export const processPayroll = async (payrollData: any) => {
  const response = await axiosClient.post("/payrolls/process", payrollData);
  return response.data;
};

export const getPayrollHistory = async () => {
  const response = await axiosClient.get("/payrolls/history");
  return response.data;
};

// =====================================
// MIGRATION TOOLS ENDPOINTS
// =====================================

export const getMigrationStatus = async (limit: number = 10) => {
  const response = await axiosClient.get(`/migration/status?limit=${limit}`);
  return response.data;
};

export const startMigrationBatch = async (batchSize: number) => {
  const response = await axiosClient.post(`/migration/start-batch?batch_size=${batchSize}`);
  return response.data;
};