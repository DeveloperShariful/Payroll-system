// frontend/lib/api/api_payroll.ts
import axiosClient from "./axiosClient";

export const getReadyPayrolls = async () => {
  const response = await axiosClient.get("/payrolls/ready");
  return response.data;
};

export const processPayroll = async (payrollData: any) => {
  const response = await axiosClient.post("/payrolls/process", payrollData);
  return response.data;
};

export const getPayrollHistory = async (limit: number = 100, offset: number = 0) => {
  const response = await axiosClient.get(`/payrolls/history?limit=${limit}&offset=${offset}`);
  return response.data;
};