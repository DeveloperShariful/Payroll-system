// frontend/app/(dashboard)/tracking/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getCustomers } from "@/lib/api/api_customers";
import { getEmployees } from "@/lib/api/api_employees";
import { getJobsByCustomer, createJob, getAssignmentsByJob, assignEmployee } from "@/lib/api/api_tracking";
import { MapPin, Users, Briefcase, Plus, DollarSign, Building2 } from "lucide-react";

export default function TrackingMasterPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);

  // Modals & Loaders
  const [isLoading, setIsLoading] = useState(true);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Forms
  const [newJob, setNewJob] = useState({ job_name: "", job_location: "", contract_date: "" });
  const [newAssignment, setNewAssignment] = useState({ employee_id: "", pay_rate: "", bill_rate: "", bill_rate_ot: "", assignment_start_date: new Date().toISOString().split('T')[0] });

  // 1. Initial Load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const custData = await getCustomers();
        const empData = await getEmployees();
        setCustomers(custData);
        setEmployees(empData.filter((e: any) => e.is_active));
      } catch (err) {
        console.error("Failed to load tracking data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // 2. When a Customer is selected, fetch their Jobs
  const handleCustomerSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = parseInt(e.target.value);
    if (!custId) {
      setSelectedCustomer(null); setJobs([]); setSelectedJob(null); setAssignments([]); return;
    }
    
    const cust = customers.find(c => c.id === custId);
    setSelectedCustomer(cust);
    setSelectedJob(null);
    setAssignments([]);
    
    try {
      const jobData = await getJobsByCustomer(custId);
      setJobs(jobData);
    } catch (err) {
      console.error("Failed to load jobs");
    }
  };

  // 3. When a Job is selected, fetch assigned employees (Tracking)
  const handleJobSelect = async (job: any) => {
    setSelectedJob(job);
    try {
      const assignData = await getAssignmentsByJob(job.id);
      setAssignments(assignData);
    } catch (err) {
      console.error("Failed to load assignments");
    }
  };

  // 4. Create New Job
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const created = await createJob({ ...newJob, customer_id: selectedCustomer.id });
      setJobs([...jobs, created]);
      setIsJobModalOpen(false);
      setNewJob({ job_name: "", job_location: "", contract_date: "" });
    } catch (err) {
      alert("Failed to create job.");
    }
  };

  // 5. Assign Employee to Job (The Intersection)
  const handleAssignEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    try {
      await assignEmployee({
        job_id: selectedJob.id,
        employee_id: parseInt(newAssignment.employee_id),
        pay_rate: parseFloat(newAssignment.pay_rate),
        bill_rate: parseFloat(newAssignment.bill_rate),
        bill_rate_ot: parseFloat(newAssignment.bill_rate_ot),
        assignment_start_date: newAssignment.assignment_start_date
      });
      // Refresh Assignments
      const assignData = await getAssignmentsByJob(selectedJob.id);
      setAssignments(assignData);
      setIsAssignModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to assign employee.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-indigo-600" />
          Job Tracking & Labor Assignment
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage the intersection where Customers and Employees meet. Assign labor to specific jobs and set Pay/Bill rates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Customer & Job Selection */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">1. Select Customer (Client)</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
              onChange={handleCustomerSelect}
              defaultValue=""
            >
              <option value="" disabled>-- Choose a Customer --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.customer_code})</option>)}
            </select>
          </div>

          {selectedCustomer && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[500px]">
              <div className="bg-slate-50 border-b border-gray-200 p-4 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  Active Jobs for {selectedCustomer.name}
                </h3>
                <button onClick={() => setIsJobModalOpen(true)} className="text-indigo-600 hover:text-indigo-800 p-1">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                {jobs.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-10">No jobs found. Create one to assign labor.</p>
                ) : (
                  jobs.map(job => (
                    <div 
                      key={job.id}
                      onClick={() => handleJobSelect(job)}
                      className={`p-3 m-1 rounded-lg border cursor-pointer transition-colors ${
                        selectedJob?.id === job.id ? "bg-indigo-50 border-indigo-300" : "hover:bg-gray-50 border-transparent border-b-gray-200"
                      }`}
                    >
                      <p className="font-semibold text-gray-900 text-sm">{job.job_name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {job.job_location || "No location set"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: The Tracking DataGrid (Assignments) */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[610px]">
            {!selectedJob ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10">
                <Users className="w-16 h-16 mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Job Selected</h3>
                <p className="text-sm text-center max-w-md">Select a customer and a specific job from the left panel to view or assign labor.</p>
              </div>
            ) : (
              <>
                <div className="bg-indigo-600 p-6 flex justify-between items-center text-white rounded-t-xl">
                  <div>
                    <h2 className="text-xl font-bold">{selectedJob.job_name}</h2>
                    <p className="text-indigo-200 text-sm mt-1">{selectedCustomer.name} | Contract: {selectedJob.contract_date || "N/A"}</p>
                  </div>
                  <button 
                    onClick={() => setIsAssignModalOpen(true)}
                    className="bg-white text-indigo-700 px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-indigo-50 transition-colors"
                  >
                    + Assign Labor
                  </button>
                </div>
                
                {/* THE TRACKING DATAGRID */}
                <div className="flex-1 overflow-auto bg-gray-50">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white sticky top-0 shadow-sm z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee Name</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">SSN</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider bg-red-50">Pay Rate</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider bg-green-50">Bill Rate</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {assignments.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500">No labor assigned to this job yet.</td></tr>
                      ) : (
                        assignments.map((a: any) => (
                          <tr key={a.assignment_id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">{a.employee_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 font-mono">**-{a.ssn_last_four}</td>
                            <td className="px-4 py-3 text-sm text-red-600 font-mono text-right font-bold">${a.pay_rate.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-green-600 font-mono text-right font-bold">${a.bill_rate.toFixed(2)}</td>
                            <td className="px-4 py-3 text-xs">
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">Active On-Site</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL: CREATE JOB --- */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50 flex justify-between">
              <h3 className="font-bold text-gray-900">Create New Job/Site</h3>
              <button onClick={() => setIsJobModalOpen(false)} className="text-gray-400 hover:text-gray-900">&times;</button>
            </div>
            <form onSubmit={handleCreateJob} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Job/Project Name *</label>
                <input type="text" required value={newJob.job_name} onChange={e => setNewJob({...newJob, job_name: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Site Location</label>
                <input type="text" value={newJob.job_location} onChange={e => setNewJob({...newJob, job_location: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contract Start Date</label>
                <input type="date" value={newJob.contract_date} onChange={e => setNewJob({...newJob, contract_date: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg mt-4 hover:bg-indigo-700">Save Job</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ASSIGN LABOR --- */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b bg-indigo-50 flex justify-between">
              <h3 className="font-bold text-indigo-900">Assign Labor to {selectedJob?.job_name}</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-900">&times;</button>
            </div>
            <form onSubmit={handleAssignEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Select Employee (Labor) *</label>
                <select required value={newAssignment.employee_id} onChange={e => setNewAssignment({...newAssignment, employee_id: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 bg-white">
                  <option value="" disabled>-- Choose Worker --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} (SSN: {e.ssn_last_four})</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                  <label className="block text-xs font-bold text-red-800 uppercase mb-1">Pay Rate ($/hr) *</label>
                  <input type="number" step="0.01" required value={newAssignment.pay_rate} onChange={e => setNewAssignment({...newAssignment, pay_rate: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 font-mono text-red-700" placeholder="e.g. 15.00" />
                  <p className="text-[10px] text-gray-500 mt-1">Amount given to worker</p>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <label className="block text-xs font-bold text-green-800 uppercase mb-1">Bill Rate ($/hr) *</label>
                  <input type="number" step="0.01" required value={newAssignment.bill_rate} onChange={e => setNewAssignment({...newAssignment, bill_rate: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 font-mono text-green-700" placeholder="e.g. 45.00" />
                  <p className="text-[10px] text-gray-500 mt-1">Amount billed to client</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Bill Rate OT ($/hr) *</label>
                  <input type="number" step="0.01" required value={newAssignment.bill_rate_ot} onChange={e => setNewAssignment({...newAssignment, bill_rate_ot: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Start Date *</label>
                  <input type="date" required value={newAssignment.assignment_start_date} onChange={e => setNewAssignment({...newAssignment, assignment_start_date: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" />
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg mt-4 hover:bg-indigo-700 shadow-sm">Confirm Assignment</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}