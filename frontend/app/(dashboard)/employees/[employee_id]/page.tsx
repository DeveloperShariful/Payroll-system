// frontend/app/(dashboard)/employees/[employee_id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEmployeeById, updateEmployee } from "@/lib/api/api_employees";
import { getPayrollHistory } from "@/lib/api/api_payroll";
import { 
  ArrowLeft, User, ShieldCheck, CreditCard, Database, 
  Clock, Loader2, Save, X, Edit3, Briefcase, 
  MapPin, Phone, Mail, Fingerprint, CalendarDays, 
  FileText, Trash2, Plus, AlertCircle, CheckCircle2,
  HardHat, Landmark, History, Users
} from "lucide-react";
import { Employee, PayrollRecord } from "@/types";
import { getAssignmentsByEmployee } from "@/lib/api/api_tracking";

export default function EmployeeMasterProfilePage() {
  const { employee_id } = useParams();
  const router = useRouter();
  
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [payHistory, setPayHistory] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("master");
  const [error, setError] = useState("");
  const [activeLabor, setActiveLabor] = useState<any[]>([]); 
  // Edit Drawer States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Employee>>({});
  const [complianceList, setComplianceList] = useState<{name: string, date: string}[]>([]);
  

  // ==========================================
  // 2. DATA FETCHING (Master-Detail)
  // ==========================================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const id = Number(employee_id);
      
      // A. Fetch Master Profile
      const empData = await getEmployeeById(id);
      setEmployee(empData);
      setEditFormData(empData);

      // B. Map Compliance trackers
      const trackers = Object.entries(empData.compliance_tracking || {}).map(([name, date]) => ({ name, date: date as string }));
      setComplianceList(trackers);

      // C. Fetch Job History (এটি নতুন অ্যাড করা হলো)
      try {
        const assignments = await getAssignmentsByEmployee(id);
        setActiveLabor(assignments);
      } catch (e) {
        console.error("Job history not found for this employee.");
        setActiveLabor([]);
      }

      // D. Fetch Payroll Records
      const payData = await getPayrollHistory(50, 0);
      setPayHistory(payData.filter((p: any) => p.employee_id === id));

    } catch (err) {
      setError("Worker record could not be retrieved from database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (employee_id) fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee_id]);

  // ==========================================
  // 3. HANDLERS
  // ==========================================
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const complianceObj: Record<string, string> = {};
      complianceList.forEach(item => { if(item.name && item.date) complianceObj[item.name] = item.date; });

      const payload = {
        ...editFormData,
        compliance_tracking: complianceObj
      };

      await updateEmployee(Number(employee_id), payload);
      setIsEditOpen(false);
      fetchData();
      alert("Employee Master File Updated Successfully.");
    } catch (err) {
      alert("Update failed. Check network or permissions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Querying Workforce Ledger...</h2>
    </div>
  );

  if (!employee) return <div className="p-20 text-center font-bold text-red-600 uppercase border-2 border-red-200 bg-red-50 mx-10 mt-10">404: Employee Record Not Found</div>;

  // Tabs Definition
  const tabs = [
    { id: "master", name: "HR Master Record", icon: <User className="w-4 h-4"/> },
    { id: "finance", name: "Banking & Financials", icon: <Landmark className="w-4 h-4"/> },
    { id: "compliance", name: "Compliance & Licenses", icon: <ShieldCheck className="w-4 h-4"/> },
    { id: "assignments", name: "Job Site History", icon: <Briefcase className="w-4 h-4"/> },
    { id: "payrolls", name: "Payroll Stubs", icon: <History className="w-4 h-4"/> },
    { id: "legacy", name: "Legacy MS Access Dump", icon: <Database className="w-4 h-4"/> },
  ];

  const updateBankField = (field: string, value: string) => {
  const currentBank = editFormData.dynamic_attributes?.bank_details || {
    bank_name: "",
    account_number: "",
    routing_number: "",
    account_type: "Checking"
  };

  setEditFormData({
    ...editFormData,
    dynamic_attributes: {
      ...editFormData.dynamic_attributes,
      bank_details: {
        ...currentBank,
        [field]: value
      }
    }
  });
};

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col overflow-hidden bg-slate-100 animate-in fade-in duration-500">
      
      {/* ==========================================
          TOP COMMAND BAR (Edge to Edge)
          ========================================== */}
      <div className="bg-slate-900 border-b border-black px-4 py-2.5 flex justify-between items-center shrink-0 w-full shadow-2xl z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/employees")} className="bg-slate-800 hover:bg-slate-700 p-1.5 rounded transition-colors border border-slate-700 text-white">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-3">
              {employee.first_name} {employee.last_name}
              <span className={`text-[9px] px-2 py-0.5 rounded-sm font-black border shadow-sm ${employee.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'}`}>
                {employee.is_active ? "ACTIVE STATUS" : "SUSPENDED"}
              </span>
            </h1>
            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-0.5">
              SYS ID: {employee.id} • Legacy Ref: {employee.legacy_id || "N/A"} • Dept: {employee.department_id === 1 ? "GENERAL LABOR" : "SKILLED TRADE"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEditOpen(true)} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-sm text-xs font-black uppercase border border-slate-700 transition-all active:scale-95 shadow-lg">
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" /> Edit Profile
          </button>
          <button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-sm text-xs font-black uppercase shadow-[inset_0px_1px_0px_0px_#818cf8] border border-indigo-800 transition-all active:scale-95">
            <FileText className="w-3.5 h-3.5" /> Full HR Report
          </button>
        </div>
      </div>

      {/* ==========================================
          TAB NAVIGATION (Edge to Edge)
          ========================================== */}
      <div className="bg-white border-b border-gray-300 flex px-4 shrink-0 overflow-x-auto no-scrollbar shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-[11px] font-black uppercase tracking-tighter transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-gray-50'}`}
          >
            {tab.icon} {tab.name}
          </button>
        ))}
      </div>

      {/* ==========================================
          MAIN SCROLLABLE CONTENT
          ========================================== */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        
        {/* TAB 1: HR MASTER RECORD */}
        {activeTab === "master" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in slide-in-from-bottom-2 duration-300">
            {/* Core Details */}
            <div className="lg:col-span-8 bg-white border border-gray-300 shadow-sm rounded-sm">
              <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex items-center gap-2">
                <HardHat className="w-4 h-4 text-slate-600" />
                <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Relational HR Information</h3>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6">
                <div><span className="block text-[10px] font-black text-slate-400 uppercase mb-1">First Name</span><p className="text-sm font-bold text-slate-900 uppercase">{employee.first_name}</p></div>
                <div><span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Last Name</span><p className="text-sm font-bold text-slate-900 uppercase">{employee.last_name}</p></div>
                <div><span className="block text-[10px] font-black text-slate-400 uppercase mb-1">SSN (Last 4)</span><p className="text-sm font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm inline-block">***-**-{employee.ssn_last_four || "XXXX"}</p></div>
                <div><span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Hire Date</span><p className="text-sm font-bold text-slate-900">{employee.hire_date}</p></div>
                <div><span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Email Address</span><p className="text-sm font-bold text-blue-600 hover:underline cursor-pointer">{employee.email}</p></div>
                <div><span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Department</span><p className="text-sm font-bold text-slate-700 uppercase">{employee.department_id === 1 ? "General Labor" : "Skilled"}</p></div>
              </div>
            </div>
            {/* Contact Visual */}
            <div className="lg:col-span-4 bg-indigo-900 border border-black shadow-xl rounded-sm p-6 text-white flex flex-col justify-between relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Users className="w-32 h-32"/></div>
               <div className="relative z-10">
                  <h3 className="text-xs font-black text-indigo-300 uppercase tracking-[0.3em] mb-4">Emergency Contact</h3>
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-indigo-400" />
                        <div><p className="text-xs text-indigo-300 font-bold uppercase">Name</p><p className="text-sm font-black">{employee.dynamic_attributes?.emergency_contact?.name || "N/A"}</p></div>
                     </div>
                     <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-indigo-400" />
                        <div><p className="text-xs text-indigo-300 font-bold uppercase">Phone</p><p className="text-sm font-mono font-black">{employee.dynamic_attributes?.emergency_contact?.phone_number || "N/A"}</p></div>
                     </div>
                  </div>
               </div>
               <div className="mt-8 pt-4 border-t border-indigo-800/50">
                  <p className="text-[10px] italic text-indigo-300">"Data strictly managed under Enterprise Privacy Policy."</p>
               </div>
            </div>
          </div>
        )}

        {/* TAB 2: FINANCIALS */}
        {activeTab === "finance" && (
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm animate-in slide-in-from-bottom-2 duration-300">
             <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-600" />
                <h3 className="text-[11px] font-black text-emerald-800 uppercase tracking-widest">Bank & Direct Deposit Interface</h3>
             </div>
             <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-sm">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase mb-4">Account Details</h4>
                   <div className="space-y-4">
                      <div className="flex justify-between border-b pb-2"><span className="text-xs font-bold text-slate-600">Bank Name</span><span className="text-sm font-black uppercase">{employee.dynamic_attributes?.bank_details?.bank_name || "NOT SET"}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-xs font-bold text-slate-600">Routing #</span><span className="text-sm font-mono font-black">{employee.dynamic_attributes?.bank_details?.routing_number || "-------"}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-xs font-bold text-slate-600">Account #</span><span className="text-sm font-mono font-black">****{employee.dynamic_attributes?.bank_details?.account_number?.slice(-4) || "****"}</span></div>
                   </div>
                </div>
                <div className="flex flex-col justify-center bg-emerald-900 rounded-sm p-6 text-white shadow-2xl relative">
                   <CreditCard className="w-12 h-12 opacity-20 absolute top-4 right-4" />
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Payroll Status</p>
                   <p className="text-2xl font-black">Direct Deposit: ACTIVE</p>
                   <p className="text-xs text-emerald-300 mt-2">Employee is eligible for automated weekly disbursements.</p>
                </div>
             </div>
          </div>
        )}

        {/* TAB 3: COMPLIANCE */}
        {activeTab === "compliance" && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-2 duration-300">
              {Object.entries(employee.compliance_tracking || {}).map(([name, date]) => {
                 const isOverdue = new Date(date as string) < new Date();
                 return (
                    <div key={name} className={`p-5 rounded-sm border shadow-sm flex items-center justify-between ${isOverdue ? 'bg-red-50 border-red-300' : 'bg-white border-gray-300'}`}>
                       <div className="flex items-center gap-3">
                          <ShieldCheck className={`w-8 h-8 ${isOverdue ? 'text-red-500' : 'text-emerald-500'}`} />
                          <div>
                             <h4 className="text-[11px] font-black text-slate-900 uppercase leading-none mb-1">{name}</h4>
                             <p className={`text-[13px] font-mono font-black ${isOverdue ? 'text-red-600 underline decoration-double' : 'text-slate-700'}`}>{date as string}</p>
                          </div>
                       </div>
                       {isOverdue && <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">EXPIRED</span>}
                    </div>
                 )
              })}
              {Object.keys(employee.compliance_tracking || {}).length === 0 && (
                 <div className="col-span-3 p-10 bg-white border border-gray-300 text-center text-slate-400 font-bold uppercase">No Compliance Trackers Assigned.</div>
              )}
           </div>
        )}
        {/* =========================================================================
    TAB 4: JOB SITE HISTORY (এটি আপনার ফাইলের ভেতর খুঁজুন এবং আপডেট করুন)
    ========================================================================= */}
{activeTab === "assignments" && (
  <div className="bg-white border border-gray-400 shadow-xl rounded-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
    <div className="bg-slate-200 border-b border-gray-400 px-4 py-2 flex justify-between items-center">
       <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
          <Briefcase className="w-4 h-4" /> Project Deployment History
       </h3>
       <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded shadow-sm">
          {activeLabor.length} Assignments Found
       </span>
    </div>
    
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse whitespace-nowrap">
        <thead className="bg-gray-100 text-slate-800 border-b border-gray-300">
          <tr>
            <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border-r">Job / Project Name</th>
            <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border-r text-center">Start Date</th>
            <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border-r text-right bg-red-50">Pay Rate ($)</th>
            <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border-r text-right bg-green-50">Bill Rate ($)</th>
            <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-center">Assignment Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white font-mono">
          {activeLabor.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-10 text-center text-slate-400 font-bold uppercase text-xs">
                 Worker is currently in unassigned labor pool.
              </td>
            </tr>
          ) : (
            activeLabor.map((assignment: any) => (
              <tr key={assignment.assignment_id} className="hover:bg-indigo-50/50 transition-colors">
                <td className="px-4 py-3 text-xs font-black text-indigo-900 border-r">
                   {assignment.job_name}
                </td>
                <td className="px-4 py-3 text-xs font-bold text-slate-600 text-center border-r">
                   {assignment.start_date}
                </td>
                <td className="px-4 py-3 text-xs font-black text-red-600 text-right border-r bg-red-50/20">
                   ${Number(assignment.pay_rate).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-xs font-black text-emerald-600 text-right border-r bg-emerald-50/20">
                   ${Number(assignment.bill_rate).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${assignment.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                    {assignment.is_active ? "ACTIVE ON-SITE" : "COMPLETED"}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    
    <div className="bg-gray-100 p-2 border-t border-gray-300">
       <p className="text-[9px] text-slate-500 italic">"This ledger tracks the worker's historical performance and billability across all client project sites."</p>
    </div>
  </div>
)}

        {/* TAB 4: PAYROLL HISTORY */}
        {activeTab === "payrolls" && (
           <div className="bg-white border border-gray-400 shadow-xl rounded-sm overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                 <thead className="bg-slate-800 text-white">
                    <tr>
                       <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest">Pay Period</th>
                       <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-right">Gross Pay</th>
                       <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-right">Taxes/Ded.</th>
                       <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-right bg-emerald-700">Net Pay</th>
                       <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-center">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-200">
                    {payHistory.map(stub => (
                       <tr key={stub.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2 text-xs font-bold text-slate-700">{stub.period}</td>
                          <td className="px-4 py-2 text-xs font-mono font-bold text-slate-900 text-right">${stub.gross_pay.toFixed(2)}</td>
                          <td className="px-4 py-2 text-xs font-mono font-bold text-red-500 text-right">-${stub.taxes.toFixed(2)}</td>
                          <td className="px-4 py-2 text-xs font-mono font-black text-emerald-700 text-right bg-emerald-50">${stub.net_pay.toFixed(2)}</td>
                          <td className="px-4 py-2 text-center"><span className="bg-slate-700 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-sm">{stub.status}</span></td>
                       </tr>
                    ))}
                    {payHistory.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-bold">No Pay Record History Found.</td></tr>}
                 </tbody>
              </table>
           </div>
        )}

        {/* TAB 5: LEGACY MS ACCESS DATA */}
        {activeTab === "legacy" && (
           <div className="bg-slate-900 border border-black shadow-2xl rounded-sm p-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                 <h3 className="text-indigo-400 font-black uppercase tracking-widest text-xs">Migrated Legacy Columns (Raw SQL Server Output)</h3>
                 <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded">JSONB INDEXED</span>
              </div>
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar bg-black/40 p-4 rounded border border-slate-800">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                    {Object.entries(employee.dynamic_attributes?.legacy_custom_fields || {}).map(([key, value]) => (
                       <div key={key} className="flex justify-between items-start gap-4 border-b border-slate-800/50 pb-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase w-1/2">{key.replace(/_/g, ' ')}</span>
                          <span className="text-[11px] font-mono font-bold text-indigo-300 w-1/2 text-right break-all">{String(value)}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

      </div>

      {/* ==========================================
          FULL-SCREEN EDIT DRAWER (Slide-over)
          ========================================== */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setIsEditOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-4xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                 <Edit3 className="w-6 h-6 text-indigo-500" /> Employee Master File Revision
              </h2>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white transition-all"><X className="w-8 h-8" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-50">
               <form id="editWorkerForm" onSubmit={handleUpdate} className="space-y-12 pb-20">
                  
                  {/* SECTION: CORE IDENTITY */}
                  <div className="bg-white border border-gray-300 p-6 rounded-sm shadow-sm">
                     <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-3 mb-6 flex items-center gap-2"><User className="w-4 h-4"/> Worker Identity & Profile</h3>
                     <div className="grid grid-cols-2 gap-8">
                        <div>
                           <label className="block text-[10px] font-black text-slate-700 uppercase mb-2">Legal First Name *</label>
                           <input type="text" required value={editFormData.first_name || ""} onChange={e => setEditFormData({...editFormData, first_name: e.target.value})} className="w-full border-2 border-slate-200 p-2 text-sm font-bold focus:border-indigo-600 outline-none uppercase shadow-inner" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-700 uppercase mb-2">Legal Last Name *</label>
                           <input type="text" required value={editFormData.last_name || ""} onChange={e => setEditFormData({...editFormData, last_name: e.target.value})} className="w-full border-2 border-slate-200 p-2 text-sm font-bold focus:border-indigo-600 outline-none uppercase shadow-inner" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-700 uppercase mb-2">Email Identity (System Login) *</label>
                           <input type="email" required value={editFormData.email || ""} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full border-2 border-slate-200 p-2 text-sm font-bold focus:border-indigo-600 outline-none shadow-inner" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-700 uppercase mb-2">Employment Status</label>
                           <select value={editFormData.is_active ? "true" : "false"} onChange={e => setEditFormData({...editFormData, is_active: e.target.value === "true"})} className="w-full border-2 border-slate-200 p-2 text-sm font-black bg-white focus:border-indigo-600 outline-none">
                              <option value="true">ACTIVE FIELD LABOR</option>
                              <option value="false">SUSPENDED / TERMINATED</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  {/* SECTION: COMPLIANCE TRACKING */}
                  <div className="bg-white border border-orange-200 p-6 rounded-sm shadow-sm">
                     <div className="flex justify-between items-center border-b border-orange-100 pb-3 mb-6">
                        <h3 className="text-[11px] font-black text-orange-800 uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Licensing & Compliance Alerts</h3>
                        <button type="button" onClick={() => setComplianceList([...complianceList, {name: "", date: ""}])} className="bg-orange-100 text-orange-800 text-[10px] font-black px-3 py-1 rounded-sm border border-orange-300 hover:bg-orange-200">+ ADD TRACKER</button>
                     </div>
                     <div className="space-y-3">
                        {complianceList.map((c, idx) => (
                           <div key={idx} className="flex gap-4 items-center bg-orange-50/50 p-2 border border-orange-200">
                              <input type="text" placeholder="License Name (e.g. OSHA-30)" value={c.name} onChange={e => {const n = [...complianceList]; n[idx].name = e.target.value; setComplianceList(n);}} className="flex-1 border-2 border-orange-200 p-1.5 text-xs font-bold focus:border-orange-500 outline-none uppercase" />
                              <input type="date" value={c.date} onChange={e => {const n = [...complianceList]; n[idx].date = e.target.value; setComplianceList(n);}} className="w-40 border-2 border-orange-200 p-1.5 text-xs font-black focus:border-orange-500 outline-none" />
                              <button type="button" onClick={() => setComplianceList(complianceList.filter((_, i) => i !== idx))} className="text-red-500 p-1.5 hover:bg-red-100 rounded-sm"><Trash2 className="w-4 h-4"/></button>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* SECTION: FINANCIALS (JSONB) */}
<div className="bg-white border border-emerald-200 p-6 rounded-sm shadow-sm">
   <h3 className="text-[11px] font-black text-emerald-800 uppercase tracking-widest border-b border-emerald-200 pb-3 mb-6 flex items-center gap-2">
      <Landmark className="w-4 h-4 text-emerald-600" /> Financial Disbursement Setup
   </h3>
   <div className="grid grid-cols-2 gap-8">
      <div className="col-span-2">
         <label className="block text-[10px] font-black text-slate-700 uppercase mb-2">Bank Name</label>
         <input 
            type="text" 
            value={editFormData.dynamic_attributes?.bank_details?.bank_name || ""} 
            onChange={e => updateBankField("bank_name", e.target.value)} 
            className="w-full border-2 border-slate-200 p-2 text-sm font-bold uppercase shadow-inner outline-none focus:border-emerald-600" 
         />
      </div>
      <div>
         <label className="block text-[10px] font-black text-slate-700 uppercase mb-2">Account Number</label>
         <input 
            type="text" 
            value={editFormData.dynamic_attributes?.bank_details?.account_number || ""} 
            onChange={e => updateBankField("account_number", e.target.value)} 
            className="w-full border-2 border-slate-200 p-2 text-sm font-mono font-bold shadow-inner outline-none focus:border-emerald-600" 
         />
      </div>
      <div>
         <label className="block text-[10px] font-black text-slate-700 uppercase mb-2">Routing Number</label>
         <input 
            type="text" 
            value={editFormData.dynamic_attributes?.bank_details?.routing_number || ""} 
            onChange={e => updateBankField("routing_number", e.target.value)} 
            className="w-full border-2 border-slate-200 p-2 text-sm font-mono font-bold shadow-inner outline-none focus:border-emerald-600" 
         />
      </div>
   </div>
</div>

               </form>
            </div>
            
            {/* Drawer Footer */}
            <div className="bg-gray-200 border-t border-gray-400 p-4 flex justify-end gap-3 z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
              <button onClick={() => setIsEditOpen(false)} className="px-8 py-2.5 bg-white border-2 border-slate-400 text-slate-700 text-xs font-black uppercase rounded-sm hover:bg-slate-50 transition-all active:scale-95">Cancel Revision</button>
              <button form="editWorkerForm" type="submit" disabled={isSubmitting} className="px-12 py-2.5 bg-indigo-600 border-2 border-indigo-800 text-white text-xs font-black uppercase rounded-sm shadow-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                COMMIT CHANGES TO LEDGER
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}