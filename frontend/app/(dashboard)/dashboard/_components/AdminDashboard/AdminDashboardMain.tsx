// frontend/app/(dashboard)/dashboard/_components/AdminDashboard/AdminDashboardMain.tsx
"use client";

import { 
  Users, Building2, Clock, DollarSign, TrendingUp, 
  FileText, Activity, Globe, Zap, 
  Download, Filter, ShieldAlert, RefreshCcw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import SystemHealth from "./SystemHealth";

interface AdminDashboardProps {
  data: any;
  userRole: string;
  alertsData?: { summary: string; alerts: any[] };
}

export default function AdminDashboardMain({ data, userRole, alertsData }: AdminDashboardProps) {
  const router = useRouter();
  
  // ✅ HYDRATION FIX: সময় এবং মাউন্ট স্টেট আলাদা করা হলো
  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date().toLocaleTimeString());
    
    // প্রতি মিনিটে সময় আপডেট হবে
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // যতক্ষণ মাউন্ট না হবে ততক্ষণ শুধু বেসিক স্কেলিটন দেখাবে (এটি হাইড্রেশন এরর ঠেকাবে)
  if (!isMounted) return <div className="h-screen w-full bg-slate-900 animate-pulse"></div>;

  return (
    <div className="h-full w-full flex flex-col animate-in fade-in duration-700 bg-slate-100 overflow-hidden relative">
      
      {/* =====================================================================
          1. ENTERPRISE HEADER
          ===================================================================== */}
      <div className="bg-slate-900 border-b border-black px-6 py-4 flex flex-col md:flex-row justify-between items-center shrink-0 w-full shadow-2xl z-20 gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-2 rounded-sm shadow-[0_0_15px_rgba(79,70,229,0.4)]">
            <Zap className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-none tracking-[0.1em] uppercase flex items-center gap-3">
              Executive Analytics Ledger
              <span className="bg-indigo-500/20 text-indigo-400 text-[10px] px-2 py-0.5 rounded-sm border border-indigo-500/30 font-black tracking-widest">
                {userRole} ACCESS
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
              <Globe className="w-3 h-3" /> Node: <span className="text-emerald-400">Operational</span> • Sync: <span className="text-white">{currentTime}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-4 py-2 rounded-sm text-[11px] font-black uppercase transition-all active:scale-95">
            <Filter className="w-3.5 h-3.5" /> Filter Date
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-50 text-white px-5 py-2 rounded-sm text-[11px] font-black uppercase shadow-[inset_0px_1px_0px_0px_#818cf8] border border-indigo-800 transition-all active:scale-95 shadow-xl">
            <Download className="w-3.5 h-3.5" /> Generate Audit Report
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. KPI RIBBON
          ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full shrink-0 border-b border-gray-300 bg-white">
        
        {/* Active Workforce */}
        <div onClick={() => router.push("/employees")} className="border-r border-gray-200 p-6 flex flex-col justify-between relative group hover:bg-slate-50 transition-all cursor-pointer">
          <div className="flex justify-between items-start">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Active Workforce</span>
             <Users className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{data?.kpi?.total_employees || 0}</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Click to Manage</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </div>

        {/* Active Clients */}
        <div onClick={() => router.push("/customers")} className="border-r border-gray-200 p-6 flex flex-col justify-between relative group hover:bg-slate-50 transition-all cursor-pointer">
          <div className="flex justify-between items-start">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-purple-600 transition-colors">Client Entities</span>
             <Building2 className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{data?.kpi?.total_customers || 0}</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Database View</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </div>

        {/* YTD Expense */}
        <div onClick={() => router.push("/payroll/history")} className="border-r border-gray-200 p-6 flex flex-col justify-between relative group hover:bg-slate-50 transition-all cursor-pointer">
          <div className="flex justify-between items-start">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">YTD Payroll Expense</span>
             <DollarSign className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-black text-emerald-700 tracking-tighter font-mono group-hover:underline">
              ${data?.kpi?.ytd_payroll_expense?.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}
            </h2>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </div>

        {/* Pending Approval */}
        <div onClick={() => router.push("/timesheets")} className="p-6 flex flex-col justify-between relative group hover:bg-slate-50 transition-all cursor-pointer bg-orange-50/30">
          <div className="flex justify-between items-start">
             <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Pending Approval Timesheet</span>
             <Clock className="w-5 h-5 text-orange-600 animate-spin-slow group-hover:scale-110" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <h2 className="text-4xl font-black text-orange-700 tracking-tighter">{data?.kpi?.pending_approvals || 0}</h2>
            <span className="text-[11px] font-black text-white bg-orange-600 px-2 py-0.5 rounded-sm shadow-lg group-hover:animate-bounce inline-block">REVIEW</span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-600 scale-x-100 transition-transform origin-left"></div>
        </div>
      </div>

      {/* =====================================================================
          3. MAIN ANALYTICS WORKSPACE (Charts Section)
          ===================================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full overflow-hidden relative">
        
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-4 space-y-4">
           <div className="min-w-0 w-full">
              <SystemHealth activityData={data?.recent_activity} />
           </div>
        </div>
      </div>
    </div>
  );
}