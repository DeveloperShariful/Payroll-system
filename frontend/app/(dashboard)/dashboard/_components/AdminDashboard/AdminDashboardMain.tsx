// frontend/app/(dashboard)/dashboard/_components/AdminDashboard/AdminDashboardMain.tsx
"use client";

import { Users, Building2, Clock, DollarSign, TrendingUp, FileText } from "lucide-react";
import ChartsSection from "./ChartsSection";
import SystemHealth from "./SystemHealth";

export default function AdminDashboardMain({ data, userRole }: { data: any; userRole: string }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Executive Overview 
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-indigo-200">
              {userRole} ACCESS
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time analytics and workforce metrics migrated from legacy databases.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2">
            <FileText className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* 2. HIGH-FIDELITY KPI RIBBON */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Active Workforce</p>
            <div className="p-2 bg-blue-50 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{data?.kpi?.total_employees || 0}</p>
            <p className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
              <TrendingUp className="w-3 h-3 mr-1" /> +4.2%
            </p>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Active Clients</p>
            <div className="p-2 bg-purple-50 rounded-lg"><Building2 className="w-5 h-5 text-purple-600" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{data?.kpi?.total_customers || 0}</p>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">YTD Payroll Expense</p>
            <div className="p-2 bg-emerald-50 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">
              ${data?.kpi?.ytd_payroll_expense?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || "0.00"}
            </p>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-orange-200 p-6 transition-all hover:shadow-md relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
            <div className="p-2 bg-orange-50 rounded-lg"><Clock className="w-5 h-5 text-orange-600" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-orange-600">{data?.kpi?.pending_approvals || 0}</p>
            <p className="text-sm text-gray-500 ml-1">Requires action</p>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE SECTION: CHARTS */}
      <ChartsSection data={data?.charts} />

      {/* 4. BOTTOM SECTION: HEALTH & LOGS */}
      <SystemHealth activityData={data?.recent_activity} />

    </div>
  );
}