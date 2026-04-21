// frontend/app/(dashboard)/tracking/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getCustomers } from "@/lib/api/api_customers";
import { getEmployees } from "@/lib/api/api_employees";
import { getJobsByCustomer, createJob, getAssignmentsByJob, assignEmployee } from "@/lib/api/api_tracking";
import { 
  Briefcase, Building2, Users, Plus, FolderTree, ChevronRight, 
  FileSpreadsheet, Loader2, ShieldCheck, MapPin, Calendar, 
  Phone, UserCheck, Info, X, Save
} from "lucide-react";

export default function TrackingMasterDataGrid() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isJobsLoading, setIsJobsLoading] = useState(false);
  const [isGridLoading, setIsGridLoading] = useState(false);
  
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobError, setJobError] = useState("");

  // ==========================================
  // FORM STATES (Expanded for Enterprise)
  // ==========================================
  const [newJob, setNewJob] = useState({ 
    job_name: "", 
    job_location: "", 
    contract_date: "",
    wc_expire_date: "", // Workers Comp
    gl_expire_date: "", // General Liability
    site_contact_name: "",
    site_contact_phone: "",
    is_active: true
  });

  const [newAssign, setNewAssign] = useState({ 
    employee_id: "", 
    pay_rate: "", 
    bill_rate: "", 
    bill_rate_ot: "", 
    assignment_start_date: new Date().toISOString().split('T')[0] 
  });

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [custData, empData] = await Promise.all([
          getCustomers("", true, 500, 0), 
          getEmployees("", undefined, 1000, 0)
        ]);
        setCustomers(custData);
        setEmployees(empData.filter((e: any) => e.is_active));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInit();
  }, []);

  const handleCustomerSelect = async (custId: number) => {
    if (selectedCustomerId === custId) return;
    setSelectedCustomerId(custId);
    setSelectedCustomer(customers.find(c => c.id === custId));
    setSelectedJob(null);
    setAssignments([]);
    setIsJobsLoading(true);
    try {
      const jobData = await getJobsByCustomer(custId);
      setJobs(jobData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsJobsLoading(false);
    }
  };

  const handleJobSelect = async (job: any) => {
    setSelectedJob(job);
    setIsGridLoading(true);
    try {
      const assignData = await getAssignmentsByJob(job.id);
      setAssignments(assignData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGridLoading(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setIsSubmitting(true);
    setJobError("");
    try {
      if (newJob.job_name.length < 2) throw new Error("Job name too short.");
      const created = await createJob({ ...newJob, customer_id: selectedCustomer.id });
      setJobs([...jobs, created]);
      setIsJobModalOpen(false);
      setNewJob({ job_name: "", job_location: "", contract_date: "", wc_expire_date: "", gl_expire_date: "", site_contact_name: "", site_contact_phone: "", is_active: true });
      alert("Success: New Job Site Registered.");
    } catch (err: any) {
      setJobError(err.response?.data?.detail || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignLabor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setIsSubmitting(true);
    try {
      await assignEmployee({
        job_id: selectedJob.id,
        employee_id: parseInt(newAssign.employee_id),
        pay_rate: parseFloat(newAssign.pay_rate),
        bill_rate: parseFloat(newAssign.bill_rate),
        bill_rate_ot: parseFloat(newAssign.bill_rate_ot),
        assignment_start_date: newAssign.assignment_start_date
      });
      const updated = await getAssignmentsByJob(selectedJob.id);
      setAssignments(updated);
      setIsAssignModalOpen(false);
      setNewAssign({ ...newAssign, employee_id: "", pay_rate: "", bill_rate: "", bill_rate_ot: "" });
    } catch (err: any) {
      alert(err.response?.data?.detail || "Assignment Failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden w-full bg-white">
      
      {/* HEADER BAR (MS Access Style) */}
      <div className="bg-slate-800 border-b border-slate-950 px-4 py-2 flex justify-between items-center shrink-0 w-full shadow-lg z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wider">Labor Tracking Control Center</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Intersection: Clients • Job Sites • Workforce</p>
          </div>
        </div>
      </div>

      {/* WORKSPACE DIVIDER */}
      <div className="flex flex-1 min-h-0 w-full">
        
        {/* LEFT: HIERARCHY TREE */}
        <div className="w-80 flex flex-col bg-slate-50 border-r border-gray-300 shrink-0 shadow-inner">
          <div className="bg-gray-200 border-b border-gray-300 px-3 py-2 flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-slate-600" />
            <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Client Directory</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
            {customers.map(cust => (
              <div key={cust.id} className="group">
                <button 
                  onClick={() => handleCustomerSelect(cust.id)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-[13px] rounded-sm transition-all ${selectedCustomerId === cust.id ? "bg-indigo-600 text-white font-bold shadow-md" : "hover:bg-gray-200 text-slate-700"}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className={`w-4 h-4 shrink-0 ${selectedCustomerId === cust.id ? "text-indigo-200" : "text-slate-400"}`} />
                    <span className="truncate uppercase">{cust.name}</span>
                  </div>
                  {selectedCustomerId === cust.id && <ChevronRight className="w-4 h-4" />}
                </button>

                {selectedCustomerId === cust.id && (
                  <div className="ml-5 border-l-2 border-indigo-400 pl-2 py-1 space-y-1">
                    {isJobsLoading ? (
                      <div className="text-[10px] text-indigo-500 animate-pulse font-bold p-1">Loading Job Sites...</div>
                    ) : jobs.length === 0 ? (
                      <div className="text-[10px] text-red-500 font-bold p-1 uppercase">No active sites.</div>
                    ) : (
                      jobs.map(job => (
                        <button 
                          key={job.id}
                          onClick={() => handleJobSelect(job)}
                          className={`w-full flex items-center gap-2 px-2 py-1 text-[11px] rounded-sm text-left truncate transition-all ${selectedJob?.id === job.id ? "bg-emerald-600 text-white font-bold shadow-sm" : "hover:bg-indigo-50 text-slate-600"}`}
                        >
                          <Briefcase className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{job.job_name}</span>
                        </button>
                      ))
                    )}
                    <button onClick={() => setIsJobModalOpen(true)} className="flex items-center gap-1 text-[10px] font-black text-indigo-600 hover:text-indigo-800 p-1 uppercase tracking-tighter">
                      <Plus className="w-3 h-3" /> New Job Site
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: JOB DETAILS & DATAGRID */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {!selectedJob ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-50 p-20">
              <Building2 className="w-32 h-32 mb-4" />
              <h2 className="text-2xl font-black uppercase tracking-widest">Select a Client Job Site</h2>
            </div>
          ) : (
            <>
              {/* JOB INFO PANEL (Master Data) */}
              <div className="bg-white border-b border-gray-300 p-4 shrink-0 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{selectedJob.job_name}</h2>
                    <p className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1"><Building2 className="w-3 h-3" /> {selectedCustomer?.name}</p>
                  </div>
                  <button onClick={() => setIsAssignModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-black rounded-sm shadow-md flex items-center gap-2 transition-all active:scale-95">
                    <Users className="w-4 h-4" /> ASSIGN LABOR
                  </button>
                </div>
                
                {/* ADVANCED JOB FIELDS */}
                <div className="grid grid-cols-4 gap-4 mt-4 bg-slate-50 p-3 rounded-sm border border-slate-200">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><MapPin className="w-3 h-3" /> Site Location</span>
                    <p className="text-xs font-bold text-slate-800 truncate">{selectedJob.job_location || "Not Provided"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar className="w-3 h-3" /> Contract Date</span>
                    <p className="text-xs font-bold text-slate-800">{selectedJob.contract_date || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> WC / GL Expiry</span>
                    <p className="text-xs font-bold text-orange-700">{selectedJob.wc_expire_date || "N/A"} | {selectedJob.gl_expire_date || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1"><UserCheck className="w-3 h-3" /> Active Headcount</span>
                    <p className="text-sm font-black text-indigo-600">{assignments.length} Workers On-Site</p>
                  </div>
                </div>
              </div>

              {/* THE DATASHEET GRID */}
              <div className="flex-1 overflow-hidden flex flex-col bg-gray-100">
                <div className="bg-gray-300 border-b border-gray-400 px-3 py-1 flex gap-4 items-center shrink-0">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Worker Roster (Datasheet)</span>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse whitespace-nowrap table-fixed">
                    <thead className="bg-gray-200 sticky top-0 z-10 shadow-[0_1px_0_rgb(156,163,175)]">
                      <tr>
                        <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-slate-700 uppercase w-48">Employee Full Name</th>
                        <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-slate-700 uppercase w-24 text-center">SSN (L4)</th>
                        <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-red-800 uppercase w-28 text-right bg-red-100/50">Pay Rate ($)</th>
                        <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-emerald-800 uppercase w-28 text-right bg-emerald-100/50">Bill Rate ($)</th>
                        <th className="border-r border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-emerald-800 uppercase w-28 text-right bg-emerald-100/50">Bill OT ($)</th>
                        <th className="border-b border-gray-400 px-2 py-1.5 text-[10px] font-black text-slate-700 uppercase w-32 text-center">Assigned Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {isGridLoading ? (
                        <tr><td colSpan={6} className="p-10 text-center text-xs font-bold text-indigo-500 animate-pulse">Syncing workforce data...</td></tr>
                      ) : assignments.length === 0 ? (
                        <tr><td colSpan={6} className="p-10 text-center text-xs font-bold text-slate-400 bg-slate-50 uppercase tracking-widest">No workforce assigned to this project.</td></tr>
                      ) : (
                        assignments.map((a, idx) => (
                          <tr key={a.assignment_id} className={`hover:bg-yellow-50 transition-none ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="border-r border-b border-gray-200 px-2 py-1.5 text-[12px] font-bold text-slate-900">{a.employee_name}</td>
                            <td className="border-r border-b border-gray-200 px-2 py-1.5 text-[12px] font-mono text-slate-500 text-center">{a.ssn_last_four}</td>
                            <td className="border-r border-b border-gray-200 px-2 py-1.5 text-[13px] font-mono font-black text-red-600 text-right">{a.pay_rate.toFixed(2)}</td>
                            <td className="border-r border-b border-gray-200 px-2 py-1.5 text-[13px] font-mono font-black text-emerald-600 text-right">{a.bill_rate.toFixed(2)}</td>
                            <td className="border-r border-b border-gray-200 px-2 py-1.5 text-[13px] font-mono font-black text-emerald-600 text-right">{a.bill_rate_ot.toFixed(2)}</td>
                            <td className="border-b border-gray-200 px-2 py-1.5 text-[11px] font-mono text-slate-500 text-center uppercase">{a.start_date}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-200 border-t border-gray-400 px-3 py-1 shrink-0 flex justify-between">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">End of Datasheet • Row Count: {assignments.length}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ==========================================
          MODAL: CREATE NEW JOB (Enterprise Version)
          ========================================== */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white shadow-2xl rounded-sm border-t-4 border-indigo-600 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Briefcase className="w-5 h-5 text-indigo-600"/> Site Registration Form</h3>
              <button onClick={() => setIsJobModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-6 h-6"/></button>
            </div>
            
            <form onSubmit={handleCreateJob} className="p-6 space-y-6">
              {jobError && <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Info className="w-4 h-4"/> {jobError}</div>}
              
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Job/Project Name *</label>
                  <input type="text" required value={newJob.job_name} onChange={e => setNewJob({...newJob, job_name: e.target.value})} className="w-full border border-slate-300 p-2 text-sm font-bold focus:border-indigo-600 outline-none shadow-inner" placeholder="e.g. Skyline Tower Phase 1" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Physical Site Location</label>
                  <input type="text" value={newJob.job_location} onChange={e => setNewJob({...newJob, job_location: e.target.value})} className="w-full border border-slate-300 p-2 text-sm focus:border-indigo-600 outline-none shadow-inner" placeholder="Address, City" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Contract Start Date</label>
                  <input type="date" value={newJob.contract_date} onChange={e => setNewJob({...newJob, contract_date: e.target.value})} className="w-full border border-slate-300 p-2 text-sm focus:border-indigo-600 outline-none font-mono" />
                </div>
              </div>

              {/* COMPLIANCE ROW */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-sm grid grid-cols-2 gap-4">
                <div className="col-span-2 text-[10px] font-black text-orange-800 uppercase flex items-center gap-2 mb-1"><ShieldCheck className="w-4 h-4"/> Site Compliance & Insurance (Critical for Alerts)</div>
                <div>
                  <label className="block text-[9px] font-bold text-orange-700 uppercase mb-1">Workers Comp Expiry</label>
                  <input type="date" value={newJob.wc_expire_date} onChange={e => setNewJob({...newJob, wc_expire_date: e.target.value})} className="w-full border border-orange-300 p-2 text-xs font-mono outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-orange-700 uppercase mb-1">General Liability Exp.</label>
                  <input type="date" value={newJob.gl_expire_date} onChange={e => setNewJob({...newJob, gl_expire_date: e.target.value})} className="w-full border border-orange-300 p-2 text-xs font-mono outline-none focus:border-orange-500" />
                </div>
              </div>

              {/* SITE CONTACT ROW */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Site Supervisor Name</label>
                  <input type="text" value={newJob.site_contact_name} onChange={e => setNewJob({...newJob, site_contact_name: e.target.value})} className="w-full border border-slate-300 p-2 text-sm outline-none focus:border-indigo-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Site Contact Phone</label>
                  <input type="text" value={newJob.site_contact_phone} onChange={e => setNewJob({...newJob, site_contact_phone: e.target.value})} className="w-full border border-slate-300 p-2 text-sm font-mono outline-none focus:border-indigo-600" />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={() => setIsJobModalOpen(false)} className="px-6 py-2 text-xs font-black text-slate-500 uppercase hover:text-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 text-xs font-black rounded-sm shadow-lg flex items-center gap-2 transition-all disabled:opacity-50">
                  <Save className="w-4 h-4" /> {isSubmitting ? "PROCESSING..." : "CONFIRM & SAVE RECORD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ASSIGN LABOR --- */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white shadow-xl overflow-hidden rounded-md border border-gray-400">
            <div className="px-5 py-3 border-b bg-green-50 border-green-200 flex justify-between items-center">
              <h3 className="font-bold text-green-900 text-sm flex items-center gap-2"><Users className="w-4 h-4"/> Assign Labor to Job</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-500 hover:text-red-500">&times;</button>
            </div>
            <form onSubmit={handleAssignLabor} className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Employee (Labor) *</label>
                <select required value={newAssign.employee_id} onChange={e => setNewAssign({...newAssign, employee_id: e.target.value})} className="w-full border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white">
                  <option value="" disabled>-- Choose Worker --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} (SSN: {e.ssn_last_four})</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                <div>
                  <label className="block text-[10px] font-bold text-red-700 uppercase mb-1">Pay Rate ($/hr) *</label>
                  <input type="number" step="0.01" required value={newAssign.pay_rate} onChange={e => setNewAssign({...newAssign, pay_rate: e.target.value})} className="w-full border border-red-300 bg-red-50 p-2 text-sm font-mono font-bold text-red-700 outline-none focus:border-red-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-green-700 uppercase mb-1">Bill Rate ($/hr) *</label>
                  <input type="number" step="0.01" required value={newAssign.bill_rate} onChange={e => setNewAssign({...newAssign, bill_rate: e.target.value})} className="w-full border border-green-300 bg-green-50 p-2 text-sm font-mono font-bold text-green-700 outline-none focus:border-green-500" placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-green-700 uppercase mb-1">Bill Rate OT ($/hr) *</label>
                  <input type="number" step="0.01" required value={newAssign.bill_rate_ot} onChange={e => setNewAssign({...newAssign, bill_rate_ot: e.target.value})} className="w-full border border-green-300 bg-green-50 p-2 text-sm font-mono font-bold text-green-700 outline-none focus:border-green-500" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Start Date *</label>
                  <input type="date" required value={newAssign.assignment_start_date} onChange={e => setNewAssign({...newAssign, assignment_start_date: e.target.value})} className="w-full border border-gray-300 p-2 text-sm outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white font-bold py-2 text-sm hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
                  {isSubmitting ? "Assigning..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}