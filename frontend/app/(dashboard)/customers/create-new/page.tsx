// frontend/app/(dashboard)/customers/create-new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomer } from "@/lib/api/api_customers";
import { 
  ArrowLeft, Building2, Save, X, Info, ShieldAlert, 
  MapPin, Phone, Mail, CreditCard, CalendarDays, Loader2, 
  Database, CheckCircle2, AlertCircle 
} from "lucide-react";
import Link from "next/link";

export default function CreateNewCustomerPage() {
  const router = useRouter();
  
  // ==========================================
  // 1. STATE MANAGEMENT (Full Enterprise Object)
  // ==========================================
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    customer_code: "",
    industry: "",
    contact_email: "",
    contact_phone: "",
    is_active: true,
    // Nested Compliance for Dashboard Alerts
    compliance_tracking: {
      "Contract Renewal": "",
      "Workers Comp Exp.": "",
      "General Liability Exp.": ""
    },
    // Dynamic attributes for Billing & Address
    dynamic_attributes: {
      tax_id: "",
      payment_terms: "Net 30",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      zip_code: "",
      notes: ""
    }
  });

  // ==========================================
  // 2. INPUT HANDLERS
  // ==========================================
  const handleCoreChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleComplianceChange = (name: string, date: string) => {
    setFormData({
      ...formData,
      compliance_tracking: { ...formData.compliance_tracking, [name]: date }
    });
  };

  const handleDynamicChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      dynamic_attributes: { ...formData.dynamic_attributes, [key]: value }
    });
  };

  // ==========================================
  // 3. SUBMIT LOGIC
  // ==========================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Validate customer code (standard requirement)
      if (!formData.customer_code.startsWith("CUST-")) {
        throw new Error("Client Code must start with 'CUST-' (e.g. CUST-5001)");
      }

      await createCustomer(formData as any);
      
      setMessage({ type: 'success', text: "Success! New Client master record has been created." });
      
      // Auto-redirect after success
      setTimeout(() => {
        router.push("/customers");
      }, 2000);
      
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || err.message || "Failed to save record.";
      setMessage({ type: 'error', text: Array.isArray(errorDetail) ? "Validation Error in fields." : errorDetail });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-500 overflow-hidden w-full bg-gray-50">
      
      {/* =====================================================================
          HEADER BAR
          ===================================================================== */}
      <div className="bg-slate-800 border-b border-slate-900 px-6 py-3 flex justify-between items-center shrink-0 w-full shadow-md z-10">
        <div className="flex items-center gap-4">
          <Link 
            href="/customers" 
            className="flex items-center justify-center w-8 h-8 bg-slate-700 hover:bg-slate-600 text-white rounded-sm transition-colors border border-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight tracking-wider">Register New Client Profile</h1>
            <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-0.5">Master Data Entry System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => router.push('/customers')}
            className="text-xs font-bold text-slate-300 hover:text-white transition-colors uppercase px-3"
          >
            Cancel
          </button>
          <button 
            form="mainCustomerForm"
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-sm text-xs font-black shadow-[inset_0px_1px_0px_0px_#818cf8] border border-indigo-800 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            CONFIRM & SAVE RECORD
          </button>
        </div>
      </div>

      {/* =====================================================================
          SCROLLABLE FORM CONTENT
          ===================================================================== */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        
        {message && (
          <div className={`max-w-5xl mx-auto mb-6 p-4 rounded-sm border flex items-center gap-3 shadow-sm animate-in zoom-in-95 ${
            message.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span className="text-sm font-bold uppercase tracking-wide">{message.text}</span>
          </div>
        )}

        <form id="mainCustomerForm" onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6 pb-20">
          
          {/* SECTION 1: IDENTITY & CORE INFO */}
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
            <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-700" />
              <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest">Client Identity (Core Relational)</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Client Code *</label>
                <input 
                  type="text" name="customer_code" required placeholder="CUST-0000"
                  value={formData.customer_code} onChange={handleCoreChange}
                  className="w-full border border-gray-300 rounded-sm p-2.5 text-sm font-mono font-bold bg-yellow-50 focus:border-indigo-500 outline-none shadow-inner"
                />
                <p className="text-[9px] text-gray-400 mt-1 italic">Must start with CUST- (e.g. CUST-1001)</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Company Ofiicial Name *</label>
                <input 
                  type="text" name="name" required placeholder="e.g. Metro Logistics LLC"
                  value={formData.name} onChange={handleCoreChange}
                  className="w-full border border-gray-300 rounded-sm p-2.5 text-sm font-bold text-indigo-900 focus:border-indigo-500 outline-none shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Business Industry</label>
                <select 
                  name="industry" value={formData.industry} onChange={handleCoreChange}
                  className="w-full border border-gray-300 rounded-sm p-2.5 text-sm font-bold text-gray-700 bg-white focus:border-indigo-500 outline-none shadow-inner"
                >
                  <option value="">-- Select Industry --</option>
                  <option value="Construction">Construction</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Staffing">Staffing / Labor</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Account Status</label>
                <select 
                  name="is_active" value={formData.is_active ? "true" : "false"} onChange={(e) => setFormData({...formData, is_active: e.target.value === "true"})}
                  className="w-full border border-gray-300 rounded-sm p-2.5 text-sm font-bold text-emerald-700 bg-emerald-50 focus:border-emerald-500 outline-none shadow-inner"
                >
                  <option value="true">ACTIVE (Allowed Billing)</option>
                  <option value="false">SUSPENDED / INACTIVE</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: COMMUNICATION & CONTACT */}
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
            <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-700" />
              <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest">Primary Contact Channels</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-gray-400" /> Billing Email Address
                </label>
                <input 
                  type="email" name="contact_email" placeholder="accounts@client.com"
                  value={formData.contact_email} onChange={handleCoreChange}
                  className="w-full border border-gray-300 rounded-sm p-2.5 text-sm font-bold text-blue-600 focus:border-indigo-500 outline-none shadow-inner"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-gray-400" /> Main Office Phone
                </label>
                <input 
                  type="text" name="contact_phone" placeholder="+1 (XXX) XXX-XXXX"
                  value={formData.contact_phone} onChange={handleCoreChange}
                  className="w-full border border-gray-300 rounded-sm p-2.5 text-sm font-mono font-bold text-gray-800 focus:border-indigo-500 outline-none shadow-inner"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SECTION 3: BILLING & TAX (JSONB) */}
            <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
              <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest">Accounting & Tax Setup</h3>
              </div>
              <div className="p-6 space-y-5 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Tax ID / EIN</label>
                    <input 
                      type="text" placeholder="XX-XXXXXXX"
                      value={formData.dynamic_attributes.tax_id} onChange={(e) => handleDynamicChange("tax_id", e.target.value)}
                      className="w-full border border-gray-300 rounded-sm p-2 text-sm font-mono font-bold bg-gray-50 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Payment Terms</label>
                    <select 
                      value={formData.dynamic_attributes.payment_terms} onChange={(e) => handleDynamicChange("payment_terms", e.target.value)}
                      className="w-full border border-gray-300 rounded-sm p-2 text-sm font-bold bg-white focus:border-indigo-500 outline-none"
                    >
                      <option value="Due on Receipt">Due on Receipt</option>
                      <option value="Net 15">Net 15 Days</option>
                      <option value="Net 30">Net 30 Days</option>
                      <option value="Net 60">Net 60 Days</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Billing Street Address</label>
                  <textarea 
                    rows={2} placeholder="Suite #, Street Address..."
                    value={formData.dynamic_attributes.address_line_1} onChange={(e) => handleDynamicChange("address_line_1", e.target.value)}
                    className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:border-indigo-500 outline-none resize-none shadow-inner"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" placeholder="City" value={formData.dynamic_attributes.city} onChange={(e) => handleDynamicChange("city", e.target.value)} className="w-full border border-gray-300 rounded-sm p-1.5 text-xs font-bold" />
                  <input type="text" placeholder="State" value={formData.dynamic_attributes.state} onChange={(e) => handleDynamicChange("state", e.target.value)} className="w-full border border-gray-300 rounded-sm p-1.5 text-xs font-bold uppercase" maxLength={2} />
                  <input type="text" placeholder="Zip" value={formData.dynamic_attributes.zip_code} onChange={(e) => handleDynamicChange("zip_code", e.target.value)} className="w-full border border-gray-300 rounded-sm p-1.5 text-xs font-bold font-mono" />
                </div>
              </div>
            </div>

            {/* SECTION 4: COMPLIANCE TRACKING (Dashboard Alerts) */}
            <div className="bg-white border border-orange-200 shadow-sm rounded-sm overflow-hidden flex flex-col">
              <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-black text-orange-800 uppercase tracking-widest">Compliance Trackers (Critical)</h3>
              </div>
              <div className="p-6 space-y-6 flex-1">
                <p className="text-[11px] text-orange-700 font-medium italic leading-relaxed">
                  Note: Dates entered below will trigger automatic alerts on the system dashboard when expiration is approaching.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-bold text-gray-600 uppercase">Contract Renewal</span>
                    <input 
                      type="date" value={formData.compliance_tracking["Contract Renewal"]} 
                      onChange={(e) => handleComplianceChange("Contract Renewal", e.target.value)}
                      className="border border-gray-300 rounded-sm p-1.5 text-xs font-mono font-bold bg-gray-50 focus:border-orange-500 outline-none" 
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-bold text-gray-600 uppercase">Workers Comp Exp.</span>
                    <input 
                      type="date" value={formData.compliance_tracking["Workers Comp Exp."]} 
                      onChange={(e) => handleComplianceChange("Workers Comp Exp.", e.target.value)}
                      className="border border-gray-300 rounded-sm p-1.5 text-xs font-mono font-bold bg-gray-50 focus:border-orange-500 outline-none" 
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-bold text-gray-600 uppercase">General Liability Exp.</span>
                    <input 
                      type="date" value={formData.compliance_tracking["General Liability Exp."]} 
                      onChange={(e) => handleComplianceChange("General Liability Exp.", e.target.value)}
                      className="border border-gray-300 rounded-sm p-1.5 text-xs font-mono font-bold bg-gray-50 focus:border-orange-500 outline-none" 
                    />
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-sm flex gap-3">
                   <Info className="w-5 h-5 text-blue-500 shrink-0" />
                   <p className="text-[10px] text-blue-700 leading-tight">These dates are stored in a dynamic JSONB object to ensure flexibility and future scalability.</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: ADDITIONAL REMARKS & LEGACY NOTES */}
          <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
            <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-black text-gray-700 uppercase tracking-widest">Internal Remarks & Metadata</h3>
            </div>
            <div className="p-6">
               <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">Administrative Notes</label>
               <textarea 
                  rows={3} placeholder="Add any special instructions, legacy data notes, or client history here..."
                  value={formData.dynamic_attributes.notes} onChange={(e) => handleDynamicChange("notes", e.target.value)}
                  className="w-full border border-gray-300 rounded-sm p-3 text-sm focus:border-indigo-500 outline-none resize-none shadow-inner"
               />
            </div>
          </div>

        </form>
      </div>

      {/* =====================================================================
          FORM FOOTER (Status Bar Style)
          ===================================================================== */}
      <div className="bg-slate-200 border-t border-gray-400 px-6 py-2 flex justify-between items-center shrink-0 w-full z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
         <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">System Ready • Awaiting Input</span>
         </div>
         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Edge-to-Edge Data Integrity Mode
         </div>
      </div>
    </div>
  );
}