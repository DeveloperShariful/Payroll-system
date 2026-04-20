// frontend/app/(dashboard)/payroll/page.tsx
"use client";

import { useState, useEffect } from "react";
import { processPayroll } from "@/lib/api/api_payroll";
import axiosClient from "@/lib/api/axiosClient";
import { Calculator, CheckCircle2, AlertCircle, Receipt, Users } from "lucide-react";
import Link from "next/link";

export default function EnterprisePayrollPage() {
  const [readyList, setReadyList] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const [manualRates, setManualRates] = useState({
    hourly_base_rate: 25.00,
    medical_deduction: 0.00
  });

  const fetchReadyList = async () => {
    try {
      setIsLoading(true);
      const res = await axiosClient.get("/payrolls/ready");
      setReadyList(res.data);
    } catch (err) {
      console.error("Failed to fetch ready timesheets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReadyList();
  }, []);

  const handleSelectEmployee = (emp: any) => {
    setSelectedEmp(emp);
    setResult(null); // Clear previous result
    setError("");
    setManualRates({
      hourly_base_rate: emp.suggested_base_rate,
      medical_deduction: 0.00
    });
  };

  const handleProcessPayroll = async () => {
    if (!selectedEmp) return;
    setIsProcessing(true);
    setError("");
    setResult(null);

    try {
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
      setResult(data);
      
      // Refresh the left panel to remove the processed employee
      fetchReadyList();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to process payroll. Check business rules.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Calculator className="w-7 h-7 text-indigo-600" />
            Payroll Processing Engine
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Process approved timesheets, calculate taxes dynamically, and generate pay stubs.
          </p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm">
          <Users className="w-4 h-4" />
          {readyList.length} Employees Ready
        </div>
      </div>
      {/* Replace the existing right-side div in the Header with this: */}
        <div className="flex gap-3">
          <Link href="/payroll/history" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Receipt className="w-4 h-4" /> View Past Pay Stubs
          </Link>
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm">
            <Users className="w-4 h-4" />
            {readyList.length} Ready
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: PENDING QUEUE */}
        <div className="lg:col-span-5 bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden flex flex-col h-[600px]">
          <div className="bg-slate-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 text-sm">Approved Timesheet Queue</h3>
            <span className="text-xs text-gray-500">Action Required</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-gray-500 animate-pulse">Loading queue...</div>
            ) : readyList.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full text-gray-500">
                <CheckCircle2 className="w-12 h-12 text-green-400 mb-3" />
                <p className="font-medium text-gray-900">Queue is Empty</p>
                <p className="text-sm mt-1">All approved timesheets have been processed.</p>
              </div>
            ) : (
              readyList.map((emp) => (
                <div 
                  key={emp.employee_id} 
                  onClick={() => handleSelectEmployee(emp)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedEmp?.employee_id === emp.employee_id 
                      ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200" 
                      : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{emp.employee_name}</h4>
                    <span className="text-xs font-mono bg-white px-2 py-1 border rounded text-gray-600">ID: {emp.employee_id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-3">
                    <div className="bg-white p-2 rounded border">
                      <span className="block text-gray-400 mb-1">Period</span>
                      <span className="font-medium text-gray-800">{emp.period_start} to {emp.period_end}</span>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <span className="block text-gray-400 mb-1">Total Hours</span>
                      <span className="font-bold text-indigo-600">{emp.total_regular_hours + emp.total_overtime_hours} hrs</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PROCESSING ENGINE */}
        <div className="lg:col-span-7 bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden h-[600px] flex flex-col">
          {!selectedEmp ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500 bg-slate-50/50">
              <Receipt className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Select an employee from the queue</h3>
              <p className="text-sm text-center mt-2 max-w-sm">
                Click on a record on the left to load their approved timesheet data and run the dynamic tax calculation engine.
              </p>
            </div>
          ) : result ? (
            // ================= RESULT SCREEN ================= //
            <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-emerald-50 border-b border-emerald-100 p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-emerald-900">Payroll Processed Successfully</h2>
                <p className="text-emerald-700 text-sm mt-1">Pay stub generated for {selectedEmp.employee_name}</p>
              </div>
              
              <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
                <div className="bg-white border shadow-sm rounded-lg p-6 max-w-md mx-auto">
                  <div className="border-b pb-4 mb-4 flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-500 font-bold tracking-wider uppercase mb-1">Official Pay Stub</p>
                      <h3 className="font-bold text-gray-900">{selectedEmp.employee_name}</h3>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      ID: {selectedEmp.employee_id}<br/>
                      {result.pay_period_start} - {result.pay_period_end}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center text-gray-700 font-medium">
                      <span>Gross Earnings</span>
                      <span>${Number(result.gross_pay).toFixed(2)}</span>
                    </div>
                    
                    <div className="pl-4 space-y-2 py-2 border-l-2 border-red-100 text-red-600 text-xs">
                      <div className="flex justify-between items-center">
                        <span>Federal Income Tax Withheld</span>
                        <span>-${Number(result.federal_tax).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>State Tax Withheld</span>
                        <span>-${Number(result.state_tax).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Union Dues (JSONB Rule)</span>
                        <span>-${Number(result.union_dues).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Medical Deductions</span>
                        <span>-${Number(result.medical_deduction).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t text-lg font-bold text-emerald-600">
                      <span>Net Take Home Pay</span>
                      <span>${Number(result.net_pay).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t bg-white">
                <button 
                  onClick={() => { setResult(null); setSelectedEmp(null); }}
                  className="w-full py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Process Next Employee
                </button>
              </div>
            </div>
          ) : (
            // ================= PROCESSING FORM ================= //
            <div className="flex-1 flex flex-col animate-in slide-in-from-right-4 duration-300">
              <div className="px-6 py-5 border-b bg-white flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedEmp.employee_name}</h3>
                  <p className="text-sm text-gray-500">Period: {selectedEmp.period_start} to {selectedEmp.period_end}</p>
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
                
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex gap-3 rounded-r-md">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Regular Hrs</p>
                    <p className="text-2xl font-bold text-indigo-600">{selectedEmp.total_regular_hours}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Overtime Hrs</p>
                    <p className="text-2xl font-bold text-amber-600">{selectedEmp.total_overtime_hours}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Double Time</p>
                    <p className="text-2xl font-bold text-purple-600">{selectedEmp.total_double_time_hours}</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg border shadow-sm p-6 space-y-5">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Manual Adjustments & Rates</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Base Rate ($) *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input 
                        type="number" step="0.01" required 
                        value={manualRates.hourly_base_rate} 
                        onChange={(e) => setManualRates({...manualRates, hourly_base_rate: parseFloat(e.target.value)})} 
                        className="pl-7 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-indigo-50/30" 
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">OT calculated at 1.5x, DT at 2.0x automatically.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Medical Deduction ($)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input 
                        type="number" step="0.01" 
                        value={manualRates.medical_deduction} 
                        onChange={(e) => setManualRates({...manualRates, medical_deduction: parseFloat(e.target.value)})} 
                        className="pl-7 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                      />
                    </div>
                  </div>
                </div>

              </div>

              <div className="p-4 border-t bg-white flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedEmp(null)}
                  className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleProcessPayroll}
                  disabled={isProcessing}
                  className="px-8 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 transition-all flex items-center gap-2"
                >
                  {isProcessing ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Calculating...</>
                  ) : "Calculate & Generate Pay Stub"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}