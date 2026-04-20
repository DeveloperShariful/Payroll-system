// lib/api/api_invoices.ts
import axiosClient from "./axiosClient";

export const getInvoiceHistory = async () => {
  const response = await axiosClient.get("/invoices/history");
  return response.data;
};

export const generateInvoice = async (data: { job_id: number, start_date: string, end_date: string }) => {
  const response = await axiosClient.post("/invoices/generate", data);
  return response.data;
};

export const markInvoiceAsPaid = async (id: number) => {
  const response = await axiosClient.patch(`/invoices/${id}/pay`);
  return response.data;
};