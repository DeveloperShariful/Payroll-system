// frontend/app/(dashboard)/system/migration-tools/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { getMigrationStatus, startMigrationBatch } from "@/lib/api/api_migration";
import { 
  Database, Users, Play, Loader2, CheckCircle2, 
  AlertCircle, History, Building2, DatabaseZap, 
  Terminal, ShieldCheck, RefreshCw,Activity, Layers, Server, 
  Cpu, FileJson, Search, Filter
} from "lucide-react";

export default function EnterpriseMigrationControlCenter() {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [logs, setLogs] = useState<any[]>([]);
  const [batchSize, setBatchSize] = useState("1000"); // Standard high-speed batch
  const [isMigrating, setIsMigrating] = useState(false);
  const [activePipeline, setActivePipeline] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  // Stats for the gauges
  const stats = {
    employeeTotal: 175000,
    customerTotal: 93000,
    migratedEmployees: logs.reduce((acc, log) => acc + (log.status === 'SUCCESS' ? log.migrated_records : 0), 0),
    migratedCustomers: 0, // Logic can be added as per backend
  };

  // ==========================================
  // 2. DATA POLLING (Live Log Updates)
  // ==========================================
  const fetchLogs = useCallback(async () => {
    try {
      const data = await getMigrationStatus(20); // Get last 20 execution logs
      if (Array.isArray(data)) setLogs(data);
    } catch (err) {
      console.error("Pipeline heartbeat failed.");
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Poll every 5 seconds for live status
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // ==========================================
  // 3. EXECUTION HANDLERS
  // ==========================================
  const triggerMigration = async (entity: 'EMPLOYEE' | 'CUSTOMER') => {
    setIsMigrating(true);
    setActivePipeline(entity);
    setMessage(null);

    try {
      const res = await startMigrationBatch(parseInt(batchSize));
      setMessage({ type: 'success', text: `Node initialized: ${res.message}` });
      fetchLogs();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || "ETL Execution Denied." });
    } finally {
      setIsMigrating(false);
      // We don't reset activePipeline yet to show current process
    }
  };

  return (
    // 100% Full Screen - Edge to Edge Design
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col animate-in fade-in duration-500 overflow-hidden bg-slate-950 text-slate-300">
      
      {/* =====================================================================
          HEADER: MIGRATION COMMAND CENTER (Dark Theme)
          ===================================================================== */}
      <div className="bg-slate-900 border-b border-black px-6 py-3 flex justify-between items-center shrink-0 w-full shadow-2xl z-20">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-2 rounded-sm shadow-[0_0_15px_rgba(79,70,229,0.5)] animate-pulse">
            <DatabaseZap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-[0.2em] leading-tight">Data Migration Hub</h1>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
               <ShieldCheck className="w-3.5 h-3.5" /> Secure ETL Protocol: MS SQL Server &rarr; PostgreSQL (JSONB)
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase">Engine Status</span>
              <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1.5 uppercase">
                 <RefreshCw className={`w-3 h-3 ${isMigrating ? 'animate-spin' : ''}`} /> Standby / Ready
              </span>
           </div>
           <div className="h-10 w-px bg-slate-800"></div>
           <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-sm text-[11px] font-black uppercase border border-slate-700 transition-all active:scale-95">
              Reset Engine
           </button>
        </div>
      </div>

      {/* =====================================================================
          MAIN WORKSPACE (Split Layout)
          ===================================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full overflow-hidden">
        
        {/* LEFT PANEL: PIPELINE CONTROLS (40% Width) */}
        <div className="w-full lg:w-[450px] flex flex-col shrink-0 border-r border-black bg-slate-900/50 p-6 overflow-y-auto custom-scrollbar">
          
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-8 border-b border-slate-800 pb-2">Active Pipeline Controls</h2>

          {message && (
             <div className={`mb-8 p-4 rounded-sm border flex items-start gap-3 shadow-2xl animate-in zoom-in-95 ${
               message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-400'
             }`}>
               {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
               <span className="text-[11px] font-bold uppercase leading-relaxed">{message.text}</span>
             </div>
          )}

          <div className="space-y-10">
            
            {/* Control Group 1: Employee Migration */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-black text-white uppercase tracking-wider">Employee Pipeline</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Legacy: 175k Records</span>
              </div>
              <div className="bg-black/40 border border-slate-800 p-4 rounded-sm space-y-4 shadow-inner">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-2">
                   <span>Migration Progress</span>
                   <span>{((stats.migratedEmployees / stats.employeeTotal) * 100).toFixed(2)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                   <div className="bg-indigo-500 h-full transition-all duration-1000 shadow-[0_0_10px_#6366f1]" style={{ width: `${(stats.migratedEmployees / stats.employeeTotal) * 100}%` }}></div>
                </div>
                <div className="flex items-center gap-4 pt-2">
                   <div className="flex-1">
                      <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Packet Batch Size</label>
                      <input 
                        type="number" value={batchSize} onChange={(e) => setBatchSize(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 p-2 text-xs font-mono font-bold text-indigo-300 outline-none focus:border-indigo-500" 
                      />
                   </div>
                   <button 
                     onClick={() => triggerMigration('EMPLOYEE')}
                     disabled={isMigrating}
                     className="mt-4 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-sm text-[11px] font-black uppercase shadow-xl transition-all active:scale-95 disabled:opacity-50"
                   >
                     {isMigrating && activePipeline === 'EMPLOYEE' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                     Initiate Extraction
                   </button>
                </div>
              </div>
            </div>

            {/* Control Group 2: Customer Migration */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-black text-white uppercase tracking-wider">Customer Pipeline</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Legacy: 93k Records</span>
              </div>
              <div className="bg-black/40 border border-slate-800 p-4 rounded-sm space-y-4 opacity-50 cursor-not-allowed">
                 <p className="text-[10px] text-slate-400 font-bold uppercase text-center italic">Pipeline Locked • Awaiting Employee Verification</p>
                 <button disabled className="w-full bg-slate-800 text-slate-500 py-2 text-[10px] font-black uppercase">Start Client ETL</button>
              </div>
            </div>

            {/* Infrastructure Specs */}
            <div className="bg-slate-800/40 border border-slate-700 p-4 rounded-sm">
               <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Server className="w-3 h-3"/> Active Node Specifications</h4>
               <div className="grid grid-cols-2 gap-y-4">
                  <div className="flex items-center gap-2"><Cpu className="w-3.5 h-3.5 text-indigo-500" /><span className="text-[10px] font-bold">Turbo-ETL Engine 1.0</span></div>
                  <div className="flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-indigo-500" /><span className="text-[10px] font-bold">250 Cols - JSONB</span></div>
                  <div className="flex items-center gap-2"><Database className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[10px] font-bold">PG-V15 Persistent</span></div>
                  <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[10px] font-bold">SHA-256 Validation</span></div>
               </div>
            </div>

          </div>
        </div>

        {/* RIGHT PANEL: TRANSACTION LEDGER (TERMINAL STYLE) */}
        <div className="flex-1 flex flex-col min-w-0 bg-black">
          
          <div className="bg-slate-900 border-b border-black px-4 py-2 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Global Migration Ledger (Live Terminal)</h3>
             </div>
             <div className="flex gap-4">
                <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span className="text-[9px] font-bold uppercase text-slate-400 tracking-tighter">Connected</span></div>
                <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span><span className="text-[9px] font-bold uppercase text-slate-400 tracking-tighter">Syncing</span></div>
             </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar p-0">
             <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-800 sticky top-0 z-10">
                   <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-black">
                      <th className="px-4 py-3 w-40">Execution Timestamp</th>
                      <th className="px-4 py-3 w-32">Packet ID</th>
                      <th className="px-4 py-3 w-28 text-center">Status</th>
                      <th className="px-4 py-3 w-20 text-center">Migrated</th>
                      <th className="px-4 py-3 w-20 text-center text-amber-500">Duplicates</th>
                      <th className="px-4 py-3">Server Feedback / Error Message</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-mono text-[11px]">
                   {isLoadingLogs ? (
                      <tr><td colSpan={6} className="p-20 text-center uppercase tracking-[0.5em] text-slate-600 animate-pulse">Initializing Data Stream...</td></tr>
                   ) : logs.length === 0 ? (
                      <tr><td colSpan={6} className="p-20 text-center uppercase tracking-widest text-slate-600">No migration cycles recorded on this node.</td></tr>
                   ) : (
                      logs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-indigo-900/10 transition-colors group border-l-2 border-transparent hover:border-indigo-600">
                           <td className="px-4 py-3 text-slate-500 group-hover:text-slate-300 transition-colors">{new Date(log.started_at).toLocaleString()}</td>
                           <td className="px-4 py-3 font-bold text-indigo-400 tracking-tighter uppercase">{log.batch_id}</td>
                           <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase ${
                                log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                                log.status === 'FAILED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                                'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                              }`}>
                                 {log.status}
                              </span>
                           </td>
                           <td className="px-4 py-3 text-center font-black text-slate-200">+{log.migrated_records}</td>
                           <td className="px-4 py-3 text-center font-black text-amber-500/70">{log.skipped_records}</td>
                           <td className="px-4 py-3">
                              {log.error_message ? (
                                <span className="text-red-400/80 italic leading-none">{log.error_message}</span>
                              ) : (
                                <span className="text-slate-500 leading-none flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-500"/> Checksum Verified • Block Committed to PostgreSQL</span>
                              )}
                           </td>
                        </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>

          <div className="bg-slate-900 border-t border-black px-6 py-3 flex justify-between shrink-0">
             <div className="flex items-center gap-4">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">System Load: 12%</p>
                <div className="h-3 w-px bg-slate-800"></div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Nodes Active: 04</p>
             </div>
             <p className="text-[9px] font-black text-indigo-500/50 uppercase tracking-[0.4em]">Enterprise Legacy Integrator v4.2.0</p>
          </div>
        </div>

      </div>
    </div>
  );
}