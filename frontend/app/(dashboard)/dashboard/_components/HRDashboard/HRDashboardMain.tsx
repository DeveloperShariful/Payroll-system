// frontend/app/(dashboard)/dashboard/_components/HRDashboard/HRDashboardMain.tsx
"use client";

import { Users, DollarSign, Calculator, Clock, DownloadCloud, Building2 } from "lucide-react";
import HRChartsSection from "./HRChartsSection";
import Link from "next/link";

export default function HRDashboardMain({ data, userRole }: { data: any; userRole: string }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Finance & HR Portal
            <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-teal-200">
              {userRole} ACCESS
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Process payroll, manage tax brackets, and overview workforce financials.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2">
            <DownloadCloud className="w-4 h-4" /> Download W-2 Reports
          </button>
        </div>
      </div>

      {/* 2. HR KPI RIBBON */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md border-t-4 border-t-teal-500">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">YTD Gross Payroll</p>
            <div className="p-2 bg-teal-50 rounded-lg"><DollarSign className="w-5 h-5 text-teal-600" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">
              ${data?.kpi?.ytd_payroll_expense?.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}
            </p>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md border-t-4 border-t-blue-500">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Active Labor Force</p>
            <div className="p-2 bg-blue-50 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{data?.kpi?.total_employees || 0}</p>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Timesheets to Process</p>
            <div className="p-2 bg-amber-50 rounded-lg"><Clock className="w-5 h-5 text-amber-600" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{data?.kpi?.pending_approvals || 0}</p>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md border-t-4 border-t-purple-500">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Active Clients</p>
            <div className="p-2 bg-purple-50 rounded-lg"><Building2 className="w-5 h-5 text-purple-600" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{data?.kpi?.total_customers || 0}</p>
          </div>
        </div>
      </div>

      {/* 3. CHARTS COMPONENT */}
      <HRChartsSection data={data?.charts} />

      {/* 4. QUICK ACTIONS & ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 border-b pb-4 mb-4">Finance & Operations Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/payroll" className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all">
              <div className="p-3 bg-white shadow-sm border border-gray-100 rounded-md"><Calculator className="w-6 h-6 text-teal-600" /></div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Run Payroll</p>
                <p className="text-xs text-gray-500">Process current cycle</p>
              </div>
            </Link>
            <Link href="/timesheets" className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all">
              <div className="p-3 bg-white shadow-sm border border-gray-100 rounded-md"><Clock className="w-6 h-6 text-blue-600" /></div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Review Timesheets</p>
                <p className="text-xs text-gray-500">Check supervisor approvals</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-6">
          <h2 className="text-base font-semibold text-amber-900 border-b border-amber-200 pb-4 mb-4">Payroll Alerts</h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm text-amber-800 bg-white p-3 rounded-md border border-amber-100 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              2 Employees have invalid Bank Routing Numbers (Migrated Data Error).
            </li>
            <li className="flex items-center gap-3 text-sm text-amber-800 bg-white p-3 rounded-md border border-amber-100 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Quarterly Tax Filing deadline is approaching in 14 days.
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}