// frontend/app/(dashboard)/customers/[customer_id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCustomerById, updateCustomer } from "@/lib/api/api_customers";
import { getJobsByCustomer, getAssignmentsByJob } from "@/lib/api/api_tracking";
import { Customer, Job, Assignment } from "@/types";
import { 
  ArrowLeft, Building2, Briefcase, FileText, Database, ShieldAlert, 
  Loader2, Users, Edit, X, Save, MapPin, Phone, Mail, FileCheck2, 
  CreditCard, Plus, Trash2
} from "lucide-react";

export default function CustomerProfileMasterDetailPage() {
  const { customer_id } = useParams();
  const router = useRouter();
  
  // =========================================================================
  // 1. STATE MANAGEMENT
  // =========================================================================
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeLabor, setActiveLabor] = useState<Assignment[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Slide-over Form States (Edit Mode)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Editable Form Data
  const [editFormData, setEditFormData] = useState<Partial<Customer>>({});
  
  // Dynamic Compliance Trackers State (For adding/removing dates)
  const [complianceEntries, setComplianceEntries] = useState<{name: string, date: string}[]>([]);

  // =========================================================================
  // 2. FETCH CORE DATA & SUB-FORM RELATIONSHIPS
  // =========================================================================
  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const id = Number(customer_id);
      if (!id) throw new Error("Invalid Customer ID");

      // A. Fetch Master Record
      const custData = await getCustomerById(id);
      setCustomer(custData);
      
      // Initialize Edit Form Data
      setEditFormData(custData);
      
      // Transform Compliance Record object into array for easy editing
      const trackers = custData.compliance_tracking || {};
      const trackerArray = Object.entries(trackers).map(([key, value]) => ({ name: key, date: value as string }));
      setComplianceEntries(trackerArray);

      // B. Fetch Related Jobs
      const jobData = await getJobsByCustomer(id);
      setJobs(jobData);

      // C. Fetch Active Labor Assignments (Sub-form data)
      if (jobData.length > 0) {
        const allAssignments: Assignment[] = [];
        const assignmentPromises = jobData.map(job => getAssignmentsByJob(job.id));
        const assignmentResults = await Promise.all(assignmentPromises);
        
        assignmentResults.forEach((assignments, index) => {
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
      setError("Failed to load customer record. It may be corrupt or deleted.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer_id]);

  // =========================================================================
  // 3. EDIT FORM HANDLERS
  // =========================================================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleDynamicChange = (key: string, value: string) => {
    setEditFormData({
      ...editFormData,
      dynamic_attributes: {
        ...(editFormData.dynamic_attributes || {}),
        [key]: value
      }
    });
  };

  // Tracker Logic
  const addTracker = () => setComplianceEntries([...complianceEntries, { name: "", date: "" }]);
  
  const updateTracker = (index: number, field: 'name' | 'date', value: string) => {
    const newEntries = [...complianceEntries];
    newEntries[index][field] = value;
    setComplianceEntries(newEntries);
  };
  
  const removeTracker = (index: number) => {
    setComplianceEntries(complianceEntries.filter((_, i) => i !== index));
  };

  // Submit Update
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Rebuild compliance_tracking object from array
      const newComplianceRecord: Record<string, string> = {};
      complianceEntries.forEach(entry => {
        if (entry.name.trim() && entry.date) {
          newComplianceRecord[entry.name.trim()] = entry.date;
        }
      });

      const payload = {
        ...editFormData,
        compliance_tracking: newComplianceRecord,
        // Ensure dynamic attributes exist
        dynamic_attributes: editFormData.dynamic_attributes || {}
      };

      await updateCustomer(Number(customer_id), payload);
      
      // Close drawer and refresh UI
      setIsEditDrawerOpen(false);
      await fetchProfileData();
      
      alert("Customer profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // 4. RENDER GUARDS
  // =========================================================================
  if (isLoading) return (
    <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-gray-50 text-gray-500 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      <p className="font-bold tracking-wider uppercase text-sm">Loading MS Access Master-Detail View...</p>
    </div>
  );

  if (error || !customer) return (
    <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-red-50 text-red-600 font-bold p-8 text-center border-t-4 border-red-600">
      {error || "Customer record not found."}
    </div>
  );

  // Helper variables
  const dynAttrs = customer.dynamic_attributes || {};
  const legacyFieldCount = Object.keys(dynAttrs.legacy_custom_fields || {}).length;
  const complianceCount = Object.keys(customer.compliance_tracking || {}).length;

  return (
    // 100% Edge-to-Edge Container
    <div className="h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-300 overflow-hidden w-full bg-gray-100 relative">
      
      {/* =====================================================================
          HEADER SECTION (Command Bar)
          ===================================================================== */}
      <div className="bg-slate-800 border-b border-slate-900 px-4 py-2 flex justify-between items-center shrink-0 w-full shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/customers')} 
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
              System ID: {customer.id} • Legacy ID: {customer.legacy_id || "N/A"} • Since: {new Date(customer.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEditDrawerOpen(true)}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white px-4 py-1.5 rounded-sm text-xs font-bold transition-colors shadow-sm"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Record
          </button>
          <button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-sm text-xs font-bold shadow-[inset_0px_1px_0px_0px_#818cf8] border border-indigo-800 transition-colors">
            <FileText className="w-3.5 h-3.5" /> Client Report
          </button>
        </div>
      </div>

      {/* =====================================================================
          SCROLLABLE WORKSPACE
          ===================================================================== */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        
        {/* TOP ROW: MASTER DATA CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Card 1: Core Company Info */}
          <div className="lg:col-span-3 bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
            <div className="bg-gray-200 border-b border-gray-300 px-3 py-1.5 flex items-center gap-2 shrink-0">
              <Building2 className="w-3.5 h-3.5 text-indigo-700" />
              <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">Master Record</h3>
            </div>
            <div className="p-3 flex-1">
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-1/3">Status</td>
                    <td className="py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border shadow-sm ${customer.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-red-50 text-red-700 border-red-300'}`}>
                        {customer.is_active ? "Active Client" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Industry</td>
                    <td className="py-2 text-[12px] font-bold text-gray-900">{customer.industry || "-"}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phone</td>
                    <td className="py-2 text-[12px] font-bold text-gray-900 font-mono">{customer.contact_phone || "-"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email</td>
                    <td className="py-2 text-[12px] font-bold text-blue-600 hover:underline cursor-pointer truncate max-w-[150px]">{customer.contact_email || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Billing & Additional Info (From JSONB) */}
          <div className="lg:col-span-3 bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
            <div className="bg-gray-200 border-b border-gray-300 px-3 py-1.5 flex items-center gap-2 shrink-0">
              <CreditCard className="w-3.5 h-3.5 text-indigo-700" />
              <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">Billing & Address</h3>
            </div>
            <div className="p-3 flex-1">
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-1/3">Tax ID / EIN</td>
                    <td className="py-2 text-[12px] font-bold text-gray-900 font-mono bg-gray-50 px-2 rounded-sm">{dynAttrs.tax_id || "Not Provided"}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Payment Term</td>
                    <td className="py-2 text-[12px] font-bold text-gray-900">{dynAttrs.payment_terms || "Due on Receipt"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider align-top pt-2">Address</td>
                    <td className="py-2 text-[12px] font-medium text-gray-700 leading-tight">
                      {dynAttrs.address_line_1 || "No Address Provided"}<br/>
                      {dynAttrs.city ? `${dynAttrs.city}, ${dynAttrs.state} ${dynAttrs.zip_code}` : ""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 3: Compliance & Licenses */}
          <div className="lg:col-span-3 bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
            <div className="bg-orange-100/50 border-b border-gray-300 px-3 py-1.5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />
                <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">Compliance Trackers</h3>
              </div>
              <span className="bg-orange-200 text-orange-800 text-[10px] font-black px-1.5 py-0.5 rounded-sm border border-orange-300">{complianceCount}</span>
            </div>
            <div className="p-0 flex-1 overflow-y-auto custom-scrollbar h-36">
              {complianceCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-[11px] text-gray-400 font-medium italic text-center">
                  <FileCheck2 className="w-6 h-6 mb-1 opacity-20" />
                  No compliance dates tracked.<br/>Click Edit Record to add.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <tbody>
                    {Object.entries(customer.compliance_tracking).map(([key, value], idx) => {
                      // Calculate days left for color coding
                      const daysLeft = Math.ceil((new Date(value as string).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                      const isOverdue = daysLeft < 0;
                      return (
                        <tr key={key} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-3 py-1.5 text-[11px] font-bold text-slate-700 w-1/2 border-r">{key}</td>
                          <td className={`px-3 py-1.5 text-[11px] font-mono font-bold text-right ${isOverdue ? 'text-red-600 bg-red-50/50' : 'text-gray-900'}`}>
                            {value as string}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Card 4: Legacy MS Access Dump */}
          <div className="lg:col-span-3 bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
            <div className="bg-blue-50 border-b border-gray-300 px-3 py-1.5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">Legacy Metadata</h3>
              </div>
              <span className="bg-blue-200 text-blue-800 text-[10px] font-black px-1.5 py-0.5 rounded-sm border border-blue-300">{legacyFieldCount}</span>
            </div>
            <div className="p-0 flex-1 overflow-y-auto custom-scrollbar h-36">
              {legacyFieldCount === 0 ? (
                <div className="flex items-center justify-center h-full p-4 text-[11px] text-gray-400 font-medium italic text-center">
                  No extra migrated columns found.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <tbody>
                    {Object.entries(dynAttrs.legacy_custom_fields || {}).map(([key, value], idx) => (
                      <tr key={key} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-3 py-1 text-[10px] font-bold text-slate-500 border-r truncate max-w-[100px]" title={key}>{key}</td>
                        <td className="px-3 py-1 text-[10px] font-mono text-gray-800 truncate max-w-[100px]" title={String(value)}>{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* =====================================================================
            BOTTOM SECTION: SUB-FORM DATAGRID (Active Labor Roster)
            ===================================================================== */}
        <div className="bg-white border border-gray-400 shadow-sm flex flex-col min-h-[350px] flex-1 overflow-hidden rounded-sm relative mt-2">
          
          {/* Sub-form Header */}
          <div className="bg-slate-200 border-b border-gray-400 px-3 py-1.5 flex justify-between items-center shrink-0 shadow-[0_1px_0_rgb(156,163,175)] z-10">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-700" />
              <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">Active Labor Roster (Sub-Form View)</h3>
            </div>
            <div className="flex gap-3 items-center">
              <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-widest bg-indigo-100 px-2 py-0.5 rounded-sm border border-indigo-300 shadow-sm">
                Total {activeLabor.length} Workers On-Site
              </span>
              <button onClick={() => router.push("/tracking")} className="bg-white border border-gray-400 text-gray-700 px-3 py-0.5 rounded-sm text-[10px] font-bold shadow-[inset_1px_1px_0px_white,inset_-1px_-1px_0px_gray] hover:bg-gray-100 transition-all active:shadow-[inset_1px_1px_0px_gray]">
                Manage Tracking &rarr;
              </button>
            </div>
          </div>

          {/* Sub-form Grid (Excel Style) */}
          <div className="flex-1 overflow-auto custom-scrollbar bg-gray-50">
            <table className="w-full text-left border-collapse whitespace-nowrap table-fixed min-w-max">
              <thead className="bg-gray-100 sticky top-0 z-10 shadow-[0_1px_0_rgb(209,213,219)]">
                <tr>
                  <th className="border-r border-b border-gray-300 px-3 py-1 text-[10px] font-black text-gray-700 uppercase tracking-wider w-48">Employee Name</th>
                  <th className="border-r border-b border-gray-300 px-3 py-1 text-[10px] font-black text-gray-700 uppercase tracking-wider w-28 text-center">SSN (Last 4)</th>
                  <th className="border-r border-b border-gray-300 px-3 py-1 text-[10px] font-black text-indigo-900 bg-indigo-50 uppercase tracking-wider w-64">Assigned Job Site</th>
                  <th className="border-r border-b border-gray-300 px-3 py-1 text-[10px] font-black text-gray-700 uppercase tracking-wider w-32 text-center">Start Date</th>
                  <th className="border-r border-b border-gray-300 px-3 py-1 text-[10px] font-black text-red-900 bg-red-50 uppercase tracking-wider w-28 text-right">Pay Rate ($)</th>
                  <th className="border-b border-gray-300 px-3 py-1 text-[10px] font-black text-emerald-900 bg-emerald-50 uppercase tracking-wider w-28 text-right">Bill Rate ($)</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {activeLabor.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-[12px] text-gray-400 font-bold bg-gray-50 uppercase tracking-widest">
                      <Briefcase className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                      No active labor currently assigned to this client.
                    </td>
                  </tr>
                ) : (
                  activeLabor.map((labor, idx) => (
                    <tr key={labor.assignment_id} className={`hover:bg-indigo-50/50 transition-none ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="border-r border-b border-gray-200 px-3 py-1.5 text-[12px] font-bold text-gray-900 truncate">
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
                      <td className="border-r border-b border-gray-200 px-3 py-1.5 text-[13px] font-mono font-bold text-red-600 bg-red-50/30 text-right">
                        {labor.pay_rate.toFixed(2)}
                      </td>
                      <td className="border-b border-gray-200 px-3 py-1.5 text-[13px] font-mono font-bold text-emerald-600 bg-emerald-50/30 text-right">
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

      {/* =====================================================================
          SLIDE-OVER DRAWER FORM (FULL HEIGHT EDIT MODE)
          ===================================================================== */}
      {isEditDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Dark Overlay Background */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsEditDrawerOpen(false)} />
          
          {/* Drawer Panel */}
          <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right border-l border-gray-300">
            
            {/* Drawer Header */}
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-indigo-400" /> Edit Master Profile
              </h2>
              <button onClick={() => setIsEditDrawerOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Drawer Form Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50">
              <form id="editCustomerForm" onSubmit={handleUpdateSubmit} className="space-y-8">
                
                {/* SECTION 1: CORE DATA */}
                <div className="bg-white p-5 rounded-sm border border-gray-300 shadow-sm space-y-4">
                  <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5" /> General Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Company Name *</label>
                      <input type="text" name="name" required value={editFormData.name || ""} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:border-indigo-500 outline-none font-bold text-gray-900 shadow-inner" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Client Code *</label>
                      <input type="text" name="customer_code" required value={editFormData.customer_code || ""} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm p-2 text-sm bg-gray-100 text-gray-500 font-mono outline-none shadow-inner" readOnly title="Code cannot be changed after creation" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Industry</label>
                      <input type="text" name="industry" value={editFormData.industry || ""} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:border-indigo-500 outline-none shadow-inner" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Status</label>
                      <select name="is_active" value={editFormData.is_active ? "true" : "false"} onChange={(e) => setEditFormData({...editFormData, is_active: e.target.value === "true"})} className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:border-indigo-500 outline-none shadow-inner font-bold bg-white">
                        <option value="true">Active Client</option>
                        <option value="false">Inactive / Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: CONTACT & BILLING (Stored in JSONB) */}
                <div className="bg-white p-5 rounded-sm border border-gray-300 shadow-sm space-y-4">
                  <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Contact & Billing Setup
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Primary Email</label>
                      <input type="email" name="contact_email" value={editFormData.contact_email || ""} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:border-indigo-500 outline-none shadow-inner" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Phone Number</label>
                      <input type="text" name="contact_phone" value={editFormData.contact_phone || ""} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:border-indigo-500 outline-none shadow-inner font-mono" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Tax ID / EIN</label>
                      <input type="text" value={editFormData.dynamic_attributes?.tax_id || ""} onChange={(e) => handleDynamicChange("tax_id", e.target.value)} className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:border-indigo-500 outline-none shadow-inner font-mono bg-yellow-50" placeholder="XX-XXXXXXX" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">Payment Terms</label>
                      <select value={editFormData.dynamic_attributes?.payment_terms || "Due on Receipt"} onChange={(e) => handleDynamicChange("payment_terms", e.target.value)} className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:border-indigo-500 outline-none shadow-inner bg-white">
                        <option value="Due on Receipt">Due on Receipt</option>
                        <option value="Net 15">Net 15 Days</option>
                        <option value="Net 30">Net 30 Days</option>
                        <option value="Net 60">Net 60 Days</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3 h-3"/> Billing Address</label>
                    <textarea value={editFormData.dynamic_attributes?.address_line_1 || ""} onChange={(e) => handleDynamicChange("address_line_1", e.target.value)} rows={2} className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:border-indigo-500 outline-none shadow-inner resize-none" placeholder="123 Corporate Blvd, Suite 400..." />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1"><input type="text" placeholder="City" value={editFormData.dynamic_attributes?.city || ""} onChange={(e) => handleDynamicChange("city", e.target.value)} className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:border-indigo-500 outline-none shadow-inner" /></div>
                    <div className="col-span-1"><input type="text" placeholder="State" value={editFormData.dynamic_attributes?.state || ""} onChange={(e) => handleDynamicChange("state", e.target.value)} className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:border-indigo-500 outline-none shadow-inner uppercase" maxLength={2} /></div>
                    <div className="col-span-1"><input type="text" placeholder="Zip Code" value={editFormData.dynamic_attributes?.zip_code || ""} onChange={(e) => handleDynamicChange("zip_code", e.target.value)} className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:border-indigo-500 outline-none shadow-inner font-mono" /></div>
                  </div>
                </div>

                {/* SECTION 3: DYNAMIC COMPLIANCE TRACKERS */}
                <div className="bg-white p-5 rounded-sm border border-orange-300 shadow-sm space-y-4">
                  <div className="border-b border-orange-200 pb-2 mb-4 flex justify-between items-center">
                    <h3 className="text-[11px] font-black text-orange-800 uppercase tracking-widest flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5" /> License & Contract Expiry Trackers
                    </h3>
                    <button type="button" onClick={addTracker} className="text-[10px] bg-orange-100 text-orange-800 border border-orange-300 px-2 py-1 rounded-sm font-bold flex items-center gap-1 hover:bg-orange-200 transition-colors">
                      <Plus className="w-3 h-3" /> Add Tracker
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 italic mb-2">Dates entered here will automatically trigger alerts on the main dashboard.</p>
                  
                  <div className="space-y-2">
                    {complianceEntries.length === 0 ? (
                      <div className="text-center p-4 bg-gray-50 border border-dashed border-gray-300 rounded-sm text-sm text-gray-400">No trackers added yet.</div>
                    ) : (
                      complianceEntries.map((entry, index) => (
                        <div key={index} className="flex items-center gap-3 bg-gray-50 p-2 border border-gray-200 rounded-sm">
                          <input 
                            type="text" placeholder="e.g. Workers Comp Expiration" 
                            value={entry.name} onChange={(e) => updateTracker(index, 'name', e.target.value)}
                            className="flex-1 border border-gray-300 rounded-sm p-1.5 text-sm font-medium outline-none focus:border-orange-500" 
                          />
                          <input 
                            type="date" 
                            value={entry.date} onChange={(e) => updateTracker(index, 'date', e.target.value)}
                            className="w-40 border border-gray-300 rounded-sm p-1.5 text-sm font-mono outline-none focus:border-orange-500" 
                          />
                          <button type="button" onClick={() => removeTracker(index)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-sm transition-colors" title="Remove Tracker">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </form>
            </div>
            
            {/* Drawer Footer (Actions) */}
            <div className="bg-gray-200 border-t border-gray-400 p-4 flex justify-end gap-3 shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
              <button 
                type="button" 
                onClick={() => setIsEditDrawerOpen(false)}
                className="px-6 py-2 bg-white border border-gray-400 text-gray-700 text-xs font-bold rounded-sm shadow-[inset_1px_1px_0px_white,inset_-1px_-1px_0px_gray] hover:bg-gray-50 transition-all active:shadow-[inset_1px_1px_0px_gray]"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="editCustomerForm"
                disabled={isSubmitting}
                className="px-8 py-2 bg-indigo-600 border border-indigo-800 text-white text-xs font-bold rounded-sm shadow-[inset_1px_1px_0px_#818cf8,inset_-1px_-1px_0px_#3730a3] hover:bg-indigo-700 disabled:opacity-70 transition-all flex items-center gap-2 active:shadow-[inset_1px_1px_0px_#3730a3]"
              >
                {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Data...</> : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
              </button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}