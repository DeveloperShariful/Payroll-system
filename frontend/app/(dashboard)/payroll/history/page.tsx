// frontend/app/(dashboard)/payroll/history/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPayrollHistory } from "@/lib/api/api_payroll";
import { Receipt, Download, FileText, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function PayrollHistoryPage() {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getPayrollHistory();
        setHistory(data);
      } catch (error) {
        console.error("Failed to load payroll history");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/payroll" className="text-gray-400 hover:text-indigo-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Receipt className="w-6 h-6 text-emerald-600" />
              Payroll History & Pay Stubs
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-8">
            View past disbursements, generated pay stubs, and tax records.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
            <FileText className="w-4 h-4" /> Export CSV Report
          </button>
        </div>
      </div>

      {/* DATA GRID (PAY STUBS) */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Pay Period</th>
                {user?.role !== "EMPLOYEE" && (
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                )}
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Pay</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Taxes & Ded.</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Net Take-Home</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Pay Stub</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">Loading payroll records...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">No payroll history found.</td></tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.period}
                      <div className="text-xs text-gray-400 font-normal mt-1">Processed: {new Date(record.processed_at).toLocaleDateString()}</div>
                    </td>
                    
                    {user?.role !== "EMPLOYEE" && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">{record.employee_name}</span>
                        <div className="text-xs text-gray-400 mt-1">ID: {record.employee_id}</div>
                      </td>
                    )}

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      ${record.gross_pay.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-mono">
                      -${record.taxes.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-bold font-mono">
                      ${record.net_pay.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition-colors">
                        <Download className="w-4 h-4" /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}