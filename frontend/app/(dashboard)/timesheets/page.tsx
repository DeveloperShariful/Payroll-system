// frontend/app/(dashboard)/timesheets/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getTimesheets, approveTimesheet } from "@/lib/api/api_timesheets";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function TimesheetsPage() {
  const { user } = useAuthStore();
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const role = user?.role || "EMPLOYEE";
  const canApprove = ["ADMIN", "HR_MANAGER", "SUPERVISOR"].includes(role);

  const fetchTimesheets = async () => {
    try {
      setIsLoading(true);
      const data = await getTimesheets();
      setTimesheets(data);
    } catch (err) {
      console.error("Failed to load timesheets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, []);

  // THE 100% WORKING APPROVAL LOGIC
  const handleAction = async (id: number, status: "APPROVED" | "REJECTED") => {
    if (!confirm(`Are you sure you want to mark this timesheet as ${status}?`)) return;
    
    setActionLoadingId(id);
    try {
      await approveTimesheet(id, status, `Action taken by ${role}`);
      // Refresh list to update UI immediately
      fetchTimesheets();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to process timesheet action.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingCount = timesheets.filter(ts => ts.status === "SUBMITTED").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Timesheet Management</h1>
          <p className="mt-1 text-sm text-gray-500">Review and manage daily labor hours prior to payroll processing.</p>
        </div>
        
        {role === "EMPLOYEE" ? (
          <Link href="/timesheets/submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Clock className="w-4 h-4" /> Submit Today's Hours
          </Link>
        ) : (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-4 py-2 rounded-lg">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">
              {pendingCount} Pending Approvals
            </span>
          </div>
        )}
      </div>

      {/* DATA GRID */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Reg. Hours</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">OT Hours</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                {canApprove && (
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Supervisor Action</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">Loading timesheets...</td></tr>
              ) : timesheets.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">No timesheets found.</td></tr>
              ) : (
                timesheets.map((ts) => (
                  <tr key={ts.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ts.work_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">EMP #{ts.employee_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono bg-slate-50">{ts.regular_hours}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono bg-slate-50">{ts.overtime_hours}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        ts.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' : 
                        ts.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' : 
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {ts.status}
                      </span>
                    </td>
                    
                    {/* ONLY SHOW ACTION BUTTONS IF USER HAS PERMISSION AND STATUS IS SUBMITTED */}
                    {canApprove && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {ts.status === "SUBMITTED" ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleAction(ts.id, "APPROVED")}
                              disabled={actionLoadingId === ts.id}
                              className="flex items-center gap-1 bg-white border border-green-600 text-green-600 hover:bg-green-50 px-3 py-1.5 rounded disabled:opacity-50 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" /> Approve
                            </button>
                            <button 
                              onClick={() => handleAction(ts.id, "REJECTED")}
                              disabled={actionLoadingId === ts.id}
                              className="flex items-center gap-1 bg-white border border-red-600 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded disabled:opacity-50 transition-colors"
                            >
                              <XCircle className="w-4 h-4" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Locked (Processed)</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}