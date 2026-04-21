// frontend/app/(dashboard)/payroll/invoices/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getInvoiceHistory, generateInvoice, markInvoiceAsPaid } from "@/lib/api/api_invoices";
import { getCustomers } from "@/lib/api/api_customers";
import { getJobsByCustomer } from "@/lib/api/api_tracking";
import { FileText, Plus, CheckCircle, Clock, DollarSign, ArrowRight, Loader2, FileSpreadsheet, Building2, Briefcase } from "lucide-react";
import { Customer, Job, InvoiceRecord } from "@/types";

export default function CustomerInvoicingPage() {
  // 1. Data States
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // 2. Form States (For generating new invoice)
  const [selectedCustId, setSelectedCustId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  
  // 3. UI/UX Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJobsLoading, setIsJobsLoading] = useState(false);

  // 4. Pagination States
  const [offset, setOffset] = useState(0);
  const LIMIT = 100;
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // =========================================================================
  // FETCH 1: INITIAL LOAD (Invoices & Customers)
  // =========================================================================
  const fetchHistoryAndCustomers = async (currentOffset: number, isLoadMore = false) => {
    if (!isLoadMore) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      // First load: fetch both invoices and active customers
      if (!isLoadMore) {
        const [invData, custData] = await Promise.all([
          getInvoiceHistory(LIMIT, currentOffset),
          getCustomers("", true, 500, 0) // High limit to populate dropdown
        ]);
        
        setInvoices(invData);
        setCustomers(custData);
        if (invData.length < LIMIT) setHasMore(false);
        else setHasMore(true);
      } 
      // Load more: fetch only invoices
      else {
        const invData = await getInvoiceHistory(LIMIT, currentOffset);
        if (invData.length < LIMIT) setHasMore(false);
        else setHasMore(true);
        setInvoices(prev => [...prev, ...invData]);
      }
    } catch (err) {
      console.error("Failed to initialize billing interface.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchHistoryAndCustomers(0, false);
  }, []);

  // =========================================================================
  // ACTION: CASCADING DROPDOWN (Customer -> Jobs)
  // =========================================================================
  const handleCustomerChange = async (id: string) => {
    setSelectedCustId(id);
    setSelectedJobId("");
    setJobs([]);
    
    if (!id) return;
    
    setIsJobsLoading(true);
    try {
      const jobData = await getJobsByCustomer(parseInt(id));
      setJobs(jobData);
    } catch (err) {
      console.error("Failed to load customer jobs.");
    } finally {
      setIsJobsLoading(false);
    }
  };

  // =========================================================================
  // ACTION: GENERATE NEW WEEKLY INVOICE
  // =========================================================================
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    // Basic Validation
    if (new Date(dateRange.start) > new Date(dateRange.end)) {
      alert("Start date cannot be after end date.");
      setIsGenerating(false);
      return;
    }

    try {
      await generateInvoice({
        job_id: parseInt(selectedJobId),
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      
      // Reset Form & Refresh Grid
      alert("Success! Weekly Invoice Generated Successfully.");
      setDateRange({ start: "", end: "" });
      setSelectedCustId("");
      setSelectedJobId("");
      setJobs([]);
      
      // Fetch fresh data (resetting pagination to 0)
      setOffset(0);
      fetchHistoryAndCustomers(0, false);
      
    } catch (err: any) {
      alert(err.response?.data?.detail || "No approved hours found to bill for this period.");
    } finally { 
      setIsGenerating(false); 
    }
  };

  // =========================================================================
  // ACTION: MARK INVOICE AS PAID (Optimistic UI Update)
  // =========================================================================
  const handleMarkPaid = async (id: number) => {
    if (!confirm("Confirm payment receipt for this invoice? This action cannot be undone.")) return;
    
    try {
      await markInvoiceAsPaid(id);
      // Optimistic UI Update
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: "PAID" } : inv));
    } catch (err) {
      alert("Failed to mark invoice as paid.");
    }
  };

  const handleLoadMore = () => {
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    fetchHistoryAndCustomers(newOffset, true);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 animate-in fade-in duration-300 overflow-hidden pb-4">
      
      {/* =====================================================================
          HEADER SECTION (Enterprise Style)
          ===================================================================== */}
      <div className="bg-white border border-gray-300 shadow-sm px-4 py-3 flex justify-between items-center shrink-0 rounded-sm">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-600 p-1.5 rounded shadow-inner">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Customer Billing & Invoicing</h1>
            <p className="text-xs text-gray-500 font-medium">Generate weekly bills based on approved labor hours and client bill rates.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-cyan-50 border border-cyan-200 text-cyan-800 px-4 py-2 rounded-sm text-xs font-bold shadow-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-cyan-600" />
            Accounting Department View
          </div>
        </div>
      </div>

      {/* =====================================================================
          MAIN WORKSPACE (Split Pane: Generator Form vs Invoice Grid)
          ===================================================================== */}
      <div className="flex flex-1 gap-4 min-h-0">
        
        {/* LEFT PANE: GENERATOR FORM */}
        <div className="w-80 flex flex-col bg-white border border-gray-300 shadow-sm rounded-sm shrink-0">
          <div className="bg-cyan-600 border-b border-cyan-700 px-4 py-3 flex justify-between items-center shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4" /> Generate New Bill
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
            <form onSubmit={handleGenerate} className="space-y-5">
              
              {/* Step 1: Customer Selection */}
              <div className="bg-white p-3 rounded-sm border border-gray-200 shadow-sm">
                <label className="block text-[10px] font-bold text-cyan-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" /> 1. Select Client
                </label>
                <select 
                  required 
                  value={selectedCustId} 
                  onChange={(e) => handleCustomerChange(e.target.value)} 
                  className="w-full border border-gray-300 rounded-sm p-2 text-sm bg-gray-50 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-bold text-gray-800"
                >
                  <option value="" disabled>-- Choose Customer --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              {/* Step 2: Job Selection */}
              <div className="bg-white p-3 rounded-sm border border-gray-200 shadow-sm">
                <label className="block text-[10px] font-bold text-cyan-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Briefcase className="w-3 h-3" /> 2. Select Job Site</span>
                  {isJobsLoading && <span className="text-cyan-500 animate-pulse lowercase normal-case text-[10px]">Loading...</span>}
                </label>
                <select 
                  required 
                  value={selectedJobId} 
                  onChange={(e) => setSelectedJobId(e.target.value)} 
                  disabled={!jobs.length || isJobsLoading} 
                  className="w-full border border-gray-300 rounded-sm p-2 text-sm bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none font-bold text-gray-800"
                >
                  <option value="" disabled>-- Select Active Job --</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.job_name}</option>)}
                </select>
                {selectedCustId && jobs.length === 0 && !isJobsLoading && (
                  <p className="text-[10px] text-red-500 font-bold mt-1.5">No active jobs found for this client.</p>
                )}
              </div>
              
              {/* Step 3: Date Range */}
              <div className="bg-white p-3 rounded-sm border border-gray-200 shadow-sm">
                <label className="block text-[10px] font-bold text-cyan-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> 3. Billing Period
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">From Date</label>
                    <input type="date" required value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="w-full border border-gray-300 rounded-sm p-1.5 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">To Date</label>
                    <input type="date" required value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="w-full border border-gray-300 rounded-sm p-1.5 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none" />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isGenerating || !selectedJobId || !dateRange.start || !dateRange.end} 
                  className="w-full bg-cyan-600 text-white font-bold py-2.5 rounded-sm shadow-[inset_0px_1px_0px_0px_#22d3ee] hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2 border border-cyan-800"
                >
                  {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Calculating...</> : "Generate Weekly Invoice"}
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-3 font-medium px-2 leading-tight">
                  System will automatically multiply approved labor hours by the client's assigned bill rate.
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT PANE: INVOICE HISTORY GRID */}
        <div className="flex-1 bg-white border border-gray-400 shadow-sm flex flex-col min-h-0 overflow-hidden rounded-sm relative">
          
          <div className="bg-gray-100 border-b border-gray-300 px-4 py-2.5 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-gray-800 text-sm">Generated Invoices Ledger</h3>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{invoices.length} Records</span>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar bg-gray-50">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              
              {/* TABLE HEADERS */}
              <thead className="bg-gray-200 sticky top-0 z-10 shadow-[0_1px_0_rgb(156,163,175)]">
                <tr>
                  <th className="border-r border-b border-gray-400 px-4 py-2 text-xs font-bold text-gray-800 uppercase tracking-wider">Inv # & Period</th>
                  <th className="border-r border-b border-gray-400 px-4 py-2 text-xs font-bold text-gray-800 text-center uppercase tracking-wider bg-gray-100/80">Total Hrs</th>
                  <th className="border-r border-b border-gray-400 px-4 py-2 text-xs font-bold text-gray-800 text-right uppercase tracking-wider bg-gray-100/80">Subtotal</th>
                  <th className="border-r border-b border-gray-400 px-4 py-2 text-xs font-bold text-cyan-900 text-right uppercase tracking-wider bg-cyan-100/80">Final Bill</th>
                  <th className="border-r border-b border-gray-400 px-4 py-2 text-xs font-bold text-gray-800 text-center uppercase tracking-wider">Status</th>
                  <th className="border-b border-gray-400 px-4 py-2 text-xs font-bold text-gray-800 text-right uppercase tracking-wider w-36">Action</th>
                </tr>
              </thead>
              
              {/* TABLE BODY */}
              <tbody className="bg-white">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500 font-medium bg-gray-50"><Loader2 className="w-6 h-6 animate-spin text-cyan-600 mx-auto mb-2" />Loading billing ledger...</td></tr>
                ) : invoices.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400 font-medium bg-gray-50">No invoices have been generated yet. Use the form on the left to create a bill.</td></tr>
                ) : (
                  invoices.map((inv, idx) => (
                    <tr key={inv.id} className={`hover:bg-cyan-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      
                      {/* Invoice Info */}
                      <td className="border-r border-b border-gray-200 px-4 py-2 text-sm text-gray-900">
                        <div className="font-bold text-cyan-800">{inv.invoice_number}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-1 uppercase tracking-wider">
                          {inv.billing_period_start} &rarr; {inv.billing_period_end}
                        </div>
                      </td>
                      
                      {/* Hours */}
                      <td className="border-r border-b border-gray-200 px-4 py-2 text-[14px] text-gray-600 font-mono font-bold text-center bg-gray-50/50">
                        {Number(inv.total_hours).toFixed(2)}
                      </td>
                      
                      {/* Subtotal */}
                      <td className="border-r border-b border-gray-200 px-4 py-2 text-[14px] text-gray-600 font-mono font-bold text-right bg-gray-50/50">
                        ${Number(inv.subtotal_amount).toFixed(2)}
                      </td>

                      {/* Final Bill Amount (Cyan/Green) */}
                      <td className="border-r border-b border-gray-200 px-4 py-2 text-[15px] text-cyan-700 font-mono font-black text-right bg-cyan-50/30">
                        ${Number(inv.total_amount).toFixed(2)}
                      </td>
                      
                      {/* Status Badge */}
                      <td className="border-r border-b border-gray-200 px-4 py-2 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                          inv.status === 'PAID' ? 'bg-green-100 text-green-800 border-green-300' : 
                          'bg-red-50 text-red-800 border-red-300'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      
                      {/* Actions */}
                      <td className="border-b border-gray-200 px-4 py-2 text-right">
                        {inv.status === "UNPAID" ? (
                          <button 
                            onClick={() => handleMarkPaid(inv.id)} 
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-sm text-xs font-bold shadow-sm transition-colors border border-green-800"
                          >
                            Mark as Paid
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Payment Received
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* GRID FOOTER: Load More Pagination */}
          {!isLoading && hasMore && invoices.length > 0 && (
            <div className="bg-gray-200 border-t border-gray-400 p-2 flex justify-center shrink-0">
              <button 
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-8 py-1.5 bg-white border border-gray-400 text-xs font-bold text-gray-700 rounded-sm shadow-[inset_1px_1px_0px_white,inset_-1px_-1px_0px_gray] hover:bg-gray-100 disabled:opacity-50 active:shadow-[inset_1px_1px_0px_gray]"
              >
                {isLoadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isLoadingMore ? "Retrieving Ledger..." : `Load Next ${LIMIT} Invoices`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}