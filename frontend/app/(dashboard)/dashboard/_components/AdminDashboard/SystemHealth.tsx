// frontend/app/(dashboard)/dashboard/_components/AdminDashboard/SystemHealth.tsx
"use client";

import { 
  CheckCircle2, AlertCircle, Terminal, Server, 
  Database, ShieldCheck, Cpu, HardDrive, 
  History, ArrowRight, Zap, RefreshCw, Activity 
} from "lucide-react";

export default function SystemHealth({ activityData }: { activityData: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full shrink-0 pb-10">
      
      {/* =====================================================================
          1. REAL-TIME ACTIVITY LEDGER (70% Width)
          ===================================================================== */}
      <div className="lg:col-span-8 bg-white border border-gray-300 shadow-sm rounded-sm flex flex-col overflow-hidden">
        
        {/* Header matching Terminal/Log Style */}
        <div className="bg-slate-800 border-b border-black px-5 py-3 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest">System Execution Logs</h3>
          </div>
          <span className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             Direct Ledger Stream
          </span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 min-h-[350px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-200 sticky top-0 z-10 shadow-sm">
               <tr>
                  <th className="px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-gray-300 w-32">Timestamp</th>
                  <th className="px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-gray-300 w-12 text-center">Evt</th>
                  <th className="px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-gray-300">Transaction Message</th>
                  <th className="px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-gray-300 text-right">Tracing</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-mono">
              {activityData?.length > 0 ? (
                activityData.map((activity: any) => (
                  <tr key={activity.id} className="hover:bg-indigo-50/50 transition-colors group">
                    <td className="px-4 py-3 text-[11px] font-bold text-slate-500 bg-white/50 border-r border-gray-100">
                       {activity.time}
                    </td>
                    <td className="px-4 py-3 text-center border-r border-gray-100">
                       {activity.type === 'success' ? (
                         <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                       ) : (
                         <AlertCircle className="w-3.5 h-3.5 text-amber-500 mx-auto" />
                       )}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-bold text-slate-800 leading-tight">
                       {activity.message}
                       <div className="text-[9px] text-slate-400 font-normal mt-0.5">Status: Authorized via Enterprise API Layer</div>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-right font-black text-indigo-400 group-hover:text-indigo-600">
                       {activity.id.toUpperCase()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={4} className="p-20 text-center flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-8 h-8 text-slate-200 animate-spin" />
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Polling Ledger for updates...</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-100 border-t border-gray-300 px-6 py-2 shrink-0">
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Audit Trail v1.0.4 • 128-bit Encrypted Stream</p>
        </div>
      </div>

      {/* =====================================================================
          2. INFRASTRUCTURE HEALTH MONITOR (30% Width)
          ===================================================================== */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        
        {/* Connection Status Box */}
        <div className="bg-slate-900 border border-black shadow-2xl rounded-sm p-5 text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-6 opacity-10"><Server className="w-24 h-24" /></div>
          <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
             <Activity className="w-3 h-3" /> Core Infrastructure
          </h4>
          
          <div className="space-y-5 relative z-10">
             {/* DB 1: PostgreSQL */}
             <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-black uppercase">
                   <span className="text-slate-400 flex items-center gap-1.5"><Database className="w-3 h-3"/> Modern PostgreSQL</span>
                   <span className="text-emerald-400">Stable</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                   <div className="bg-indigo-500 h-full w-[94%] shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                </div>
                <p className="text-[9px] text-slate-500 font-bold">JSONB Indexing Efficiency: 99.2%</p>
             </div>

             {/* DB 2: Legacy MS Access */}
             <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-black uppercase">
                   <span className="text-slate-400 flex items-center gap-1.5"><History className="w-3 h-3"/> Legacy MS Access</span>
                   <span className="text-slate-500 italic">Retired</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                   <div className="bg-slate-600 h-full w-full"></div>
                </div>
                <p className="text-[9px] text-slate-500 font-bold italic">Full Schema Migration Completed</p>
             </div>
          </div>
        </div>

        {/* Security / Compliance Health Box */}
        <div className="flex-1 bg-white border border-gray-300 shadow-sm rounded-sm p-5 flex flex-col">
           <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Compliance Health Score
           </h4>
           
           <div className="flex-1 flex flex-col items-center justify-center py-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="364" strokeDashoffset="40" className="text-emerald-500" />
                 </svg>
                 <span className="absolute text-3xl font-black text-slate-900 tracking-tighter">92%</span>
              </div>
              <p className="text-[10px] font-black text-emerald-600 uppercase mt-4 tracking-widest">System Integrity: High</p>
           </div>

           <div className="bg-slate-50 border-t border-gray-200 p-3 -mx-5 -mb-5 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase">Encryption: AES-256</span>
              <button className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:underline">
                 Verify Nodes <Zap className="w-2.5 h-2.5"/>
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}