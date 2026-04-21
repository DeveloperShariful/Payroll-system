// frontend/app/(dashboard)/timesheets/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getTimesheets, approveTimesheet } from "@/lib/api/api_timesheets";
import { getEmployees } from "@/lib/api/api_employees";
import { getJobsByCustomer } from "@/lib/api/api_tracking";
import { getCustomers } from "@/lib/api/api_customers";
import { CheckCircle, XCircle, Clock, Search, Filter, Loader2, UserCircle2, Building2 } from "lucide-react";
import Link from "next/link";
import { Timesheet, Employee, Job, Customer } from "@/types";

// =========================================================================
// HELPER TYPES FOR MAPPED DATA
// =========================================================================
interface EnrichedTimesheet extends Timesheet {
  employee_name?: string;
  job_name?: string;
  customer_name?: string;
}

export default function TimesheetsMasterGridPage() {
  const { user } = useAuthStore();
  
  // 1. Core Data States
  const [timesheets, setTimesheets] = useState<EnrichedTimesheet[]>([]);
  const [filteredTimesheets, setFilteredTimesheets] = useState<EnrichedTimesheet[]>([]);
  
  // 2. Master Data Dictionaries (For joining IDs to Names)
  const [empDict, setEmpDict] = useState<Record<number, string>>({});
  const [jobDict, setJobDict] = useState<Record<number, string>>({});
  const [custDict, setCustDict] = useState<Record<number, string>>({});

  // 3. UI & Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isMapping, setIsMapping] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // 4. Pagination & Filtering
  const [offset, setOffset] = useState(0);
  const LIMIT = 100;
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // 5. Role-based Access Control
  const role = user?.role || "EMPLOYEE";
  const canApprove = ["ADMIN", "HR_MANAGER", "SUPERVISOR"].includes(role);

  // =========================================================================
  // FETCH 1: LOAD MASTER DATA (Dictionaries for JOINs)
  // =========================================================================
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        // Fetch Customers, Employees in parallel
        const [custData, empData] = await Promise.all([
          getCustomers("", true, 500, 0), // High limit to build dictionary
          getEmployees("", undefined, 1000, 0)
        ]);

        // Build Customer Dictionary
        const cDict: Record<number, string> = {};
        const allJobs: Job[] = [];
        
        for (const c of custData) {
          cDict[c.id] = c.name;
          // Fetch Jobs for each active customer
          try {
            const jData = await getJobsByCustomer(c.id);
            allJobs.push(...jData);
          } catch (e) { /* Ignore empty jobs */ }
        }
        setCustDict(cDict);

        // Build Job Dictionary
        const jDict: Record<number, string> = {};
        allJobs.forEach(j => { jDict[j.id] = j.job_name; });
        setJobDict(jDict);

        // Build Employee Dictionary
        const eDict: Record<number, string> = {};
        empData.forEach(e => { eDict[e.id] = `${e.first_name} ${e.last_name}`; });
        setEmpDict(eDict);

      } catch (error) {
        console.error("Failed to build master data dictionaries for timesheets.");
      } finally {
        setIsMapping(false);
      }
    };
    
    fetchMasterData();
  }, []);


  // =========================================================================
  // FETCH 2: LOAD TIMESHEETS (And enrich with Master Data)
  // =========================================================================
  const fetchTimesheetsData = async (currentOffset: number, isLoadMore = false) => {
    if (!isLoadMore) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const data = await getTimesheets(LIMIT, currentOffset);
      
      if (data.length < LIMIT) setHasMore(false);
      else setHasMore(true);

      // ENRICHMENT: Map IDs to Names using Dictionaries
      const enrichedData: EnrichedTimesheet[] = data.map(ts => ({
        ...ts,
        employee_name: empDict[ts.employee_id] || `Unknown Emp (#${ts.employee_id})`,
        job_name: ts.job_id ? (jobDict[ts.job_id] || `Job #${ts.job_id}`) : "Unassigned Site",
        customer_name: ts.customer_id ? (custDict[ts.customer_id] || "Unknown Client") : "Internal"
      }));

      if (isLoadMore) {
        setTimesheets(prev => [...prev, ...enrichedData]);
      } else {
        setTimesheets(enrichedData);
      }
    } catch (err) {
      console.error("Failed to load timesheet records.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Only fetch timesheets AFTER dictionaries are built
  useEffect(() => {
    if (!isMapping) {
      fetchTimesheetsData(0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapping]);


  // =========================================================================
  // CLIENT-SIDE FILTERING (Status & Search)
  // =========================================================================
  useEffect(() => {
    let result = timesheets;

    // 1. Filter by Status
    if (statusFilter !== "ALL") {
      result = result.filter(ts => ts.status === statusFilter);
    }

    // 2. Filter by Search Query (Name, ID, or Job)
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(ts => 
        (ts.employee_name?.toLowerCase().includes(query)) ||
        (ts.job_name?.toLowerCase().includes(query)) ||
        (ts.employee_id.toString().includes(query))
      );
    }

    setFilteredTimesheets(result);
  }, [timesheets, statusFilter, searchQuery]);


  // =========================================================================
  // ACTION: SUPERVISOR APPROVAL LOGIC
  // =========================================================================
  const handleAction = async (id: number, status: "APPROVED" | "REJECTED") => {
    const actionText = status === "APPROVED" ? "approve and lock" : "reject";
    if (!confirm(`Are you sure you want to ${actionText} this timesheet?`)) return;
    
    setActionLoadingId(id);
    try {
      await approveTimesheet(id, status, `Action taken by ${role} via Fast-Grid`);
      
      // Optimistic UI Update: Change status instantly without refetching from server
      setTimesheets(prev => prev.map(ts => ts.id === id ? { ...ts, status } : ts));
      
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to process timesheet action.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLoadMore = () => {
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    fetchTimesheetsData(newOffset, true);
  };

  // KPI Calculations
  const pendingCount = timesheets.filter(ts => ts.status === "SUBMITTED").length;
  const totalHoursPending = timesheets
    .filter(ts => ts.status === "SUBMITTED")
    .reduce((acc, curr) => acc + Number(curr.regular_hours) + Number(curr.overtime_hours), 0);

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 animate-in fade-in duration-300 overflow-hidden pb-4">
      
      {/* =====================================================================
          HEADER SECTION (MS Access Style Compact Header)
          ===================================================================== */}
      <div className="bg-white border border-gray-300 shadow-sm px-4 py-3 flex justify-between items-center shrink-0 rounded-sm">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-1.5 rounded shadow-inner">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Daily Labor Timesheets</h1>
            <p className="text-xs text-gray-500 font-medium">Review, filter, and approve daily hours prior to payroll processing.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {canApprove && (
            <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 px-4 py-2 rounded-sm shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Pending Review</span>
                <span className="text-sm font-black text-orange-900 flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    {pendingCount > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>}
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  {pendingCount} Timesheets ({totalHoursPending} Hrs)
                </span>
              </div>
            </div>
          )}
          
          {/* Action Buttons based on Role */}
          <Link 
            href="/timesheets/submit" 
            className="px-5 py-2 bg-indigo-600 text-white rounded-sm text-sm font-bold shadow-[inset_0px_1px_0px_0px_#818cf8] hover:bg-indigo-700 transition-colors flex items-center gap-2 border border-indigo-800"
          >
            <Clock className="w-4 h-4" /> 
            {role === "EMPLOYEE" ? "Submit My Hours" : "Manual Bulk Entry"}
          </Link>
        </div>
      </div>

      {/* =====================================================================
          FILTER TOOLBAR (Excel Style Filters)
          ===================================================================== */}
      <div className="bg-gray-100 border border-gray-300 px-3 py-2 flex items-center gap-6 shrink-0 rounded-sm shadow-sm">
        
        <div className="flex items-center gap-2 border-r border-gray-300 pr-6">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Status:</span>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 bg-white py-1 px-3 rounded-sm font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
          >
            <option value="ALL">All Records</option>
            <option value="SUBMITTED">Pending (Submitted)</option>
            <option value="APPROVED">Approved (Ready for Payroll)</option>
            <option value="REJECTED">Rejected</option>
            <option value="PROCESSED">Locked (Processed by HR)</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-80 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-2" />
          <input 
            type="text" 
            placeholder="Search by Employee Name, ID, or Job Site..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs border border-gray-300 bg-white py-1.5 pl-8 pr-2 rounded-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm placeholder:text-gray-400"
          />
        </div>
        
        <div className="ml-auto text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          Showing {filteredTimesheets.length} Records
        </div>
      </div>

      {/* =====================================================================
          THE DATASHEET GRID (MS Access / Excel View)
          ===================================================================== */}
      <div className="flex-1 bg-white border border-gray-400 shadow-sm flex flex-col min-h-0 overflow-hidden rounded-sm relative">
        <div className="flex-1 overflow-auto custom-scrollbar bg-gray-50">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            
            {/* TABLE HEADERS */}
            <thead className="bg-gray-200 sticky top-0 z-10 shadow-[0_1px_0_rgb(156,163,175)]">
              <tr>
                <th className="border-r border-b border-gray-400 px-3 py-1.5 text-xs font-bold text-gray-800 w-24">Work Date</th>
                <th className="border-r border-b border-gray-400 px-3 py-1.5 text-xs font-bold text-gray-800">Employee Details</th>
                <th className="border-r border-b border-gray-400 px-3 py-1.5 text-xs font-bold text-gray-800">Assigned Job Site & Client</th>
                <th className="border-r border-b border-gray-400 px-3 py-1.5 text-xs font-bold text-gray-900 text-center bg-blue-100/80">Reg. Hrs</th>
                <th className="border-r border-b border-gray-400 px-3 py-1.5 text-xs font-bold text-amber-900 text-center bg-amber-100/80">OT Hrs</th>
                <th className="border-r border-b border-gray-400 px-3 py-1.5 text-xs font-bold text-purple-900 text-center bg-purple-100/80">DT Hrs</th>
                <th className="border-r border-b border-gray-400 px-3 py-1.5 text-xs font-bold text-gray-800 text-center">Status</th>
                {canApprove && (
                  <th className="border-b border-gray-400 px-3 py-1.5 text-xs font-bold text-gray-800 text-right w-48">Supervisor Action</th>
                )}
              </tr>
            </thead>
            
            {/* TABLE BODY */}
            <tbody className="bg-white">
              {isMapping || isLoading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-sm text-gray-500 font-medium bg-gray-50">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                      Loading and mapping timesheet relationships...
                    </div>
                  </td>
                </tr>
              ) : filteredTimesheets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-sm text-gray-400 font-medium bg-gray-50">
                    No timesheets found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTimesheets.map((ts, idx) => (
                  <tr key={ts.id} className={`hover:bg-yellow-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    
                    {/* Date */}
                    <td className="border-r border-b border-gray-200 px-3 py-2 text-[13px] font-bold text-gray-900">
                      {ts.work_date}
                    </td>
                    
                    {/* Employee Info (Name + ID) */}
                    <td className="border-r border-b border-gray-200 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <UserCircle2 className="w-4 h-4 text-gray-400" />
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-gray-900">{ts.employee_name}</span>
                          <span className="text-[10px] font-mono text-gray-500 uppercase">ID: {ts.employee_id}</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Job Site Info (Job + Client) */}
                    <td className="border-r border-b border-gray-200 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-indigo-900">{ts.job_name}</span>
                          <span className="text-[10px] font-medium text-gray-500 uppercase">{ts.customer_name}</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Financial Hours (Monospace alignment) */}
                    <td className="border-r border-b border-gray-200 px-3 py-2 text-[13px] text-gray-900 font-mono font-bold text-center bg-blue-50/30">
                      {Number(ts.regular_hours).toFixed(2)}
                    </td>
                    <td className="border-r border-b border-gray-200 px-3 py-2 text-[13px] text-amber-700 font-mono font-bold text-center bg-amber-50/30">
                      {Number(ts.overtime_hours).toFixed(2)}
                    </td>
                    <td className="border-r border-b border-gray-200 px-3 py-2 text-[13px] text-purple-700 font-mono font-bold text-center bg-purple-50/30">
                      {Number(ts.double_time_hours).toFixed(2)}
                    </td>
                    
                    {/* Status Badge */}
                    <td className="border-r border-b border-gray-200 px-3 py-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                        ts.status === 'APPROVED' ? 'bg-green-100 text-green-800 border-green-300' : 
                        ts.status === 'REJECTED' ? 'bg-red-100 text-red-800 border-red-300' : 
                        ts.status === 'PROCESSED' ? 'bg-slate-700 text-white border-slate-900' :
                        'bg-orange-100 text-orange-800 border-orange-300'
                      }`}>
                        {ts.status}
                      </span>
                    </td>
                    
                    {/* Supervisor Actions */}
                    {canApprove && (
                      <td className="border-b border-gray-200 px-3 py-2 text-right">
                        {ts.status === "SUBMITTED" ? (
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => handleAction(ts.id, "APPROVED")}
                              disabled={actionLoadingId === ts.id}
                              className="flex items-center gap-1 bg-white border border-green-500 text-green-700 hover:bg-green-600 hover:text-white px-2 py-1 rounded-sm text-xs font-bold disabled:opacity-50 transition-colors shadow-sm"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button 
                              onClick={() => handleAction(ts.id, "REJECTED")}
                              disabled={actionLoadingId === ts.id}
                              className="flex items-center gap-1 bg-white border border-red-500 text-red-700 hover:bg-red-600 hover:text-white px-2 py-1 rounded-sm text-xs font-bold disabled:opacity-50 transition-colors shadow-sm"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                            {ts.status === "PROCESSED" ? "🔒 Locked (Invoiced/Paid)" : "✓ Action Taken"}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* GRID FOOTER: Load More Pagination */}
        {!isLoading && !isMapping && hasMore && filteredTimesheets.length > 0 && (
          <div className="bg-gray-200 border-t border-gray-400 p-2 flex justify-center shrink-0">
            <button 
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-2 px-8 py-1.5 bg-white border border-gray-400 text-xs font-bold text-gray-700 rounded-sm shadow-[inset_1px_1px_0px_white,inset_-1px_-1px_0px_gray] hover:bg-gray-100 disabled:opacity-50 active:shadow-[inset_1px_1px_0px_gray]"
            >
              {isLoadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isLoadingMore ? "Loading Records..." : `Load Next ${LIMIT} Timesheets`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}