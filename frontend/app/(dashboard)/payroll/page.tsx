// frontend/app/(dashboard)/payroll/page.tsx
"use client";

import { useState, useEffect } from "react";
import { processPayroll } from "@/lib/api/api_payroll";
import axiosClient from "@/lib/api/axiosClient";
import { Calculator, CheckCircle2, AlertCircle, Receipt, Users, ArrowRight, Loader2, DollarSign } from "lucide-react";
import Link from "next/link";

export default function EnterprisePayrollPage() {
  // 1. Data States
  const [readyList, setReadyList] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  
  // 2. UI/UX Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // 3. Financial Input States (Manual Adjustments)
  const [manualRates, setManualRates] = useState({
    hourly_base_rate: 25.00, // Default fallback
    medical_deduction: 0.00
  });

  // =========================================================================
  // FETCH 1: LOAD APPROVED TIMESHEETS READY FOR PAYROLL
  // =========================================================================
  const fetchReadyList = async () => {
    try {
      setIsLoading(true);
      const res = await axiosClient.get("/payrolls/ready");
      setReadyList(res.data);
    } catch (err) {
      console.error("Failed to fetch approved timesheets queue.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReadyList();
  }, []);

  // =========================================================================
  // ACTION: SELECT EMPLOYEE FROM QUEUE
  // =========================================================================
  const handleSelectEmployee = (emp: any) => {
    setSelectedEmp(emp);
    setResult(null); // Clear previous stub
    setError("");
    
    // Auto-populate the suggested base rate from backend grouping
    setManualRates({
      hourly_base_rate: emp.suggested_base_rate || 25.00,
      medical_deduction: 0.00
    });
  };

  // =========================================================================
  // ACTION: RUN FINANCIAL ENGINE (Process Payroll)
  // =========================================================================
  const handleProcessPayroll = async () => {
    if (!selectedEmp) return;
    setIsProcessing(true);
    setError("");
    setResult(null);

    try {
      // Build the exact payload required by `PayrollCreate` Pydantic schema
      const payload = {
        employee_id: selectedEmp.employee_id,
        pay_period_start: selectedEmp.period_start,
        pay_period_end: selectedEmp.period_end,
        regular_hours: selectedEmp.total_regular_hours,
        overtime_hours: selectedEmp.total_overtime_hours,
        double_time_hours: selectedEmp.total_double_time_hours,
        hourly_base_rate: manualRates.hourly_base_rate,
        medical_deduction: manualRates.medical_deduction,
      };
      
      const data = await processPayroll(payload);
      
      // SUCCESS: Display the Official Pay Stub
      setResult(data);
      
      // Refresh the left panel queue (the processed employee will disappear)
      fetchReadyList();
      
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to process payroll. Check business tax rules.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 animate-in fade-in duration-300 overflow-hidden pb-4">
      
      {/* =====================================================================
          HEADER SECTION (Enterprise Style)
          ===================================================================== */}
      <div className="bg-white border border-gray-300 shadow-sm px-4 py-3 flex justify-between items-center shrink-0 rounded-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-1.5 rounded shadow-inner">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Payroll Processing Engine</h1>
            <p className="text-xs text-gray-500 font-medium">Calculate taxes dynamically and lock approved labor hours.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Active Queue Status Badge */}
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-sm shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Processing Queue</span>
              <span className="text-sm font-black text-emerald-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                {readyList.length} Employees Ready
              </span>
            </div>
          </div>
          
          <Link 
            href="/payroll/history" 
            className="px-5 py-2 bg-white text-gray-700 rounded-sm text-sm font-bold shadow-[inset_0px_1px_0px_0px_white,inset_0px_-1px_0px_0px_#d1d5db] hover:bg-gray-50 transition-colors flex items-center gap-2 border border-gray-300"
          >
            <Receipt className="w-4 h-4 text-gray-500" /> View Past Pay Stubs
          </Link>
        </div>
      </div>

      {/* =====================================================================
          MAIN WORKSPACE (Split Pane: Queue vs Processing Window)
          ===================================================================== */}
      <div className="flex flex-1 gap-4 min-h-0">
        
        {/* LEFT PANE: PENDING QUEUE (Master List) */}
        <div className="w-80 flex flex-col bg-white border border-gray-300 shadow-sm rounded-sm shrink-0">
          <div className="bg-gray-100 border-b border-gray-300 px-3 py-2 flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Approved Timesheets</h3>
            <span className="text-[10px] font-bold bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full">{readyList.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 bg-gray-50">
            {isLoading ? (
              <div className="p-8 flex justify-center text-indigo-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : readyList.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full text-gray-400">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3 opacity-50" />
                <p className="font-bold text-gray-600 text-sm">Queue is Empty</p>
                <p className="text-xs mt-1">All approved timesheets have been successfully processed into payroll.</p>
              </div>
            ) : (
              readyList.map((emp) => (
                <div 
                  key={emp.employee_id} 
                  onClick={() => handleSelectEmployee(emp)}
                  className={`p-3 rounded-sm border cursor-pointer transition-all shadow-sm ${
                    selectedEmp?.employee_id === emp.employee_id 
                      ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" 
                      : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2 border-b border-gray-100 pb-2">
                    <h4 className="font-bold text-gray-900 text-sm truncate pr-2">{emp.employee_name}</h4>
                    <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 border border-gray-200 rounded text-gray-600 shrink-0">ID: {emp.employee_id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">Period</span>
                      <span className="font-medium text-gray-800">{new Date(emp.period_start).toLocaleDateString(undefined, {month:'short', day:'numeric'})} - {new Date(emp.period_end).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase">Total Billable</span>
                      <span className="font-bold text-emerald-700">{Number(emp.total_regular_hours + emp.total_overtime_hours + emp.total_double_time_hours).toFixed(2)} hrs</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANE: PROCESSING ENGINE & PAY STUB RESULT */}
        <div className="flex-1 bg-white border border-gray-400 shadow-sm flex flex-col min-h-0 overflow-hidden rounded-sm relative">
          
          {!selectedEmp ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 p-10">
              <Receipt className="w-16 h-16 mb-4 opacity-20 text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-500">No Employee Selected</h2>
              <p className="text-sm text-center max-w-md">Click on a worker from the queue on the left to load their approved timesheet data and run the dynamic tax calculation engine.</p>
            </div>
          ) : result ? (
            
            // ================================================================
            // SUCCESS SCREEN: THE OFFICIAL PAY STUB
            // ================================================================
            <div className="flex-1 flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden bg-gray-50">
              
              <div className="bg-emerald-600 border-b border-emerald-700 p-4 text-center shrink-0 shadow-sm z-10">
                <div className="flex items-center justify-center gap-2 text-white">
                  <CheckCircle2 className="w-6 h-6" />
                  <h2 className="text-lg font-bold">Payroll Processed & Locked Successfully</h2>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
                
                {/* The Pay Stub Ticket */}
                <div className="bg-white border border-gray-300 shadow-md rounded-sm w-full max-w-lg overflow-hidden">
                  
                  {/* Stub Header */}
                  <div className="bg-slate-50 border-b border-gray-200 p-5 flex justify-between items-end">
                    <div>
                      <h3 className="font-black text-xl text-gray-900 uppercase tracking-tight">{selectedEmp.employee_name}</h3>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Official Pay Stub</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-mono font-bold">EMP ID: {selectedEmp.employee_id}</p>
                      <p className="text-xs text-gray-600 mt-1 font-medium">{result.pay_period_start} &rarr; {result.pay_period_end}</p>
                    </div>
                  </div>

                  {/* Stub Body (Financials) */}
                  <div className="p-5 space-y-0 text-sm font-mono">
                    
                    {/* Gross Earnings */}
                    <div className="flex justify-between items-center py-2 border-b-2 border-gray-800 font-bold text-gray-900 text-base">
                      <span>GROSS EARNINGS</span>
                      <span>${Number(result.gross_pay).toFixed(2)}</span>
                    </div>
                    
                    {/* Taxes & Deductions (Red) */}
                    <div className="py-3 space-y-2 text-red-700">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-sans">Taxes & Deductions</div>
                      
                      <div className="flex justify-between items-center">
                        <span>Federal Income Tax Withheld</span>
                        <span>-${Number(result.federal_tax).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>State Tax Withheld</span>
                        <span>-${Number(result.state_tax).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Union Dues (Dynamically Calculated)</span>
                        <span>-${Number(result.union_dues).toFixed(2)}</span>
                      </div>
                      {Number(result.medical_deduction) > 0 && (
                        <div className="flex justify-between items-center">
                          <span>Medical & Health Deductions</span>
                          <span>-${Number(result.medical_deduction).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Net Pay (Green) */}
                    <div className="flex justify-between items-center pt-3 pb-2 border-t-2 border-gray-800 text-lg font-black text-emerald-700 bg-emerald-50 px-2 mt-2">
                      <span className="uppercase tracking-wider">NET TAKE-HOME PAY</span>
                      <span>${Number(result.net_pay).toFixed(2)}</span>
                    </div>
                    
                    <div className="text-center pt-4 mt-2 border-t border-dashed border-gray-300">
                       <p className="text-[10px] text-gray-400 font-sans italic">Status: {result.status} • Processed via API Financial Engine</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stub Action Footer */}
              <div className="p-4 border-t border-gray-300 bg-gray-100 flex justify-end shrink-0">
                <button 
                  onClick={() => { setResult(null); setSelectedEmp(null); }}
                  className="px-6 py-2 bg-white border border-gray-400 shadow-sm text-gray-800 font-bold text-sm rounded-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  Process Next Employee <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          ) : (
            
            // ================================================================
            // PROCESSING FORM: MANUAL ADJUSTMENTS & CONFIRMATION
            // ================================================================
            <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300 bg-gray-50 overflow-hidden">
              
              <div className="px-6 py-4 border-b border-gray-300 bg-white flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{selectedEmp.employee_name}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Pay Period: {selectedEmp.period_start} &mdash; {selectedEmp.period_end}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wider shadow-sm">
                  Ready for Calculation
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                
                {/* Error Banner */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-800 text-sm flex gap-3 rounded-sm shadow-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                    <p className="font-semibold">{error}</p>
                  </div>
                )}

                {/* Approved Hours Summary Cards */}
                <h4 className="text-sm font-bold text-gray-900 border-b border-gray-300 pb-2 mb-4">Approved Billable Hours</h4>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-white p-4 rounded-sm border border-gray-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Regular</p>
                    <p className="text-3xl font-black text-blue-700 font-mono">{Number(selectedEmp.total_regular_hours).toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-sm border border-gray-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Overtime (1.5x)</p>
                    <p className="text-3xl font-black text-amber-600 font-mono">{Number(selectedEmp.total_overtime_hours).toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-sm border border-gray-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Double (2.0x)</p>
                    <p className="text-3xl font-black text-purple-700 font-mono">{Number(selectedEmp.total_double_time_hours).toFixed(2)}</p>
                  </div>
                </div>

                {/* Financial Rates Input Form */}
                <div className="bg-white rounded-sm border border-gray-300 shadow-sm p-6 space-y-5">
                  <div className="border-b border-gray-200 pb-3 mb-2 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-sm font-bold text-gray-900">Financial Rates & Deductions</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 border border-gray-200 rounded-sm">
                      <label className="block text-[11px] font-bold text-gray-700 mb-2 uppercase tracking-wider">Hourly Base Pay Rate ($) *</label>
                      <input 
                        type="number" step="0.01" required 
                        value={manualRates.hourly_base_rate} 
                        onChange={(e) => setManualRates({...manualRates, hourly_base_rate: parseFloat(e.target.value)})} 
                        className="block w-full border border-gray-300 shadow-inner p-2.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-lg font-mono font-bold text-emerald-800 bg-white" 
                      />
                      <p className="text-[10px] text-gray-500 mt-2 font-medium leading-relaxed">System will automatically multiply this rate by 1.5x for OT and 2.0x for DT based on the backend financial engine rules.</p>
                    </div>

                    <div className="bg-gray-50 p-4 border border-gray-200 rounded-sm">
                      <label className="block text-[11px] font-bold text-gray-700 mb-2 uppercase tracking-wider">Manual Medical Deduction ($)</label>
                      <input 
                        type="number" step="0.01" 
                        value={manualRates.medical_deduction} 
                        onChange={(e) => setManualRates({...manualRates, medical_deduction: parseFloat(e.target.value)})} 
                        className="block w-full border border-gray-300 shadow-inner p-2.5 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-lg font-mono font-bold text-red-700 bg-white" 
                      />
                      <p className="text-[10px] text-gray-500 mt-2 font-medium leading-relaxed">Taxes and Union Dues are calculated dynamically from the JSONB rules. Add manual health/medical deductions here if required.</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Footer */}
              <div className="p-4 border-t border-gray-300 bg-gray-100 flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => setSelectedEmp(null)}
                  className="px-6 py-2 bg-white border border-gray-400 text-gray-700 text-sm font-bold rounded-sm hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleProcessPayroll}
                  disabled={isProcessing}
                  className="px-8 py-2 bg-emerald-600 border border-emerald-700 text-white text-sm font-bold rounded-sm shadow-[inset_0px_1px_0px_0px_#34d399] hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-70 transition-all flex items-center gap-2"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Calculating Taxes...</>
                  ) : (
                    <><Calculator className="w-4 h-4" /> Calculate & Generate Pay Stub</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}