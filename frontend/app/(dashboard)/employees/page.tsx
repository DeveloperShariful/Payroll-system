// frontend/app/(dashboard)/employees/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getEmployees } from "@/lib/api/api_employees";
import { Employee } from "@/types";
import { 
  Search, Plus, Loader2, Users, FileText, Filter, 
  ShieldAlert, Database, CalendarDays, UserCheck, 
  Briefcase, Fingerprint, ChevronRight
} from "lucide-react";

export default function EmployeesMasterListPage() {
  // =========================================================================
  // 1. STATE MANAGEMENT (Data, UI, Pagination, Filters)
  // =========================================================================
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<number | undefined>(undefined);

  // Pagination States (Critical for 175,000 records)
  const LIMIT = 100;
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalLoaded, setTotalLoaded] = useState(0);

  // =========================================================================
  // 2. SEARCH DEBOUNCE (Performance Optimization)
  // =========================================================================
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500); 
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // =========================================================================
  // 3. CORE FETCH FUNCTION (Server-side Pagination)
  // =========================================================================
  const fetchEmployeesData = useCallback(async (
    searchQuery: string, 
    departmentId: number | undefined, 
    currentOffset: number, 
    isLoadMore: boolean = false
  ) => {
    
    if (!isLoadMore) {
      setIsLoading(true);
      setError("");
    } else {
      setIsLoadingMore(true);
    }

    try {
      // Backend call with LIMIT and OFFSET
      const data = await getEmployees(searchQuery, departmentId, LIMIT, currentOffset);
      
      if (data.length < LIMIT) setHasMore(false);
      else setHasMore(true);

      if (isLoadMore) {
        setEmployees(prev => {
          const newData = [...prev, ...data];
          setTotalLoaded(newData.length);
          return newData;
        });
      } else {
        setEmployees(data);
        setTotalLoaded(data.length);
      }
      
    } catch (err: any) {
      setError("Failed to query employee database. Record may be locked.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // =========================================================================
  // 4. EFFECTS TRIGGERING THE FETCH
  // =========================================================================
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchEmployeesData(debouncedSearch, deptFilter, 0, false);
  }, [debouncedSearch, deptFilter, fetchEmployeesData]);

  // =========================================================================
  // 5. ACTION HANDLERS
  // =========================================================================
  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return;
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    fetchEmployeesData(debouncedSearch, deptFilter, newOffset, true);
  };

  return (
    // 100% Full Width & Height - Edge to Edge Design
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col animate-in fade-in duration-300 overflow-hidden bg-white">
      
      {/* =====================================================================
          HEADER SECTION (Enterprise Master Data Style)
          ===================================================================== */}
      <div className="bg-slate-900 border-b border-black px-4 py-2.5 flex flex-col sm:flex-row sm:justify-between sm:items-center shrink-0 w-full gap-2 shadow-xl z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-1.5 rounded shadow-inner">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-white leading-tight tracking-widest uppercase">Workforce Master Directory</h1>
            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-0.5">Central Labor Database • 175,000+ Profiles</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-sm text-[11px] font-black uppercase transition-all active:scale-95">
            <FileText className="w-3.5 h-3.5 text-emerald-500" /> Export CSV
          </button>
          <Link 
            href="/employees/create-new"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-sm text-[11px] font-black uppercase shadow-[inset_0px_1px_0px_0px_#818cf8] border border-indigo-800 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Employee
          </Link>
        </div>
      </div>

      {/* =====================================================================
          FILTER & SEARCH TOOLBAR (Compact & High Performance)
          ===================================================================== */}
      <div className="bg-gray-200 border-b border-gray-400 px-3 py-1.5 flex flex-col sm:flex-row sm:items-center justify-between shrink-0 w-full gap-2">
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Dept Filter */}
          <div className="flex items-center gap-1.5 border-r border-gray-400 pr-3">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-black text-slate-600 uppercase">Dept:</span>
            <select 
              onChange={(e) => setDeptFilter(e.target.value === "ALL" ? undefined : parseInt(e.target.value))}
              className="text-[11px] font-bold border border-gray-400 bg-white py-0.5 px-2 rounded-sm outline-none focus:border-indigo-500 shadow-sm cursor-pointer uppercase text-slate-700"
            >
              <option value="ALL">All Depts</option>
              <option value="1">General Labor</option>
              <option value="2">Skilled Trade</option>
              <option value="3">Operations</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 w-full sm:w-96 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
            <input
              type="text"
              placeholder="Search by Employee Name, SSN, email or System ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-[11px] border border-gray-400 bg-white py-1 pl-8 pr-2 rounded-sm outline-none focus:border-indigo-500 shadow-[inset_0px_1px_2px_0px_rgba(0,0,0,0.05)] placeholder:text-slate-400 font-bold text-slate-800"
            />
          </div>
        </div>
        
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-gray-300 px-2 py-1 border border-gray-400 rounded-sm">
          Active Records Loaded: <span className="text-indigo-700">{totalLoaded}</span>
        </div>
      </div>

      {/* =====================================================================
          MAIN DATAGRID (12 Columns, Zero Padding, Professional ERP Style)
          ===================================================================== */}
      {error && <div className="bg-red-600 text-white px-3 py-1.5 text-xs font-black uppercase tracking-widest w-full flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> {error}</div>}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full relative bg-slate-100">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap table-fixed min-w-max">
            
            {/* STICKY TABLE HEADERS */}
            <thead className="bg-gray-300 sticky top-0 z-10 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
              <tr>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-slate-700 uppercase tracking-tighter w-10 text-center" title="Status">ST</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-slate-700 uppercase tracking-tighter w-16 text-center">SYS ID</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-indigo-900 bg-indigo-100/50 uppercase tracking-tighter w-56"><UserCheck className="w-3 h-3 inline mr-1 mb-0.5"/> Employee Full Name</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-slate-700 uppercase tracking-tighter w-48">Email Address</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-slate-700 uppercase tracking-tighter w-24 text-center">SSN (L4)</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-slate-700 uppercase tracking-tighter w-32">Department</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-slate-700 uppercase tracking-tighter w-32 text-center"><CalendarDays className="w-3 h-3 inline mr-1 mb-0.5"/> Hire Date</th>
                
                {/* Advanced Data Columns (The Money Makers) */}
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-orange-900 bg-orange-100/50 uppercase tracking-tighter w-28 text-center" title="License & Compliance Trackers"><ShieldAlert className="w-3 h-3 inline mr-1 mb-0.5"/> Compliance</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-blue-900 bg-blue-100/50 uppercase tracking-tighter w-24 text-center" title="Legacy MS Access Fields"><Database className="w-3 h-3 inline mr-1 mb-0.5"/> Legacy</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-slate-700 uppercase tracking-tighter w-32 text-center">Legacy ID</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-slate-700 uppercase tracking-tighter w-28 text-center">Role Type</th>
                
                <th className="border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-slate-700 uppercase tracking-tighter text-center w-20">Action</th>
              </tr>
            </thead>
            
            <tbody className="bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-24 text-center text-sm text-slate-500 font-black bg-white uppercase tracking-widest">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                    Querying Relational Labor Database...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-24 text-center text-sm text-slate-400 font-black bg-white uppercase tracking-widest">
                    <Fingerprint className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                    Zero records found matching your query.
                  </td>
                </tr>
              ) : (
                employees.map((emp, idx) => {
                  const complianceCount = Object.keys(emp.compliance_tracking || {}).length;
                  const legacyCount = Object.keys(emp.dynamic_attributes?.legacy_custom_fields || {}).length;
                  
                  return (
                    <tr key={emp.id} className={`hover:bg-yellow-50 transition-none group ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      
                      {/* 1. Status */}
                      <td className="border-r border-b border-gray-200 px-2 py-1 text-center">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${emp.is_active ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.7)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.7)]'}`}></span>
                      </td>
                      
                      {/* 2. Sys ID */}
                      <td className="border-r border-b border-gray-200 px-2 py-1 text-[11px] font-mono font-bold text-slate-400 text-center bg-slate-100/30">
                        {emp.id}
                      </td>
                      
                      {/* 3. Full Name */}
                      <td className="border-r border-b border-gray-200 px-2 py-1 text-[12px] font-black text-indigo-950 uppercase tracking-tight truncate group-hover:text-indigo-600">
                        {emp.first_name} {emp.last_name}
                      </td>
                      
                      {/* 4. Email */}
                      <td className="border-r border-b border-gray-200 px-2 py-1 text-[11px] text-blue-600 font-bold hover:underline cursor-pointer truncate">
                        {emp.email}
                      </td>
                      
                      {/* 5. SSN Last 4 */}
                      <td className="border-r border-b border-gray-200 px-2 py-1 text-[12px] text-slate-800 font-mono font-black text-center bg-gray-50/50">
                        {emp.ssn_last_four ? `**-${emp.ssn_last_four}` : "XXXX"}
                      </td>
                      
                      {/* 6. Dept */}
                      <td className="border-r border-b border-gray-200 px-2 py-1 text-[11px] font-black text-slate-600 uppercase">
                        {emp.department_id === 1 ? "General Labor" : emp.department_id === 2 ? "Skilled Trade" : "Operations"}
                      </td>
                      
                      {/* 7. Hire Date */}
                      <td className="border-r border-b border-gray-200 px-2 py-1 text-[11px] font-mono font-bold text-slate-500 text-center">
                        {emp.hire_date}
                      </td>
                      
                      {/* 8. Compliance Count */}
                      <td className="border-r border-b border-gray-200 px-2 py-1 text-[10px] font-black text-center bg-orange-50/40">
                        {complianceCount > 0 ? (
                           <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-sm border border-orange-200">{complianceCount} ITEMS</span>
                        ) : (
                           <span className="text-slate-300">0</span>
                        )}
                      </td>

                      {/* 9. Legacy Fields Count */}
                      <td className="border-r border-b border-gray-200 px-2 py-1 text-[10px] font-black text-center bg-blue-50/40">
                        {legacyCount > 0 ? (
                           <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm border border-blue-200">{legacyCount} COLS</span>
                        ) : (
                           <span className="text-slate-300">0</span>
                        )}
                      </td>

                      {/* 10. Legacy ID */}
                      <td className="border-r border-b border-gray-200 px-2 py-1 text-[11px] font-mono text-slate-400 text-center truncate">
                        {emp.legacy_id || "N/A"}
                      </td>

                      {/* 11. Role Type */}
                      <td className="border-r border-b border-gray-200 px-2 py-1 text-[10px] font-black text-slate-500 uppercase text-center">
                        LABOR / FIELD
                      </td>
                      
                      {/* 12. Actions */}
                      <td className="border-b border-gray-200 px-2 py-1 text-center">
                        <Link 
                          href={`/employees/${emp.id}`} 
                          className="inline-flex items-center gap-1 bg-white border border-gray-400 text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-700 px-3 py-0.5 rounded-sm text-[10px] font-black uppercase transition-all shadow-sm active:scale-90"
                        >
                          OPEN <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* =====================================================================
            GRID FOOTER: INFINITE LOAD (Server Load Protection)
            ===================================================================== */}
        {!isLoading && hasMore && employees.length > 0 && (
          <div className="bg-gray-300 border-t border-gray-500 p-1.5 flex justify-center shrink-0 w-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]">
            <button 
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-3 px-12 py-1 bg-white border-2 border-slate-600 text-[11px] font-black uppercase text-slate-900 rounded-sm shadow-[inset_1px_1px_0px_white,inset_-1px_-1px_0px_gray] hover:bg-slate-100 disabled:opacity-50 active:shadow-[inset_1px_1px_0px_gray] transition-all"
            >
              {isLoadingMore ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> FETCHING NEXT BATCH...</>
              ) : (
                `LOAD NEXT ${LIMIT} EMPLOYEES`
              )}
            </button>
          </div>
        )}
        
        {/* End of Directory UI */}
        {!isLoading && !hasMore && employees.length > 0 && (
          <div className="bg-slate-800 border-t border-black p-2 text-center shrink-0 w-full">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">End of Active Workforce Directory • Total {totalLoaded} Records Synced</p>
          </div>
        )}
      </div>
    </div>
  );
}