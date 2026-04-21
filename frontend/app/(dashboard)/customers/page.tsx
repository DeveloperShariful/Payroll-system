// frontend/app/(dashboard)/customers/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getCustomers } from "@/lib/api/api_customers";
import { Customer } from "@/types";
import { Search, Plus, Loader2, Building2, FolderTree, FileText, Filter, CalendarDays, Database , ShieldAlert} from "lucide-react";

export default function CustomersMasterListPage() {
  // =========================================================================
  // 1. STATE MANAGEMENT (Data, UI, Pagination, Filters)
  // =========================================================================
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(true); // Default: Active only

  // Pagination States (Crucial for 93,000 records)
  const LIMIT = 100;
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Total count estimation for UI
  const [totalLoaded, setTotalLoaded] = useState(0);

  // =========================================================================
  // 2. DEBOUNCE LOGIC FOR SEARCH (Prevents API spamming on every keystroke)
  // =========================================================================
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500); // Wait 500ms after user stops typing

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // =========================================================================
  // 3. CORE FETCH FUNCTION (Handles both Initial Load & Load More)
  // =========================================================================
  const fetchCustomersData = useCallback(async (
    searchQuery: string, 
    isActive: boolean | undefined, 
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
      const data = await getCustomers(searchQuery, isActive, LIMIT, currentOffset);
      
      // Determine if there are more records to fetch in the database
      if (data.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (isLoadMore) {
        setCustomers(prev => {
          const newData = [...prev, ...data];
          setTotalLoaded(newData.length);
          return newData;
        });
      } else {
        setCustomers(data);
        setTotalLoaded(data.length);
      }
      
    } catch (err: any) {
      console.error("Error fetching customers:", err);
      setError("Failed to load customer database. Please try again.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [LIMIT]);

  // =========================================================================
  // 4. EFFECTS TRIGGERING THE FETCH
  // =========================================================================
  
  // Trigger when Search Term or Status Filter changes (Reset pagination)
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchCustomersData(debouncedSearch, statusFilter, 0, false);
  }, [debouncedSearch, statusFilter, fetchCustomersData]);

  // =========================================================================
  // 5. ACTION HANDLERS
  // =========================================================================
  const handleLoadMore = () => {
    if (isLoadingMore || !hasMore) return;
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    fetchCustomersData(debouncedSearch, statusFilter, newOffset, true);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "ALL") setStatusFilter(undefined);
    else if (val === "ACTIVE") setStatusFilter(true);
    else if (val === "INACTIVE") setStatusFilter(false);
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col animate-in fade-in duration-300 overflow-hidden bg-white">
      
      {/* =====================================================================
          HEADER SECTION (Enterprise Master Data Style)
          ===================================================================== */}
      <div className="bg-white border border-gray-300 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center shrink-0 rounded-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded shadow-inner">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Client & Customer Directory</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Manage master profiles, billing rates, and legacy metadata.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/customers/create-new"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-sm text-sm font-bold shadow-[inset_0px_1px_0px_0px_#818cf8] border border-indigo-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Client
          </Link>
          <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-sm text-sm font-bold shadow-[inset_1px_1px_0px_white,inset_-1px_-1px_0px_gray] hover:bg-gray-50 transition-colors active:shadow-[inset_1px_1px_0px_gray]">
            <FileText className="w-4 h-4 text-emerald-600" /> Export List
          </button>
        </div>
      </div>

      {/* =====================================================================
          FILTER & SEARCH TOOLBAR (Prevents Database Overload)
          ===================================================================== */}
      <div className="bg-gray-100 border border-gray-300 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 rounded-sm shadow-sm justify-between">
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2 border-r border-gray-300 pr-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Status:</span>
            <select 
              onChange={handleStatusFilterChange}
              defaultValue="ACTIVE"
              className="text-xs border border-gray-300 bg-white py-1.5 px-3 rounded-sm font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm cursor-pointer"
            >
              <option value="ACTIVE">Active Clients Only</option>
              <option value="INACTIVE">Inactive / Suspended</option>
              <option value="ALL">All Records</option>
            </select>
          </div>

          {/* Global Search Bar */}
          <div className="flex items-center gap-2 w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3" />
            <input
              type="text"
              placeholder="Search by Company Name, Code, or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs border border-gray-300 bg-white py-1.5 pl-9 pr-3 rounded-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm placeholder:text-gray-400 font-medium"
            />
          </div>
        </div>
        
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white px-3 py-1 border border-gray-200 rounded-sm shadow-sm">
          Loaded: <span className="text-indigo-600 font-black">{totalLoaded}</span> Records
        </div>
      </div>

      {/* =====================================================================
          MAIN DATAGRID (MS Access Style Continuous Form View)
          ===================================================================== */}
      {error && <div className="bg-red-600 text-white px-3 py-1.5 text-xs font-bold w-full">{error}</div>}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full relative bg-gray-50">
        <div className="flex-1 overflow-auto custom-scrollbar">
          {/* table-fixed and min-w-max ensures columns don't squish */}
          <table className="w-full text-left border-collapse whitespace-nowrap table-fixed min-w-max">
            
            <thead className="bg-gray-300 sticky top-0 z-10 shadow-[0_1px_0_rgb(156,163,175)]">
              <tr>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-gray-800 uppercase tracking-wider w-10 text-center" title="Active Status">ST</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-gray-800 uppercase tracking-wider w-16 text-center">SYS ID</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-gray-800 uppercase tracking-wider w-24">Client Code</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-indigo-900 bg-indigo-100/50 uppercase tracking-wider w-64">Company Name</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-gray-800 uppercase tracking-wider w-36">Industry</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-gray-800 uppercase tracking-wider w-48">Contact Email</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-gray-800 uppercase tracking-wider w-32">Phone Number</th>
                
                {/* Advanced Data Columns */}
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-orange-900 bg-orange-100/50 uppercase tracking-wider w-24 text-center" title="License & Compliance Trackers"><ShieldAlert className="w-3 h-3 inline mb-0.5 mr-1"/> Compl.</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-blue-900 bg-blue-100/50 uppercase tracking-wider w-24 text-center" title="Legacy MS Access Fields"><Database className="w-3 h-3 inline mb-0.5 mr-1"/> Legacy</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-blue-900 bg-blue-100/50 uppercase tracking-wider w-28 text-center">Legacy ID</th>
                <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-gray-800 uppercase tracking-wider w-32 text-center"><CalendarDays className="w-3 h-3 inline mb-0.5 mr-1"/> Joined Date</th>
                
                <th className="border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-gray-800 uppercase tracking-wider text-center w-24">Action</th>
              </tr>
            </thead>
            
            <tbody className="bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-20 text-center text-sm text-gray-500 font-bold bg-gray-50">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                    Querying 93,000+ Master Records...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-20 text-center text-sm text-gray-400 font-bold bg-gray-50 uppercase tracking-widest">
                    <FolderTree className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    No records found matching your search.
                  </td>
                </tr>
              ) : (
                customers.map((customer, idx) => {
                  const complianceCount = Object.keys(customer.compliance_tracking || {}).length;
                  const legacyCount = Object.keys(customer.dynamic_attributes || {}).length;
                  
                  return (
                    <tr key={customer.id} className={`hover:bg-indigo-50/70 transition-none ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      
                      <td className="border-r border-b border-gray-300 px-2 py-1.5 text-center">
                        <span className={`inline-block h-2 w-2 rounded-full ${customer.is_active ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.8)]'}`} title={customer.is_active ? "Active" : "Inactive"}></span>
                      </td>
                      
                      <td className="border-r border-b border-gray-300 px-2 py-1.5 text-[11px] font-mono text-gray-500 text-center bg-gray-100/50">
                        {customer.id}
                      </td>
                      
                      <td className="border-r border-b border-gray-300 px-2 py-1.5 text-[12px] text-gray-800 font-mono font-bold">
                        {customer.customer_code}
                      </td>
                      
                      <td className="border-r border-b border-gray-300 px-2 py-1.5 text-[12px] font-bold text-indigo-900 truncate" title={customer.name}>
                        {customer.name}
                      </td>
                      
                      <td className="border-r border-b border-gray-300 px-2 py-1.5 text-[11px] font-semibold text-gray-700 truncate">
                        {customer.industry || "-"}
                      </td>
                      
                      <td className="border-r border-b border-gray-300 px-2 py-1.5 text-[11px] text-blue-600 font-medium hover:underline cursor-pointer truncate">
                        {customer.contact_email || "-"}
                      </td>
                      
                      <td className="border-r border-b border-gray-300 px-2 py-1.5 text-[11px] text-gray-700 font-mono">
                        {customer.contact_phone || "-"}
                      </td>
                      
                      {/* Advanced Columns */}
                      <td className="border-r border-b border-gray-300 px-2 py-1.5 text-[11px] font-bold text-center bg-orange-50/30">
                        {complianceCount > 0 ? <span className="text-orange-700">{complianceCount} Trackers</span> : <span className="text-gray-300">-</span>}
                      </td>

                      <td className="border-r border-b border-gray-300 px-2 py-1.5 text-[11px] font-bold text-center bg-blue-50/30">
                        {legacyCount > 0 ? <span className="text-blue-700">{legacyCount} Cols</span> : <span className="text-gray-300">0</span>}
                      </td>

                      <td className="border-r border-b border-gray-300 px-2 py-1.5 text-[11px] font-mono text-gray-500 text-center bg-blue-50/30">
                        {customer.legacy_id || "-"}
                      </td>
                      
                      <td className="border-r border-b border-gray-300 px-2 py-1.5 text-[11px] font-mono text-gray-600 text-center">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </td>
                      
                      <td className="border-b border-gray-300 px-2 py-1.5 text-center">
                        <Link 
                          href={`/customers/${customer.id}`} 
                          className="inline-block bg-white border border-gray-400 text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-700 px-3 py-0.5 rounded-sm text-[10px] font-bold transition-colors shadow-sm"
                        >
                          Open profile
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
            GRID FOOTER: INFINITE SCROLL / LOAD MORE (Server Protection)
            ===================================================================== */}
        {!isLoading && hasMore && customers.length > 0 && (
          <div className="bg-gray-300 border-t border-gray-400 p-1.5 flex justify-center shrink-0 w-full">
            <button 
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-2 px-8 py-1 bg-white border border-gray-500 text-[11px] font-black uppercase text-gray-800 rounded-sm shadow-[inset_1px_1px_0px_white,inset_-1px_-1px_0px_gray] hover:bg-gray-100 disabled:opacity-50 active:shadow-[inset_1px_1px_0px_gray] transition-all"
            >
              {isLoadingMore ? <><Loader2 className="w-3 h-3 animate-spin text-indigo-600" /> Fetching...</> : `Load Next ${LIMIT} Records`}
            </button>
          </div>
        )}
        
        {/* End of List Indicator */}
        {!isLoading && !hasMore && customers.length > 0 && (
          <div className="bg-gray-100 border-t border-gray-300 p-2 text-center shrink-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">End of Directory • Total {totalLoaded} Records</p>
          </div>
        )}
      </div>
    </div>
  );
}