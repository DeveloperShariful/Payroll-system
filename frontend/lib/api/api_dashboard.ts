// frontend/lib/api/api_dashboard.ts
import axiosClient from "./axiosClient";

export const getDashboardAlerts = async () => {
  const response = await axiosClient.get("/dashboard-stats/alerts");
  return response.data;
};

export const getDashboardStats = async (role: string) => {
  const rolePath = role.toLowerCase() === "hr_manager" ? "hr" : role.toLowerCase();
  const response = await axiosClient.get(`/dashboard-stats/${rolePath}`);
  return response.data;
};