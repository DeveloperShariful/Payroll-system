// frontend/app/(dashboard)/dashboard/_components/SupervisorDashboard/SupervisorDashboardMain.tsx
"use client";

import { Users, Clock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { approveTimesheet } from "@/lib/api/api_timesheets";

export default function SupervisorDashboardMain({ data, userRole }: { data: any; userRole: string }) {
  const [isApproving, setIsApproving] = useState<number | null>(null);
  const [activities, setActivities] = useState(data?.recent_activity || []);

  const handleQuickApprove = async (idStr: string) => {
    // Extract actual numeric ID from string like "req_45"
    const timesheetId = parseInt(idStr.split("_")[1]);
    if (isNaN(timesheetId)) return;

    setIsApproving(timesheetId);
    try {
      await approveTimesheet(timesheetId, "APPROVED", "Quick Approved via Dashboard");
      // Remove from local list to simulate real-time update
      setActivities(activities.filter((act: any) => act.id !== idStr));
    } catch (err: any) {
      alert("Failed to approve. Please go to full Timesheets page.");
    } finally {
      setIsApproving(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Labor Supervision Portal
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-200">
              {userRole} ACCESS
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor workforce availability and approve daily labor hours.
          </p>
        </div>
      </div>

      {/* 2. SUPERVISOR KPI RIBBON */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Timesheets Awaiting Approval</p>
            <div className="p-2 bg-amber-50 rounded-lg"><Clock className="w-5 h-5 text-amber-600" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-amber-600">{data?.kpi?.pending_approvals || 0}</p>
            <p className="text-sm text-gray-500 ml-1">Requires your action</p>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md border-t-4 border-t-blue-500">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Active Labor Force</p>
            <div className="p-2 bg-blue-50 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{data?.kpi?.total_labor || 0}</p>
            <p className="text-sm text-gray-500 ml-1">Workers on site</p>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md border-t-4 border-t-green-500">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Approved This Week</p>
            <div className="p-2 bg-green-50 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{data?.kpi?.approved_this_week || 0}</p>
            <p className="text-sm text-gray-500 ml-1">Ready for HR Payroll</p>
          </div>
        </div>
      </div>

      {/* 3. QUICK ACTIONS & ROSTER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pending Approvals Quick Roster */}
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden flex flex-col">
          <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex justify-between items-center">
            <h2 className="text-base font-bold text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Action Required: Pending Approvals
            </h2>
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded font-bold">
              {activities.length} Recent
            </span>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto max-h-[400px]">
            {activities.length > 0 ? (
              <ul className="space-y-4">
                {activities.map((act: any) => {
                  const tsId = parseInt(act.id.split("_")[1]);
                  return (
                    <li key={act.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{act.message}</p>
                        <p className="text-xs text-gray-500 mt-1">Submitted on: {act.date}</p>
                      </div>
                      <button 
                        onClick={() => handleQuickApprove(act.id)}
                        disabled={isApproving === tsId}
                        className="w-full sm:w-auto px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs rounded-md shadow-sm hover:bg-emerald-100 disabled:opacity-50 flex items-center justify-center gap-1 transition-all"
                      >
                        {isApproving === tsId ? "Approving..." : <><CheckCircle2 className="w-4 h-4" /> Quick Approve</>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-10">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
                <p className="font-medium text-gray-900">All caught up!</p>
                <p className="text-sm mt-1">No timesheets are waiting for your approval.</p>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <Link href="/timesheets" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 justify-end">
              View All Timesheets <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Supervisor Worker Directory */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="border-b border-gray-100 pb-4 mb-4">
            <h2 className="text-base font-semibold text-gray-900">Workforce Management</h2>
            <p className="text-xs text-gray-500 mt-1">Access detailed labor profiles and legacy MS Access records.</p>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
            <Users className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-700">Worker Directory</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm mt-2 mb-6">
              View all laborers currently assigned to your supervision. Access their 200+ column legacy data and active status.
            </p>
            <Link href="/employees" className="px-6 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-lg shadow-sm hover:bg-indigo-700 transition-colors">
              Open Employee Directory
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}