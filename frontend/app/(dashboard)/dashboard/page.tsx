// frontend/app/(dashboard)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import axiosClient from "@/lib/api/axiosClient";

// Import Role-Based Dashboard Components
import AdminDashboardMain from "./_components/AdminDashboard/AdminDashboardMain";
import HRDashboardMain from "./_components/HRDashboard/HRDashboardMain";
import SupervisorDashboardMain from "./_components/SupervisorDashboard/SupervisorDashboardMain";
import EmployeeDashboardMain from "./_components/EmployeeDashboard/EmployeeDashboardMain";

export default function DashboardControllerPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const role = user?.role || "EMPLOYEE";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // Determine the correct API endpoint based on the user's role
        let endpoint = "/dashboard-stats/employee";
        if (role === "ADMIN") endpoint = "/dashboard-stats/admin";
        else if (role === "HR_MANAGER") endpoint = "/dashboard-stats/hr";
        else if (role === "SUPERVISOR") endpoint = "/dashboard-stats/supervisor";

        const response = await axiosClient.get(endpoint);
        setData(response.data);
        setError("");
      } catch (err) {
        setError("Failed to connect to the Analytics Engine or Unauthorized Access.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [role]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-indigo-600 animate-pulse">Loading Analytics Engine...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg max-w-lg mx-auto mt-10 border border-red-200">
        <h3 className="font-bold text-lg">Connection Error</h3>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {role === "ADMIN" && <AdminDashboardMain data={data} userRole={role} />}
      {role === "HR_MANAGER" && <HRDashboardMain data={data} userRole={role} />}
      {role === "SUPERVISOR" && <SupervisorDashboardMain data={data} userRole={role} />}
      {role === "EMPLOYEE" && <EmployeeDashboardMain data={data} userRole={role} />} 
      

      {role !== "ADMIN" && role !== "HR_MANAGER" && (
        <div className="p-8 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg mt-10">
          <h2 className="text-xl font-semibold text-gray-700">Pro UI in Progress</h2>
          <p className="mt-2">The Dashboard for the <span className="font-bold">{role}</span> role is currently under construction.</p>
        </div>
      )}
    </div>
  );
}