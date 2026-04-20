// lib/api/api_tracking.ts
import axiosClient from "./axiosClient";

export const getJobsByCustomer = async (customerId: number) => {
  const response = await axiosClient.get(`/tracking/jobs/${customerId}`);
  return response.data;
};

export const createJob = async (data: any) => {
  const response = await axiosClient.post("/tracking/jobs", data);
  return response.data;
};

export const getAssignmentsByJob = async (jobId: number) => {
  const response = await axiosClient.get(`/tracking/assignments/${jobId}`);
  return response.data;
};

export const assignEmployee = async (data: any) => {
  const response = await axiosClient.post("/tracking/assignments", data);
  return response.data;
};