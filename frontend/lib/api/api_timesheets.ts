// frontend/lib/api/api_timesheets.ts
import axiosClient from "./axiosClient";
import { Timesheet } from "../../types";

export const getMyAssignments = async () => {
  const response = await axiosClient.get("/timesheets/my-assignments");
  return response.data;
};

export const getTimesheets = async (limit: number = 100, offset: number = 0): Promise<Timesheet[]> => {
  const response = await axiosClient.get(`/timesheets/?limit=${limit}&offset=${offset}`);
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