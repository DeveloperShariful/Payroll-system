// frontend/app/(dashboard)/timesheets/submit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTimesheet, getMyAssignments } from "@/lib/api/api_timesheets";
import { getEmployees } from "@/lib/api/api_employees";
import { getJobsByCustomer } from "@/lib/api/api_tracking";
import { getCustomers } from "@/lib/api/api_customers";
import { useAuthStore } from "@/store/useAuthStore";
import { Calendar, Clock, AlertCircle, ArrowLeft, CheckCircle2, UserCircle2, Building2, Briefcase } from "lucide-react";
import Link from "next/link";
import { Employee, Customer, Job } from "@/types";

export default function SubmitTimesheetPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const today = new Date().toISOString().split('T')[0];
  const role = user?.role || "EMPLOYEE";
  const isSupervisorOrAdmin = ["ADMIN", "HR_MANAGER", "SUPERVISOR"].includes(role);

  // Form State
  const [formData, setFormData] = useState({
    employee_id: "",
    customer_id: "",
    job_id: "",
    work_date: today,
    regular_hours: "8.00",
    overtime_hours: "0.00",
    double_time_hours: "0.00",
  });

  // Master Data States (For Dropdowns)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // Employee-Specific Assignments
  const [myAssignments, setMyAssignments] = useState<any[]>([]);

  // UI States
  const [isLoadingMasterData, setIsLoadingMasterData] = useState(true);
  const [isJobsLoading, setIsJobsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // =========================================================================
  // INITIAL DATA LOAD (Depends on User Role)
  // =========================================================================
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (isSupervisorOrAdmin) {
          // If Supervisor/Admin: Load all Employees and Customers for Manual Entry
          const [empData, custData] = await Promise.all([
            getEmployees("", undefined, 1000, 0),
            getCustomers("", true, 500, 0)
          ]);
          setEmployees(empData.filter(e => e.is_active));
          setCustomers(custData);
        } else {
          // If Employee: Load only their active job assignments
          const assignments = await getMyAssignments();
          setMyAssignments(assignments);
          
          // Pre-select the first job if available
          if (assignments.length > 0) {
            setFormData(prev => ({
              ...prev,
              job_id: assignments[0].job_id.toString(),
              customer_id: assignments[0].customer_id.toString()
            }));
          }
        }
      } catch (error) {
        setMessage({ type: 'error', text: "Failed to load master data. Please refresh the page." });
      } finally {
        setIsLoadingMasterData(false);
      }
    };

    fetchInitialData();
  }, [isSupervisorOrAdmin]);

  // =========================================================================
  // CASCADING DROPDOWNS LOGIC (For Supervisors)
  // =========================================================================
  const handleCustomerChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    setFormData({ ...formData, customer_id: custId, job_id: "" });
    setJobs([]);
    
    if (!custId) return;
    
    setIsJobsLoading(true);
    try {
      const jobData = await getJobsByCustomer(parseInt(custId));
      setJobs(jobData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsJobsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // =========================================================================
  // SUBMIT LOGIC
  // =========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // Validation: Job ID is mandatory for proper tracking
    if (!formData.job_id) {
      setMessage({ type: 'error', text: "You must select a specific Job Site before submitting." });
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        // If Employee, backend will use their JWT token to find ID. 
        // If Supervisor, use the dropdown selected ID.
        employee_id: isSupervisorOrAdmin ? parseInt(formData.employee_id) : 1, // Dummy 1 for Employee, Backend handles real ID
        customer_id: parseInt(formData.customer_id) || undefined,
        job_id: parseInt(formData.job_id),
        work_date: formData.work_date,
        regular_hours: parseFloat(formData.regular_hours) || 0,
        overtime_hours: parseFloat(formData.overtime_hours) || 0,
        double_time_hours: parseFloat(formData.double_time_hours) || 0,
      };

      // Ensure Employee ID is selected in Supervisor Mode
      if (isSupervisorOrAdmin && isNaN(payload.employee_id)) {
          throw new Error("Please select an Employee from the list.");
      }

      await createTimesheet(payload);
      setMessage({ type: 'success', text: "Success! Timesheet has been recorded and is pending approval." });
      
      setTimeout(() => {
        router.push("/timesheets");
      }, 1500);
      
    } catch (err: any) {
      let errorText = err.message || "An unexpected error occurred.";
      
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorText = detail;
        } else if (Array.isArray(detail)) {
          errorText = detail.map((e: any) => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(", ");
        }
      }
      
      setMessage({ type: 'error', text: errorText });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingMasterData) return <div className="p-10 flex justify-center text-indigo-600 animate-pulse font-medium">Initializing reporting engine...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-300 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/timesheets" className="text-gray-400 hover:text-indigo-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              {isSupervisorOrAdmin ? "Manual Timesheet Entry (Supervisor)" : "Daily Hours Submission"}
            </h1>
          </div>
          <p className="text-xs font-medium text-gray-500 ml-8 uppercase tracking-wider">
            Record labor hours against specific job sites and clients.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: INSTRUCTIONS & RULES */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-sm p-5 shadow-sm">
            <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" /> Reporting Rules
            </h3>
            <ul className="space-y-2 text-[13px] font-medium text-indigo-800">
              <li className="flex items-start gap-2"><span>•</span> Standard Shift Limit: 8.00 hrs</li>
              <li className="flex items-start gap-2"><span>•</span> Overtime: Any hours {'>'} 8.00</li>
              <li className="flex items-start gap-2"><span>•</span> Double Time: Sundays or Holidays</li>
              <li className="flex items-start gap-2"><span>•</span> <b>Locking:</b> Hours cannot be edited once approved by HR.</li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: THE FORM */}
        <div className="md:col-span-2">
          <div className="bg-white shadow-md border border-gray-300 rounded-sm p-6">
            
            {message && (
              <div className={`mb-6 p-4 rounded-sm border flex items-center gap-3 shadow-sm ${
                message.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                <span className="text-sm font-bold">{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* SECTION 1: WORKER IDENTIFICATION (Dynamic based on role) */}
              <div className="bg-gray-50 p-4 rounded-sm border border-gray-200 space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-200 pb-2">
                  <UserCircle2 className="w-4 h-4" /> Labor Identification
                </h4>
                
                {isSupervisorOrAdmin ? (
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Select Employee (Worker) *</label>
                    <select required name="employee_id" value={formData.employee_id} onChange={handleChange} className="w-full border border-gray-300 rounded-sm p-2.5 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm">
                      <option value="" disabled>-- Choose Labor Record --</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} (ID: {e.id})</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">Logged In As</label>
                    <div className="w-full border border-gray-300 bg-gray-200 rounded-sm p-2.5 text-sm font-mono text-gray-600 cursor-not-allowed">
                      {user?.email} (Auto-detected via JWT Token)
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Work Date *</label>
                  <input type="date" name="work_date" required value={formData.work_date} onChange={handleChange} max={today} className="w-full sm:w-1/2 border border-gray-300 rounded-sm p-2.5 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm" />
                </div>
              </div>

              {/* SECTION 2: JOB & CLIENT ASSIGNMENT */}
              <div className="bg-gray-50 p-4 rounded-sm border border-gray-200 space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-200 pb-2">
                  <Building2 className="w-4 h-4" /> Site & Tracking Assignment
                </h4>
                
                {isSupervisorOrAdmin ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">Select Client (Customer) *</label>
                      <select required value={formData.customer_id} onChange={handleCustomerChange} className="w-full border border-gray-300 rounded-sm p-2 text-sm bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm">
                        <option value="">-- Choose Client --</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1 flex justify-between">
                        <span>Select Job Site *</span>
                        {isJobsLoading && <span className="text-indigo-500 animate-pulse">Loading...</span>}
                      </label>
                      <select required name="job_id" value={formData.job_id} onChange={handleChange} disabled={!formData.customer_id || isJobsLoading} className="w-full border border-gray-300 rounded-sm p-2 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm">
                        <option value="">-- Select Active Job --</option>
                        {jobs.map(j => <option key={j.id} value={j.id}>{j.job_name}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1 flex justify-between">
                      <span>My Assigned Job Sites *</span>
                    </label>
                    <select required name="job_id" value={formData.job_id} onChange={(e) => {
                        const selectedJob = myAssignments.find(a => a.job_id.toString() === e.target.value);
                        setFormData({...formData, job_id: e.target.value, customer_id: selectedJob?.customer_id.toString() || ""});
                      }} 
                      className="w-full border border-indigo-300 rounded-sm p-2.5 text-sm bg-indigo-50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm font-bold text-indigo-900"
                    >
                      {myAssignments.length === 0 ? (
                        <option value="" disabled>You have no active assignments.</option>
                      ) : (
                        myAssignments.map(a => <option key={a.job_id} value={a.job_id}>{a.job_name}</option>)
                      )}
                    </select>
                    {myAssignments.length === 0 && <p className="text-xs text-red-500 mt-1 font-medium">Please contact your supervisor to assign you to a job before submitting hours.</p>}
                  </div>
                )}
              </div>

              {/* SECTION 3: HOURS ENTRY (Financial Precision) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-3 bg-white rounded-sm border border-gray-300 shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.06)]">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-wider">Regular Hours</label>
                  <input type="number" step="0.25" min="0" max="24" name="regular_hours" value={formData.regular_hours} onChange={handleChange} className="w-full text-2xl font-mono font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0" />
                </div>
                <div className="p-3 bg-amber-50 rounded-sm border border-amber-200 shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.06)]">
                  <label className="block text-[10px] font-bold text-amber-700 uppercase mb-2 tracking-wider">Overtime Hrs (1.5x)</label>
                  <input type="number" step="0.25" min="0" max="24" name="overtime_hours" value={formData.overtime_hours} onChange={handleChange} className="w-full text-2xl font-mono font-bold text-amber-900 bg-transparent border-none outline-none focus:ring-0 p-0" />
                </div>
                <div className="p-3 bg-purple-50 rounded-sm border border-purple-200 shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.06)]">
                  <label className="block text-[10px] font-bold text-purple-700 uppercase mb-2 tracking-wider">Double Time (2.0x)</label>
                  <input type="number" step="0.25" min="0" max="24" name="double_time_hours" value={formData.double_time_hours} onChange={handleChange} className="w-full text-2xl font-mono font-bold text-purple-900 bg-transparent border-none outline-none focus:ring-0 p-0" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button 
                  type="submit" disabled={isSubmitting || (!isSupervisorOrAdmin && myAssignments.length === 0)} 
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-sm shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
                >
                  {isSubmitting ? "Submitting securely..." : "Submit Timesheet Entry"}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}