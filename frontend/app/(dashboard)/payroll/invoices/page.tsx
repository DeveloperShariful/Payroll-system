// frontend/app/(dashboard)/payroll/invoices/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getInvoiceHistory, generateInvoice, markInvoiceAsPaid } from "@/lib/api/api_invoices";
import { getCustomers } from "@/lib/api/api_customers";
import { getJobsByCustomer } from "@/lib/api/api_tracking";
import { FileText, Plus, CheckCircle, Clock, DollarSign, ArrowRight } from "lucide-react";

export default function CustomerInvoicingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  
  const [selectedCustId, setSelectedCustId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        const [invData, custData] = await Promise.all([getInvoiceHistory(), getCustomers()]);
        setInvoices(invData);
        setCustomers(custData);
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    };
    initData();
  }, []);

  const handleCustomerChange = async (id: string) => {
    setSelectedCustId(id);
    setSelectedJobId("");
    const jobData = await getJobsByCustomer(parseInt(id));
    setJobs(jobData);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      await generateInvoice({
        job_id: parseInt(selectedJobId),
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      alert("Success! Weekly Invoice Generated.");
      const updatedInv = await getInvoiceHistory();
      setInvoices(updatedInv);
    } catch (err: any) {
      alert(err.response?.data?.detail || "No approved hours found to bill.");
    } finally { setIsGenerating(false); }
  };

  const handleMarkPaid = async (id: number) => {
    if (!confirm("Confirm payment receipt for this invoice?")) return;
    await markInvoiceAsPaid(id);
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: "PAID" } : inv));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-7 h-7 text-emerald-600" />
          Customer Billing & Invoicing
        </h1>
        <p className="mt-1 text-sm text-gray-500">Weekly revenue management based on labor hours and client bill rates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: GENERATOR FORM */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden">
            <div className="bg-emerald-600 px-6 py-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Plus className="w-5 h-5" /> Generate New Bill
              </h3>
            </div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">1. Select Client</label>
                <select required value={selectedCustId} onChange={(e) => handleCustomerChange(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 bg-gray-50">
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">2. Select Job Site</label>
                <select required value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} disabled={!jobs.length} className="w-full border border-gray-300 rounded-md p-2 bg-gray-50 disabled:opacity-50">
                  <option value="">-- Select Active Job --</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.job_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">From</label>
                  <input type="date" required value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">To</label>
                  <input type="date" required value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" />
                </div>
              </div>
              <button type="submit" disabled={isGenerating || !selectedJobId} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md">
                {isGenerating ? "Calculating Revenue..." : "Generate Weekly Invoice"}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: INVOICE HISTORY */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Recent Invoices</h3>
              <span className="text-xs font-medium text-gray-500">Auto-calculated from approved labor hours</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Inv #</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Hours</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total Bill</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-10 text-center animate-pulse text-gray-400">Loading billing history...</td></tr>
                  ) : invoices.length === 0 ? (
                    <tr><td colSpan={5} className="p-10 text-center text-gray-400 font-medium italic">No invoices generated yet.</td></tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-bold text-gray-900">{inv.invoice_number}</p>
                          <p className="text-[10px] text-gray-500">{inv.billing_period_start} to {inv.billing_period_end}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">{inv.total_hours} hrs</td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">${Number(inv.total_amount).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${inv.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {inv.status === "UNPAID" ? (
                            <button onClick={() => handleMarkPaid(inv.id)} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 shadow-sm">Mark Paid</button>
                          ) : (
                            <span className="text-gray-400 text-xs flex items-center justify-end gap-1"><CheckCircle className="w-3 h-3" /> Received</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}