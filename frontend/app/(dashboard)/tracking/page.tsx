// frontend/app/(dashboard)/tracking/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getCustomers } from "@/lib/api/api_customers";
import { getEmployees } from "@/lib/api/api_employees";
import { getJobsByCustomer, createJob, getAssignmentsByJob, assignEmployee } from "@/lib/api/api_tracking";
import { Briefcase, Building2, Users, Plus, FolderTree, ChevronRight, FileSpreadsheet, Loader2 } from "lucide-react";

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

  const [newJob, setNewJob] = useState({ job_name: "", job_location: "", contract_date: "" });
  const [newAssign, setNewAssign] = useState({ employee_id: "", pay_rate: "", bill_rate: "", bill_rate_ot: "", assignment_start_date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [custData, empData] = await Promise.all([getCustomers(), getEmployees()]);
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
    try {
      const created = await createJob({ ...newJob, customer_id: selectedCustomer.id });
      setJobs([...jobs, created]);
      setIsJobModalOpen(false);
      setNewJob({ job_name: "", job_location: "", contract_date: "" });
    } catch (err) {
      alert("Failed to create job.");
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
      const updatedAssignments = await getAssignmentsByJob(selectedJob.id);
      setAssignments(updatedAssignments);
      setIsAssignModalOpen(false);
      setNewAssign({ ...newAssign, employee_id: "", pay_rate: "", bill_rate: "", bill_rate_ot: "" });
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to assign labor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-10 flex justify-center text-gray-500"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 animate-in fade-in duration-300 overflow-hidden">
      
      {/* HEADER: Matches MS Access Form Header */}
      <div className="bg-white border border-gray-300 shadow-sm px-4 py-3 flex justify-between items-center shrink-0 rounded-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded">
            <FileSpreadsheet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Master Tracking Control</h1>
            <p className="text-xs text-gray-500 font-medium">Excel-Style Datasheet View (Intersection of Clients & Labor)</p>
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE: Split Pane */}
      <div className="flex flex-1 gap-4 min-h-0">
        
        {/* LEFT PANE: Hierarchy Tree (Customers -> Jobs) */}
        <div className="w-80 flex flex-col bg-white border border-gray-300 shadow-sm rounded-sm shrink-0">
          <div className="bg-gray-100 border-b border-gray-300 px-3 py-2 flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-gray-600" />
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Client Directory</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {customers.map(cust => (
              <div key={cust.id} className="border border-transparent">
                <button 
                  onClick={() => handleCustomerSelect(cust.id)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-sm transition-colors ${selectedCustomerId === cust.id ? "bg-indigo-100 text-indigo-900 font-bold border-indigo-200" : "hover:bg-gray-100 text-gray-700"}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className={`w-4 h-4 shrink-0 ${selectedCustomerId === cust.id ? "text-indigo-600" : "text-gray-400"}`} />
                    <span className="truncate">{cust.name}</span>
                  </div>
                  {selectedCustomerId === cust.id && <ChevronRight className="w-4 h-4 shrink-0" />}
                </button>

                {/* Expanded Jobs Tree */}
                {selectedCustomerId === cust.id && (
                  <div className="ml-5 mt-1 border-l border-gray-300 pl-2 space-y-1 py-1">
                    {isJobsLoading ? (
                      <span className="text-xs text-gray-400 pl-2 animate-pulse">Loading jobs...</span>
                    ) : jobs.length === 0 ? (
                      <span className="text-xs text-red-400 pl-2 font-medium">No active jobs found.</span>
                    ) : (
                      jobs.map(job => (
                        <button 
                          key={job.id}
                          onClick={() => handleJobSelect(job)}
                          className={`w-full flex items-center gap-2 px-2 py-1 text-xs rounded-sm text-left truncate transition-colors ${selectedJob?.id === job.id ? "bg-indigo-600 text-white font-bold" : "hover:bg-gray-100 text-gray-600"}`}
                        >
                          <Briefcase className="w-3 h-3 shrink-0" />
                          <span className="truncate">{job.job_name}</span>
                        </button>
                      ))
                    )}
                    <button 
                      onClick={() => setIsJobModalOpen(true)}
                      className="w-full flex items-center gap-1 px-2 py-1 mt-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-sm"
                    >
                      <Plus className="w-3 h-3" /> Create New Job
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANE: Detail Summary & Excel DataGrid */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {!selectedJob ? (
            <div className="flex-1 bg-white border border-gray-300 shadow-sm flex flex-col items-center justify-center text-gray-400 rounded-sm">
              <FileSpreadsheet className="w-16 h-16 mb-3 opacity-20" />
              <h2 className="text-lg font-bold text-gray-500">No Job Selected</h2>
              <p className="text-sm">Select a client and job from the directory tree to view the tracking datasheet.</p>
            </div>
          ) : (
            <>
              {/* Top Panel: Job Summary (Like MS Access Forms) */}
              <div className="bg-white border border-gray-300 shadow-sm px-5 py-4 shrink-0 rounded-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedJob.job_name}</h2>
                    <p className="text-sm font-medium text-indigo-600 mt-0.5">{selectedCustomer?.name}</p>
                  </div>
                  <button 
                    onClick={() => setIsAssignModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 text-sm font-bold rounded shadow-sm flex items-center gap-2 transition-colors"
                  >
                    <Users className="w-4 h-4" /> Assign Labor Here
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div><span className="block text-[10px] uppercase font-bold text-gray-400">Location</span><span className="text-sm font-medium text-gray-800">{selectedJob.job_location || "Not Provided"}</span></div>
                  <div><span className="block text-[10px] uppercase font-bold text-gray-400">Contract Date</span><span className="text-sm font-medium text-gray-800">{selectedJob.contract_date || "N/A"}</span></div>
                  <div><span className="block text-[10px] uppercase font-bold text-gray-400">Active Labor Assigned</span><span className="text-sm font-bold text-indigo-600">{assignments.length} Workers</span></div>
                </div>
              </div>

              {/* Bottom Panel: The EXCEL-STYLE DATAGRID */}
              <div className="flex-1 bg-white border border-gray-400 shadow-sm flex flex-col min-h-0 overflow-hidden rounded-sm relative">
                
                {/* Grid Toolbar */}
                <div className="bg-gray-200 border-b border-gray-400 px-2 py-1 flex gap-2 items-center shrink-0">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider border-r border-gray-400 pr-2">Datasheet View</span>
                  <span className="text-[11px] font-medium text-gray-500">{assignments.length} Records</span>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar bg-gray-50">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-gray-200 sticky top-0 z-10 shadow-[0_1px_0_rgb(156,163,175)]">
                      <tr>
                        <th className="border-r border-b border-gray-400 px-2 py-1 text-xs font-bold text-gray-700">Action</th>
                        <th className="border-r border-b border-gray-400 px-2 py-1 text-xs font-bold text-gray-700">Labor Full Name</th>
                        <th className="border-r border-b border-gray-400 px-2 py-1 text-xs font-bold text-gray-700 text-center">SSN (Last 4)</th>
                        <th className="border-r border-b border-gray-400 px-2 py-1 text-xs font-bold text-gray-700 text-center">Start Date</th>
                        <th className="border-r border-b border-gray-400 px-2 py-1 text-xs font-bold text-red-800 bg-red-100 text-right">Pay Rate ($)</th>
                        <th className="border-r border-b border-gray-400 px-2 py-1 text-xs font-bold text-green-800 bg-green-100 text-right">Bill Rate ($)</th>
                        <th className="border-b border-gray-400 px-2 py-1 text-xs font-bold text-green-800 bg-green-100 text-right">Bill OT ($)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {isGridLoading ? (
                        <tr><td colSpan={7} className="px-3 py-6 text-center text-xs text-gray-500 animate-pulse font-medium">Loading grid data...</td></tr>
                      ) : assignments.length === 0 ? (
                        <tr><td colSpan={7} className="px-3 py-6 text-center text-xs text-gray-400 font-medium bg-gray-50">No labor assigned to this job. Click 'Assign Labor' to add.</td></tr>
                      ) : (
                        assignments.map((a, idx) => (
                          <tr key={a.assignment_id} className={`hover:bg-yellow-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="border-r border-b border-gray-200 px-2 py-1 text-xs text-center w-10">
                              <span className="w-3 h-3 bg-gray-300 inline-block"></span>
                            </td>
                            <td className="border-r border-b border-gray-200 px-2 py-1 text-[13px] font-medium text-gray-900">{a.employee_name}</td>
                            <td className="border-r border-b border-gray-200 px-2 py-1 text-[13px] text-gray-600 font-mono text-center">{a.ssn_last_four}</td>
                            <td className="border-r border-b border-gray-200 px-2 py-1 text-[13px] text-gray-600 text-center">{a.start_date}</td>
                            
                            {/* Financial Columns - Strictly Monospace and Color Coded */}
                            <td className="border-r border-b border-gray-200 px-2 py-1 text-[13px] font-mono font-bold text-red-600 text-right bg-red-50/30">
                              {a.pay_rate.toFixed(2)}
                            </td>
                            <td className="border-r border-b border-gray-200 px-2 py-1 text-[13px] font-mono font-bold text-green-600 text-right bg-green-50/30">
                              {a.bill_rate.toFixed(2)}
                            </td>
                            <td className="border-b border-gray-200 px-2 py-1 text-[13px] font-mono font-bold text-green-600 text-right bg-green-50/30">
                              {a.bill_rate_ot.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* --- MODAL: CREATE JOB --- */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white shadow-xl overflow-hidden rounded-md border border-gray-400">
            <div className="px-5 py-3 border-b bg-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-sm">Create New Job/Site</h3>
              <button onClick={() => setIsJobModalOpen(false)} className="text-gray-500 hover:text-red-500">&times;</button>
            </div>
            <form onSubmit={handleCreateJob} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Job/Project Name *</label>
                <input type="text" required value={newJob.job_name} onChange={e => setNewJob({...newJob, job_name: e.target.value})} className="w-full border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Site Location</label>
                <input type="text" value={newJob.job_location} onChange={e => setNewJob({...newJob, job_location: e.target.value})} className="w-full border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Contract Start Date</label>
                <input type="date" value={newJob.contract_date} onChange={e => setNewJob({...newJob, contract_date: e.target.value})} className="w-full border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-bold py-2 text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {isSubmitting ? "Saving..." : "Save Job Record"}
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