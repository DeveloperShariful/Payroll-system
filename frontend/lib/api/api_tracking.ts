// frontend/lib/api/api_tracking.ts
import axiosClient from "./axiosClient";
import { Job, Assignment } from "../../types";

export const getJobsByCustomer = async (customerId: number): Promise<Job[]> => {
  const response = await axiosClient.get(`/tracking/jobs/${customerId}`);
  return response.data;
};

export const createJob = async (data: Partial<Job>): Promise<Job> => {
  const response = await axiosClient.post("/tracking/jobs", data);
  return response.data;
};

export const getAssignmentsByJob = async (jobId: number): Promise<Assignment[]> => {
  const response = await axiosClient.get(`/tracking/assignments/${jobId}`);
  return response.data;
};

export const assignEmployee = async (data: any): Promise<Assignment> => {
  const response = await axiosClient.post("/tracking/assignments", data);
  return response.data;
};

export const getAssignmentsByEmployee = async (empId: number): Promise<any[]> => {
  const response = await axiosClient.get(`/tracking/assignments/employee/${empId}`);
  return response.data;
};