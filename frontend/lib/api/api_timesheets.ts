// lib/api/api_timesheets.ts
import axiosClient from "./axiosClient";

export const getMyAssignments = async () => {
  const response = await axiosClient.get("/timesheets/my-assignments");
  return response.data;
};

export const getTimesheets = async () => {
  const response = await axiosClient.get("/timesheets/");
  return response.data;
};

export const createTimesheet = async (data: any) => {
  const response = await axiosClient.post("/timesheets/", data);
  return response.data;
};

export const approveTimesheet = async (id: number, status: string, notes?: string) => {
  const response = await axiosClient.patch(`/timesheets/${id}/approve`, {
    status,
    supervisor_notes: notes
  });
  return response.data;
};