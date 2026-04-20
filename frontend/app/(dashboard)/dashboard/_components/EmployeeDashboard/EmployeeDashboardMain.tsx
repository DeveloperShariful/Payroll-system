// frontend/app/(dashboard)/dashboard/_components/EmployeeDashboard/EmployeeDashboardMain.tsx
"use client";

import { DollarSign, Clock, CalendarCheck, ArrowRight, CheckCircle2, Receipt } from "lucide-react";
import Link from "next/link";

export default function EmployeeDashboardMain({ data, userRole }: { data: any; userRole: string }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Labor Self-Service Portal
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
              {userRole} ACCESS
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Submit your daily hours and access your recent pay stubs.
          </p>
        </div>
      </div>

      {/* 2. IMPORTANT ALERT MESSAGE */}
      <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-emerald-900">Welcome to your new digital portal!</p>
          <p className="text-sm text-emerald-700 mt-1">
            We have successfully migrated your profile from the legacy system. Please ensure you submit your daily timesheets before the end of your shift to avoid payroll delays.
          </p>
        </div>
      </div>

      {/* 3. EMPLOYEE KPI RIBBON */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Total Net Pay Earned (YTD)</p>
            <div className="p-2 bg-emerald-50 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-4xl font-bold text-gray-900">
              ${data?.kpi?.my_total_earned?.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}
            </p>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">My Timesheets Pending Approval</p>
            <div className="p-2 bg-amber-50 rounded-lg"><Clock className="w-5 h-5 text-amber-600" /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-4xl font-bold text-amber-600">{data?.kpi?.my_pending_timesheets || 0}</p>
            <p className="text-sm text-gray-500 ml-1">Waiting for supervisor</p>
          </div>
        </div>
      </div>

      {/* 4. QUICK ACTIONS & HISTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Submit Timesheet Action Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
          <div className="border-b border-gray-100 pb-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Daily Operations</h2>
            <p className="text-xs text-gray-500 mt-1">Log your regular, overtime, and double-time hours.</p>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center py-8 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
            <CalendarCheck className="w-16 h-16 text-indigo-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Ready to clock out?</h3>
            <p className="text-sm text-slate-500 text-center max-w-sm mt-2 mb-6">
              Submit your hours for today. False reporting is subject to company penalty and audits.
            </p>
            <Link href="/timesheets/submit" className="w-full max-w-xs px-6 py-3.5 bg-indigo-600 text-white font-bold text-sm text-center rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" /> Submit Today's Hours
            </Link>
          </div>
        </div>

        {/* Recent Pay Stubs History */}
        <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden flex flex-col h-full">
          <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex justify-between items-center">
            <h2 className="text-base font-bold text-emerald-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Recent Pay Stubs
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-bold">
              Latest 3
            </span>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {data?.recent_history?.length > 0 ? (
              <ul className="space-y-4">
                {data.recent_history.map((stub: any) => (
                  <li key={stub.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-colors cursor-pointer group">
                    <div>
                      <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-800">{stub.period}</p>
                      <p className="text-xs font-mono text-gray-500 mt-1">Ref ID: #{stub.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">${stub.net_pay.toFixed(2)}</p>
                      <p className="text-xs font-semibold text-gray-400 uppercase">Net Pay</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-10">
                <Receipt className="w-12 h-12 text-gray-300 mb-3" />
                <p className="font-medium text-gray-900">No recent payrolls found.</p>
                <p className="text-sm mt-1">Your pay stubs will appear here once processed by HR.</p>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <Link href="/payroll/history" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 justify-end">
              View Full Payroll History <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}