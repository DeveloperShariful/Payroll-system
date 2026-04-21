// frontend/app/(dashboard)/payroll/history/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPayrollHistory } from "@/lib/api/api_payroll";
import { Receipt, Download, FileText, ArrowLeft, Loader2, DollarSign, CalendarCheck } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { PayrollRecord } from "@/types";

export default function PayrollHistoryPage() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination States
  const [offset, setOffset] = useState(0);
  const LIMIT = 100;
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchHistory = async (currentOffset: number, isLoadMore = false) => {
    if (!isLoadMore) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const data = await getPayrollHistory(LIMIT, currentOffset);
      
      if (data.length < LIMIT) setHasMore(false);
      else setHasMore(true);

      if (isLoadMore) {
        setHistory(prev => [...prev, ...data]);
      } else {
        setHistory(data);
      }
    } catch (error) {
      console.error("Failed to load payroll history");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchHistory(0, false);
  }, []);

  const handleLoadMore = () => {
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    fetchHistory(newOffset, true);
  };

  const isEmployee = user?.role === "EMPLOYEE";

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 animate-in fade-in duration-300 overflow-hidden pb-4">
      
      {/* =====================================================================
          HEADER SECTION
          ===================================================================== */}
      <div className="bg-white border border-gray-300 shadow-sm px-4 py-3 flex justify-between items-center shrink-0 rounded-sm">
        <div className="flex items-center gap-3">
          <Link href="/payroll" className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors bg-gray-100 hover:bg-emerald-50 rounded-sm border border-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="bg-emerald-600 p-1.5 rounded shadow-inner">
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              {isEmployee ? "My Official Pay Stubs" : "Enterprise Payroll History"}
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              {isEmployee ? "View your past disbursements and tax records." : "View all generated pay stubs, taxes, and financial disbursements."}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {!isEmployee && (
            <button className="bg-white border border-gray-400 text-gray-700 px-4 py-2 rounded-sm text-xs font-bold shadow-[inset_1px_1px_0px_white,inset_-1px_-1px_0px_gray] hover:bg-gray-50 transition-colors flex items-center gap-2 active:shadow-[inset_1px_1px_0px_gray]">
              <FileText className="w-4 h-4 text-emerald-600" /> Export CSV Report
            </button>
          )}
        </div>
      </div>

      {/* =====================================================================
          DATA GRID (PAY STUBS)
          ===================================================================== */}
      <div className="flex-1 bg-white border border-gray-400 shadow-sm flex flex-col min-h-0 overflow-hidden rounded-sm relative">
        <div className="flex-1 overflow-auto custom-scrollbar bg-gray-50">
          <table className="min-w-full text-left border-collapse whitespace-nowrap">
            
            {/* TABLE HEADERS */}
            <thead className="bg-gray-200 sticky top-0 z-10 shadow-[0_1px_0_rgb(156,163,175)]">
              <tr>
                <th className="border-r border-b border-gray-400 px-4 py-2 text-xs font-bold text-gray-800 uppercase tracking-wider w-48">Pay Period</th>
                
                {!isEmployee && (
                  <th className="border-r border-b border-gray-400 px-4 py-2 text-xs font-bold text-gray-800 uppercase tracking-wider">Employee Name & ID</th>
                )}
                
                <th className="border-r border-b border-gray-400 px-4 py-2 text-xs font-bold text-gray-800 text-right uppercase tracking-wider bg-blue-100/50">Gross Pay</th>
                <th className="border-r border-b border-gray-400 px-4 py-2 text-xs font-bold text-red-900 text-right uppercase tracking-wider bg-red-100/50">Taxes & Ded.</th>
                <th className="border-r border-b border-gray-400 px-4 py-2 text-xs font-bold text-emerald-900 text-right uppercase tracking-wider bg-emerald-100/50">Net Take-Home</th>
                <th className="border-r border-b border-gray-400 px-4 py-2 text-xs font-bold text-gray-800 text-center uppercase tracking-wider">Status</th>
                <th className="border-b border-gray-400 px-4 py-2 text-xs font-bold text-gray-800 text-right uppercase tracking-wider w-32">Official Pay Stub</th>
              </tr>
            </thead>
            
            {/* TABLE BODY */}
            <tbody className="bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={isEmployee ? 6 : 7} className="px-4 py-12 text-center text-sm text-gray-500 font-medium bg-gray-50">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      Retrieving secure financial records...
                    </div>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={isEmployee ? 6 : 7} className="px-4 py-12 text-center text-sm text-gray-400 font-medium bg-gray-50">
                    No payroll history found.
                  </td>
                </tr>
              ) : (
                history.map((record, idx) => (
                  <tr key={record.id} className={`hover:bg-emerald-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    
                    {/* Pay Period & Processed Date */}
                    <td className="border-r border-b border-gray-200 px-4 py-2 text-sm text-gray-900">
                      <div className="flex items-center gap-2 font-bold">
                        <CalendarCheck className="w-4 h-4 text-gray-400 shrink-0" />
                        {record.period}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium mt-1 uppercase tracking-wider ml-6">
                        Processed: {new Date(record.processed_at).toLocaleDateString()}
                      </div>
                    </td>
                    
                    {/* Employee Info (Hidden for Employee Role) */}
                    {!isEmployee && (
                      <td className="border-r border-b border-gray-200 px-4 py-2">
                        <div className="text-sm font-bold text-gray-900">{record.employee_name}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase">ID: {record.employee_id}</div>
                      </td>
                    )}

                    {/* Financial Columns (Strictly Monospace & Color Coded) */}
                    <td className="border-r border-b border-gray-200 px-4 py-2 text-[14px] text-gray-900 font-mono font-bold text-right bg-blue-50/30">
                      ${Number(record.gross_pay).toFixed(2)}
                    </td>
                    <td className="border-r border-b border-gray-200 px-4 py-2 text-[14px] text-red-700 font-mono font-bold text-right bg-red-50/30">
                      -${Number(record.taxes).toFixed(2)}
                    </td>
                    <td className="border-r border-b border-gray-200 px-4 py-2 text-[15px] text-emerald-700 font-mono font-black text-right bg-emerald-50/30">
                      ${Number(record.net_pay).toFixed(2)}
                    </td>
                    
                    {/* Status Badge */}
                    <td className="border-r border-b border-gray-200 px-4 py-2 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-slate-700 text-white border border-slate-900 shadow-sm">
                        {record.status}
                      </span>
                    </td>
                    
                    {/* Download Pay Stub Action */}
                    <td className="border-b border-gray-200 px-4 py-2 text-right">
                      <button className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-white bg-white hover:bg-emerald-600 border border-emerald-600 px-3 py-1 rounded-sm text-xs font-bold shadow-sm transition-colors">
                        <Download className="w-3.5 h-3.5" /> PDF Stub
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* GRID FOOTER: Load More Pagination */}
        {!isLoading && hasMore && history.length > 0 && (
          <div className="bg-gray-200 border-t border-gray-400 p-2 flex justify-center shrink-0">
            <button 
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-2 px-8 py-1.5 bg-white border border-gray-400 text-xs font-bold text-gray-700 rounded-sm shadow-[inset_1px_1px_0px_white,inset_-1px_-1px_0px_gray] hover:bg-gray-100 disabled:opacity-50 active:shadow-[inset_1px_1px_0px_gray]"
            >
              {isLoadingMore && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isLoadingMore ? "Retrieving Records..." : `Load Next ${LIMIT} Pay Stubs`}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}