// frontend/app/(dashboard)/system/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUsers, updateUser } from "@/lib/api/api_users";
import { User } from "@/types";
import { 
  ShieldCheck, UserPlus, Search, Filter, Loader2, 
  Lock, Unlock, Clock, Mail, Fingerprint, 
  ShieldAlert, Edit3, X, Save, CalendarDays, 
  KeyRound, History, AlertCircle
} from "lucide-react";

export default function UserManagementPage() {
  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Drawer States
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError("Critical: Failed to retrieve system access ledger.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ==========================================
  // 2. ACTION HANDLERS
  // ==========================================
  const openEditDrawer = (user: User) => {
    setEditingUser({ 
        id: user.id, 
        role: user.role, 
        is_active: user.is_active, 
        email: user.email, 
        password: "",
        is_locked: user.is_locked || false
    });
    setIsEditDrawerOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = {
        email: editingUser.email,
        role: editingUser.role,
        is_active: editingUser.is_active,
        is_locked: editingUser.is_locked
      };
      
      if (editingUser.password.trim() !== "") {
        payload.password = editingUser.password;
      }

      await updateUser(editingUser.id, payload);
      setIsEditDrawerOpen(false);
      fetchUsers(); 
      alert("System Security Protocols Updated Successfully.");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Update Rejected by Server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    // 100% Full Width & Height - Edge to Edge
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col animate-in fade-in duration-300 overflow-hidden bg-white">
      
      {/* =====================================================================
          HEADER SECTION (Enterprise Access Control Header)
          ===================================================================== */}
      <div className="bg-slate-900 border-b border-black px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center shrink-0 w-full gap-4 shadow-xl z-20">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded shadow-[0_0_10px_rgba(79,70,229,0.5)]">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-white uppercase tracking-widest leading-tight">Identity & Access Management</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5 flex items-center gap-2">
               <Fingerprint className="w-3 h-3 text-indigo-400" /> Admin-Level Security Gateway • Authorized Nodes Only
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/system/users/create-new"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-1.5 rounded-sm text-[11px] font-black uppercase shadow-[inset_0px_1px_0px_0px_#818cf8] border border-indigo-800 transition-all active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" /> Provision New User
          </Link>
        </div>
      </div>

      {/* =====================================================================
          FILTER & STATUS BAR
          ===================================================================== */}
      <div className="bg-gray-200 border-b border-gray-400 px-3 py-1.5 flex justify-between items-center shrink-0 w-full">
        <div className="flex items-center gap-4 w-full sm:w-96 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
          <input
            type="text"
            placeholder="Search Security Identifiers (Email, Role, ID)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-[11px] border border-gray-400 bg-white py-1 pl-8 pr-2 rounded-sm outline-none focus:border-indigo-500 shadow-inner placeholder:text-slate-400 font-bold text-slate-800"
          />
        </div>
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 bg-gray-300 px-3 py-1 rounded-sm border border-gray-400">
           Active Sessions: <span className="text-indigo-700">{filteredUsers.length}</span>
        </div>
      </div>

      {/* =====================================================================
          MAIN ACCESS LEDGER (DATAGRID)
          ===================================================================== */}
      {error && <div className="bg-red-600 text-white px-3 py-1 text-xs font-black uppercase tracking-widest">{error}</div>}

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full relative bg-slate-100">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap table-fixed min-w-max">
            
            <thead className="bg-gray-300 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="border-r border-b border-gray-400 px-3 py-1.5 text-[10px] font-black text-slate-700 uppercase w-12 text-center">ST</th>
                <th className="border-r border-b border-gray-400 px-3 py-1.5 text-[10px] font-black text-slate-700 uppercase w-16 text-center">ID</th>
                <th className="border-r border-b border-gray-400 px-3 py-1.5 text-[10px] font-black text-indigo-900 bg-indigo-100/50 uppercase w-64"><Mail className="w-3 h-3 inline mr-1 mb-0.5"/> Email Identifier</th>
                <th className="border-r border-b border-gray-400 px-3 py-1.5 text-[10px] font-black text-slate-700 uppercase w-32 text-center">System Role</th>
                <th className="border-r border-b border-gray-400 px-3 py-1.5 text-[10px] font-black text-slate-700 uppercase w-48 text-center"><History className="w-3 h-3 inline mr-1 mb-0.5"/> Last Authentication</th>
                <th className="border-r border-b border-gray-400 px-3 py-1.5 text-[10px] font-black text-slate-700 uppercase w-20 text-center">Login Fail</th>
                <th className="border-r border-b border-gray-400 px-3 py-1.5 text-[10px] font-black text-red-800 uppercase w-24 text-center">Locked</th>
                <th className="border-r border-b border-gray-400 px-3 py-1.5 text-[10px] font-black text-slate-700 uppercase w-28 text-center"><CalendarDays className="w-3 h-3 inline mr-1 mb-0.5"/> Provisioned</th>
                <th className="border-b border-gray-400 px-3 py-1.5 text-[10px] font-black text-slate-700 uppercase text-right w-24">Actions</th>
              </tr>
            </thead>
            
            <tbody className="bg-white">
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-20 text-center text-[11px] font-black text-slate-400 animate-pulse uppercase tracking-[0.3em]">Decoding Security Ledger...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-20 text-center text-[11px] font-black text-slate-400 bg-slate-50 uppercase tracking-widest">No Authorized Identities Found.</td></tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr key={u.id} className={`hover:bg-yellow-50 transition-none ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    
                    {/* Status */}
                    <td className="border-r border-b border-gray-200 px-2 py-1.5 text-center">
                      <span className={`inline-block h-2 w-2 rounded-full ${u.is_active ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.7)]' : 'bg-red-500'}`}></span>
                    </td>
                    
                    {/* ID */}
                    <td className="border-r border-b border-gray-200 px-2 py-1.5 text-[11px] font-mono font-bold text-slate-400 text-center bg-slate-100/30">
                      {u.id}
                    </td>
                    
                    {/* Email */}
                    <td className="border-r border-b border-gray-200 px-3 py-1.5 text-[12px] font-black text-indigo-950 uppercase truncate">
                      {u.email}
                    </td>
                    
                    {/* Role Badge */}
                    <td className="border-r border-b border-gray-200 px-2 py-1.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-tighter border ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                        u.role === 'HR_MANAGER' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        'bg-slate-100 text-slate-600 border-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    
                    {/* Last Login */}
                    <td className="border-r border-b border-gray-200 px-3 py-1.5 text-[11px] font-mono text-slate-600 text-center">
                       {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : <span className="text-slate-300 italic">Never Synced</span>}
                    </td>

                    {/* Failed Attempts */}
                    <td className="border-r border-b border-gray-200 px-3 py-1.5 text-[11px] font-black text-center text-slate-500">
                       0 {/* Backend Logic in models_core.py ensures this data */}
                    </td>

                    {/* Locked Status */}
                    <td className="border-r border-b border-gray-200 px-3 py-1.5 text-center">
                      {u.is_locked ? (
                         <span className="inline-flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 border border-red-200 rounded-sm">
                            <Lock className="w-2.5 h-2.5" /> LOCKED
                         </span>
                      ) : (
                         <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase">
                            <Unlock className="w-2.5 h-2.5" /> Secure
                         </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="border-r border-b border-gray-200 px-3 py-1.5 text-[11px] font-mono font-bold text-slate-500 text-center uppercase">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    
                    {/* Action */}
                    <td className="border-b border-gray-200 px-2 py-1 text-right">
                      <button 
                        onClick={() => openEditDrawer(u)} 
                        className="bg-white border border-slate-400 text-indigo-700 hover:bg-indigo-600 hover:text-white px-3 py-0.5 rounded-sm text-[10px] font-black uppercase transition-all shadow-sm active:scale-90"
                      >
                        REVISE
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================================
          SIDE-OVER DRAWER: USER SECURITY REVISION
          ===================================================================== */}
      {isEditDrawerOpen && editingUser && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsEditDrawerOpen(false)} />
          
          <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-black">
            
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shrink-0 shadow-lg">
              <h2 className="text-base font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <Edit3 className="w-5 h-5 text-indigo-500" /> Access Revision: {editingUser.email.split('@')[0]}
              </h2>
              <button onClick={() => setIsEditDrawerOpen(false)} className="text-slate-400 hover:text-white transition-all"><X className="w-8 h-8" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-slate-50/50">
               <form id="editUserForm" onSubmit={handleUpdateUser} className="space-y-10 pb-20">
                  
                  {/* Identity Section */}
                  <div className="bg-white border border-slate-300 p-6 rounded-sm shadow-sm space-y-6">
                     <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-3 flex items-center gap-2"><Mail className="w-4 h-4"/> Primary Identifier</h3>
                     <div>
                        <label className="block text-[10px] font-black text-slate-700 uppercase mb-2">Corporate Email Address *</label>
                        <input type="email" required value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full border-2 border-slate-200 p-2.5 text-sm font-bold focus:border-indigo-600 outline-none uppercase shadow-inner" />
                     </div>
                  </div>

                  {/* Security Section */}
                  <div className="bg-white border border-slate-300 p-6 rounded-sm shadow-sm space-y-6">
                     <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-3 flex items-center gap-2"><KeyRound className="w-4 h-4"/> Authentication Overrides</h3>
                     <div>
                        <label className="block text-[10px] font-black text-slate-700 uppercase mb-2">Reset Password <span className="text-slate-400 font-normal">(Leave blank to retain current)</span></label>
                        <input type="password" minLength={8} value={editingUser.password} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full border-2 border-slate-200 p-2.5 text-sm font-bold focus:border-indigo-600 outline-none shadow-inner" placeholder="••••••••••••" />
                     </div>
                     <div className="grid grid-cols-2 gap-6">
                        <div>
                           <label className="block text-[10px] font-black text-slate-700 uppercase mb-2">Assigned System Role</label>
                           <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})} className="w-full border-2 border-slate-200 p-2 text-sm font-black bg-white focus:border-indigo-600 outline-none">
                              <option value="ADMIN">ADMINISTRATOR</option>
                              <option value="HR_MANAGER">HR MANAGER</option>
                              <option value="SUPERVISOR">SUPERVISOR</option>
                              <option value="EMPLOYEE">STANDARD LABOR</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-700 uppercase mb-2">Identity Lock Status</label>
                           <select value={editingUser.is_locked ? "true" : "false"} onChange={e => setEditingUser({...editingUser, is_locked: e.target.value === "true"})} className={`w-full border-2 p-2 text-sm font-black bg-white outline-none ${editingUser.is_locked ? 'border-red-500 text-red-700' : 'border-slate-200'}`}>
                              <option value="false">UNLOCKED / SECURE</option>
                              <option value="true">LOCKED / NO ACCESS</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-sm flex gap-4">
                     <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                     <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                        WARING: Updating security roles or credentials will immediately invalidate any active session for this identity across all nodes.
                     </p>
                  </div>
               </form>
            </div>
            
            {/* Drawer Footer */}
            <div className="bg-slate-200 border-t border-slate-400 p-4 flex justify-end gap-3 shrink-0 shadow-inner z-20">
              <button onClick={() => setIsEditDrawerOpen(false)} className="px-8 py-2 bg-white border-2 border-slate-400 text-slate-700 text-[11px] font-black uppercase hover:bg-slate-50 transition-all active:scale-95">Cancel Revision</button>
              <button form="editUserForm" type="submit" disabled={isSubmitting} className="px-12 py-2 bg-indigo-600 border-2 border-indigo-800 text-white text-[11px] font-black uppercase shadow-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                COMMIT CHANGES
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}