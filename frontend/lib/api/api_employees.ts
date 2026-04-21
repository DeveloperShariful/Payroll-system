// frontend/lib/api/api_employees.ts
import axiosClient from "./axiosClient";
import { Employee } from "../../types";

export const getEmployees = async (search?: string, deptId?: number, limit: number = 100, offset: number = 0): Promise<Employee[]> => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (deptId) params.append("dept_id", deptId.toString());
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  const response = await axiosClient.get("/employees/", { params });
  return response.data;
};

export const getEmployeeById = async (id: number): Promise<Employee> => {
  const response = await axiosClient.get(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (data: any): Promise<Employee> => {
  const response = await axiosClient.post("/employees/", data);
  return response.data;
};

// 👇 এই ফাংশনটি নতুন অ্যাড করা হলো (এটিই প্রথম এররটি ফিক্স করবে)
export const updateEmployee = async (id: number, data: Partial<Employee>): Promise<Employee> => {
  const response = await axiosClient.patch(`/employees/${id}`, data);
  return response.data;
};