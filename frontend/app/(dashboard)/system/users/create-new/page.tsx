// frontend/app/(dashboard)/system/users/create-new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/api/api_users";
import { 
  ArrowLeft, UserPlus, ShieldCheck, Lock, Mail, 
  KeyRound, ShieldAlert, Save, X, Info, 
  UserCheck, Loader2, CheckCircle2, AlertCircle,
  Eye, EyeOff, Fingerprint
} from "lucide-react";
import Link from "next/link";

export default function CreateNewUserPage() {
  const router = useRouter();
  
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "EMPLOYEE",
    is_active: true
  });

  // ==========================================
  // 2. HANDLERS
  // ==========================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // Basic Validation
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: "Security Mismatch: Passwords do not match." });
      setIsSubmitting(false);
      return;
    }

    try {
      // API call using the lib/api/api_users.ts
      const { confirmPassword, ...payload } = formData;
      await createUser(payload);
      
      setMessage({ type: 'success', text: "Authentication Identity Provisioned Successfully." });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/system/users");
      }, 2000);
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Node assignment failed. Email may already be registered.";
      setMessage({ type: 'error', text: typeof errorMsg === 'string' ? errorMsg : "Validation Error." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Role Description Logic for UI
  const getRoleDescription = (role: string) => {
    switch(role) {
      case 'ADMIN': return "Full root access. Can manage users, migration tools, and all financial data.";
      case 'HR_MANAGER': return "Payroll access. Can process payments, view pay stubs and manage employee files.";
      case 'SUPERVISOR': return "Operational access. Can view job sites and approve/reject daily timesheets.";
      default: return "Standard labor access. Can only submit personal daily timesheets.";
    }
  };

  return (
    // 100% Full Screen - Edge to Edge
    <div className="h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-500 overflow-hidden w-full bg-slate-50">
      
      {/* =====================================================================
          TOP HEADER BAR (High Security Theme)
          ===================================================================== */}
      <div className="bg-slate-900 border-b border-black px-6 py-3 flex justify-between items-center shrink-0 w-full shadow-xl z-20">
        <div className="flex items-center gap-4">
          <Link 
            href="/system/users" 
            className="flex items-center justify-center w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white rounded-sm transition-all border border-slate-700 shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-white uppercase tracking-[0.2em] leading-tight flex items-center gap-3">
              User Provisioning Gateway
              <span className="bg-indigo-600/20 text-indigo-400 text-[9px] px-2 py-0.5 rounded-sm border border-indigo-500/30">LEVEL: ADMIN ONLY</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Authorized protocol for creating new system identities.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             form="createUserForm"
             type="submit"
             disabled={isSubmitting}
             className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2 rounded-sm text-xs font-black uppercase shadow-[inset_0px_1px_0px_0px_#818cf8] border border-indigo-800 transition-all active:scale-95 disabled:opacity-50"
           >
             {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
             Initialize Account
           </button>
        </div>
      </div>

      {/* =====================================================================
          SCROLLABLE CONTENT AREA (Split Layout)
          ===================================================================== */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: THE FORM (7/12) */}
          <div className="lg:col-span-7 space-y-6">
            
            {message && (
              <div className={`p-4 rounded-sm border flex items-center gap-3 shadow-sm animate-in zoom-in-95 ${
                message.type === 'success' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                <span className="text-xs font-black uppercase tracking-wider">{message.text}</span>
              </div>
            )}

            <form id="createUserForm" onSubmit={handleSubmit} className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden">
               
               {/* 1. Identity Section */}
               <div className="bg-gray-100 border-b border-gray-300 px-6 py-3 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-700" />
                  <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Primary Identity Access</h3>
               </div>
               <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Corporate Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input 
                        type="email" name="email" required placeholder="user@payrollsystem.com"
                        value={formData.email} onChange={handleInputChange}
                        className="w-full border-2 border-slate-100 bg-slate-50 p-2.5 pl-10 text-sm font-bold text-slate-900 focus:border-indigo-600 focus:bg-white outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Initialize Password *</label>
                        <div className="relative">
                           <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                           <input 
                              type={showPassword ? "text" : "password"} 
                              name="password" required minLength={8}
                              value={formData.password} onChange={handleInputChange}
                              className="w-full border-2 border-slate-100 bg-slate-50 p-2.5 pl-10 pr-10 text-sm font-bold text-slate-900 focus:border-indigo-600 focus:bg-white outline-none transition-all shadow-inner"
                           />
                           <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-indigo-600">
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                           </button>
                        </div>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Verify Password *</label>
                        <input 
                           type="password" name="confirmPassword" required
                           value={formData.confirmPassword} onChange={handleInputChange}
                           className="w-full border-2 border-slate-100 bg-slate-50 p-2.5 text-sm font-bold text-slate-900 focus:border-indigo-600 focus:bg-white outline-none transition-all shadow-inner"
                        />
                     </div>
                  </div>
               </div>

               {/* 2. Permissions Section */}
               <div className="bg-gray-100 border-y border-gray-300 px-6 py-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-700" />
                  <h3 className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Permission & Privilege Level</h3>
               </div>
               <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Assigned System Role *</label>
                    <select 
                      name="role" value={formData.role} onChange={handleInputChange}
                      className="w-full border-2 border-slate-100 bg-slate-50 p-2.5 text-sm font-black text-indigo-900 focus:border-indigo-600 bg-white outline-none transition-all shadow-sm cursor-pointer"
                    >
                      <option value="EMPLOYEE">STANDARD LABOR IDENTITY (L1)</option>
                      <option value="SUPERVISOR">FIELD SUPERVISOR (L2)</option>
                      <option value="HR_MANAGER">HR / PAYROLL MANAGER (L3)</option>
                      <option value="ADMIN">ROOT ADMINISTRATOR (L4)</option>
                    </select>
                    
                    {/* Dynamic Help Text */}
                    <div className="mt-4 p-4 bg-indigo-50 border-l-4 border-indigo-600 rounded-r-sm">
                       <p className="text-[11px] font-black text-indigo-900 uppercase flex items-center gap-2">
                          <Info className="w-3.5 h-3.5" /> Authorization Scope
                       </p>
                       <p className="text-xs text-indigo-700 mt-1 font-bold leading-relaxed">{getRoleDescription(formData.role)}</p>
                    </div>
                  </div>

                  <div>
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">Initial Access State</label>
                     <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-3 rounded-sm w-fit">
                        <input 
                           type="checkbox" name="is_active" checked={formData.is_active} 
                           onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                           className="w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                        />
                        <span className="text-[11px] font-black text-emerald-800 uppercase tracking-tighter">Identity allowed for login immediately</span>
                     </div>
                  </div>
               </div>
            </form>
          </div>

          {/* RIGHT COLUMN: SECURITY POLICY (5/12) */}
          <div className="lg:col-span-5 space-y-6">
             <div className="bg-slate-900 border border-black p-6 rounded-sm shadow-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10"><Fingerprint className="w-40 h-40 text-indigo-500" /></div>
                
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                   <ShieldAlert className="w-4 h-4" /> Provisioning Security Policy
                </h3>
                
                <ul className="space-y-6 relative z-10">
                   <li className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 font-mono text-[10px] font-black text-indigo-400 border border-slate-700">01</div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-bold">Passwords must contain a minimum of <span className="text-white">8 characters</span> with at least one special identifier.</p>
                   </li>
                   <li className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 font-mono text-[10px] font-black text-indigo-400 border border-slate-700">02</div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-bold">Email addresses must be verified and associated with an official corporate domain.</p>
                   </li>
                   <li className="flex gap-4">
                      <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 font-mono text-[10px] font-black text-indigo-400 border border-slate-700">03</div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-bold">Account creation triggers an entry in the <span className="text-indigo-400">System Audit Ledger</span> for compliance tracking.</p>
                   </li>
                </ul>

                <div className="mt-10 p-4 bg-white/5 border border-white/10 rounded-sm">
                   <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-slate-500 uppercase">Encryption Node Status</span>
                      <span className="text-[9px] font-black text-emerald-500 uppercase animate-pulse">Protected</span>
                   </div>
                   <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full w-[85%] shadow-[0_0_10px_#6366f1]"></div>
                   </div>
                </div>
             </div>

             <div className="bg-white border border-gray-300 p-6 rounded-sm shadow-sm flex flex-col items-center justify-center text-center">
                <ShieldCheck className="w-12 h-12 text-emerald-500 mb-3" />
                <h4 className="text-sm font-black text-slate-900 uppercase">Secure Provisioning</h4>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest leading-relaxed">
                   This account will be encrypted using <br/> SHA-256 SALT before database commit.
                </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}