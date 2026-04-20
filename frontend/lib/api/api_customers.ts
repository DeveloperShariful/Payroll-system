// frontend/lib/api/api_customers.ts
import axiosClient from "./axiosClient";
import { Customer } from "../../types";

export const getCustomers = async (search?: string, isActive: boolean = true, limit: number = 100, offset: number = 0): Promise<Customer[]> => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  params.append("is_active", isActive.toString());
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  const response = await axiosClient.get("/customers/", { params });
  return response.data;
};

export const getCustomerById = async (id: number): Promise<Customer> => {
  const response = await axiosClient.get(`/customers/${id}`);
  return response.data;
};

export const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
  const response = await axiosClient.post("/customers/", data);
  return response.data;
};