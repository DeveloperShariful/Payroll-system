// frontend/app/(dashboard)/customers/[customer_id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCustomerById } from "@/lib/api/api_customers";
import { getJobsByCustomer, getAssignmentsByJob } from "@/lib/api/api_tracking";
import { Customer, Job, Assignment } from "@/types";
import { ArrowLeft, Building2, Briefcase, FileText, Database, ShieldAlert, Loader2, Users } from "lucide-react";

export default function CustomerProfileMasterDetailPage() {
  const { customer_id } = useParams();
  const router = useRouter();
  
  // Master Data State
  const [customer, setCustomer] = useState<Customer | null>(null);
  
  // Detail Data States (Jobs & Active Labor)
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeLabor, setActiveLabor] = useState<Assignment[]>([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================================
  // FETCH CORE DATA & SUB-FORM RELATIONSHIPS
  // =========================================================================
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const id = Number(customer_id);
        if (!id) throw new Error("Invalid Customer ID");

        // 1. Fetch Master Record (Customer)
        const custData = await getCustomerById(id);
        setCustomer(custData);

        // 2. Fetch Related Jobs
        const jobData = await getJobsByCustomer(id);
        setJobs(jobData);

        // 3. Fetch Active Labor Assignments for all these Jobs (The Sub-form data)
        if (jobData.length > 0) {
          const allAssignments: Assignment[] = [];
          
          // Loop through jobs to get assignments (Running in parallel for speed)
          const assignmentPromises = jobData.map(job => getAssignmentsByJob(job.id));
          const assignmentResults = await Promise.all(assignmentPromises);
          
          assignmentResults.forEach((assignments, index) => {
            // Enrich assignment data with the Job Name for the UI grid
            const enriched = assignments.map(a => ({
              ...a,
              job_name: jobData[index].job_name 
            }));
            allAssignments.push(...enriched as any);
          });
          
          setActiveLabor(allAssignments.filter(a => a.is_active));
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load complex customer record. It may be corrupt or deleted.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [customer_id]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gray-50 text-gray-500 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="font-bold tracking-wider uppercase text-sm">Loading MS Access Master-Detail View...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-red-50 text-red-600 font-bold p-8 text-center border-t-4 border-red-600">
        {error || "Customer record not found."}
      </div>
    );
  }

  const legacyFieldCount = Object.keys(customer.dynamic_attributes || {}).length;
  const complianceCount = Object.keys(customer.compliance_tracking || {}).length;

  return (
    // 100% Full Height & Width (Edge-to-Edge)
    <div className="h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-300 overflow-hidden w-full bg-gray-100">
      
      {/* =====================================================================
          HEADER SECTION (Command Bar)
          ===================================================================== */}
      <div className="bg-slate-800 border-b border-slate-900 px-4 py-2.5 flex justify-between items-center shrink-0 w-full shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="flex items-center justify-center w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white rounded-sm transition-colors border border-slate-600"
            title="Back to Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white leading-tight tracking-wider flex items-center gap-2">
              {customer.name} 
              <span className="bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase border border-indigo-800/50">
                {customer.customer_code}
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">
              System ID: {customer.id} • Legacy ID: {customer.legacy_id || "N/A"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white px-4 py-1.5 rounded-sm text-xs font-bold transition-colors">
            Edit Record
          </button>
          <button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-sm text-xs font-bold shadow-[inset_0px_1px_0px_0px_#818cf8] border border-indigo-800 transition-colors">
            <FileText className="w-3.5 h-3.5" /> Client Report
          </button>
        </div>
      </div>

      {/* =====================================================================
          SCROLLABLE WORKSPACE
          ===================================================================== */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        
        {/* TOP ROW: MASTER DATA & METADATA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Card 1: Core Company Info */}
          <div className="lg:col-span-4 bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
            <div className="bg-gray-200 border-b border-gray-300 px-3 py-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-700" />
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Master Record</h3>
            </div>
            <div className="p-4 space-y-4 flex-1">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</label>
                <div className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider border shadow-sm ${customer.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-red-50 text-red-700 border-red-300'}`}>
                  {customer.is_active ? "Active Client" : "Inactive / Suspended"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Industry</label>
                  <p className="mt-0.5 text-[13px] font-bold text-gray-900">{customer.industry || "Not Specified"}</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phone</label>
                  <p className="mt-0.5 text-[13px] font-bold text-gray-900 font-mono">{customer.contact_phone || "N/A"}</p>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Primary Email</label>
                <p className="mt-0.5 text-[13px] font-bold text-blue-600 hover:underline cursor-pointer">{customer.contact_email || "No Email Provided"}</p>
              </div>
            </div>
          </div>

          {/* Card 2: Compliance & Licenses */}
          <div className="lg:col-span-4 bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
            <div className="bg-orange-100/50 border-b border-gray-300 px-3 py-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Compliance Trackers</h3>
              </div>
              <span className="bg-orange-200 text-orange-800 text-[10px] font-black px-2 rounded-sm border border-orange-300">{complianceCount}</span>
            </div>
            <div className="p-0 flex-1 overflow-y-auto">
              {complianceCount === 0 ? (
                <div className="flex items-center justify-center h-full p-4 text-[12px] text-gray-400 font-medium italic">No compliance dates tracked.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <tbody>
                    {Object.entries(customer.compliance_tracking).map(([key, value], idx) => (
                      <tr key={key} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-3 py-2 text-[12px] font-bold text-gray-700 w-1/2 border-r">{key}</td>
                        <td className="px-3 py-2 text-[12px] font-mono text-gray-900 font-bold">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Card 3: Legacy MS Access Dump */}
          <div className="lg:col-span-4 bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
            <div className="bg-blue-50 border-b border-gray-300 px-3 py-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Legacy Metadata</h3>
              </div>
              <span className="bg-blue-200 text-blue-800 text-[10px] font-black px-2 rounded-sm border border-blue-300">{legacyFieldCount}</span>
            </div>
            <div className="p-0 flex-1 overflow-y-auto max-h-48 custom-scrollbar">
              {legacyFieldCount === 0 ? (
                <div className="flex items-center justify-center h-full p-4 text-[12px] text-gray-400 font-medium italic">No extra migrated columns found.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <tbody>
                    {Object.entries(customer.dynamic_attributes).map(([key, value], idx) => (
                      <tr key={key} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-3 py-1.5 text-[11px] font-bold text-slate-600 w-1/2 border-r truncate" title={key}>{key}</td>
                        <td className="px-3 py-1.5 text-[11px] font-mono text-gray-800 truncate" title={String(value)}>{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: SUB-FORM DATAGRID (Active Labor Roster) */}
        <div className="bg-white border border-gray-400 shadow-sm flex flex-col min-h-[300px] overflow-hidden rounded-sm relative mt-4">
          
          {/* Sub-form Header */}
          <div className="bg-gray-200 border-b border-gray-400 px-3 py-2 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-700" />
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Active Labor Roster (Sub-Form View)</h3>
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest bg-indigo-100 px-2 py-0.5 rounded-sm border border-indigo-200 shadow-sm">
                Total {activeLabor.length} Workers On-Site
              </span>
              <button onClick={() => router.push("/tracking")} className="bg-white border border-gray-400 text-indigo-700 px-3 py-1 rounded-sm text-[10px] font-bold shadow-sm hover:bg-gray-50 transition-colors">
                Manage Tracking &rarr;
              </button>
            </div>
          </div>

          {/* Sub-form Grid */}
          <div className="flex-1 overflow-auto custom-scrollbar bg-gray-50">
            <table className="w-full text-left border-collapse whitespace-nowrap table-fixed">
              <thead className="bg-gray-100 sticky top-0 z-10 shadow-[0_1px_0_rgb(156,163,175)]">
                <tr>
                  <th className="border-r border-b border-gray-300 px-3 py-1.5 text-[10px] font-black text-gray-700 uppercase tracking-wider w-48">Employee Name</th>
                  <th className="border-r border-b border-gray-300 px-3 py-1.5 text-[10px] font-black text-gray-700 uppercase tracking-wider w-24 text-center">SSN (Last 4)</th>
                  <th className="border-r border-b border-gray-300 px-3 py-1.5 text-[10px] font-black text-indigo-900 bg-indigo-50 uppercase tracking-wider w-64">Assigned Job Site</th>
                  <th className="border-r border-b border-gray-300 px-3 py-1.5 text-[10px] font-black text-gray-700 uppercase tracking-wider w-32 text-center">Start Date</th>
                  <th className="border-r border-b border-gray-300 px-3 py-1.5 text-[10px] font-black text-red-900 bg-red-50 uppercase tracking-wider w-24 text-right">Pay Rate ($)</th>
                  <th className="border-b border-gray-300 px-3 py-1.5 text-[10px] font-black text-emerald-900 bg-emerald-50 uppercase tracking-wider w-24 text-right">Bill Rate ($)</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {activeLabor.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400 font-bold bg-gray-50 uppercase tracking-widest">
                      <Briefcase className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                      No active labor currently assigned to this client.
                    </td>
                  </tr>
                ) : (
                  activeLabor.map((labor, idx) => (
                    <tr key={labor.assignment_id} className={`hover:bg-indigo-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="border-r border-b border-gray-200 px-3 py-1.5 text-[12px] font-bold text-gray-900">
                        {labor.employee_name}
                      </td>
                      <td className="border-r border-b border-gray-200 px-3 py-1.5 text-[12px] font-mono text-gray-500 text-center">
                        ***-**-{labor.ssn_last_four || "XXXX"}
                      </td>
                      <td className="border-r border-b border-gray-200 px-3 py-1.5 text-[12px] font-bold text-indigo-700 truncate">
                        {(labor as any).job_name || "Unknown Site"}
                      </td>
                      <td className="border-r border-b border-gray-200 px-3 py-1.5 text-[11px] font-mono text-gray-600 text-center">
                        {labor.start_date}
                      </td>
                      <td className="border-r border-b border-gray-200 px-3 py-1.5 text-[12px] font-mono font-bold text-red-600 bg-red-50/30 text-right">
                        {labor.pay_rate.toFixed(2)}
                      </td>
                      <td className="border-b border-gray-200 px-3 py-1.5 text-[12px] font-mono font-bold text-emerald-600 bg-emerald-50/30 text-right">
                        {labor.bill_rate.toFixed(2)}
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
  );
}