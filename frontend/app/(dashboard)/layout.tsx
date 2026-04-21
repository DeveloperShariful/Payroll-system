// frontend/app/(dashboard)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { LogOut, Menu, X, LayoutDashboard, Users, Briefcase, FileText, Clock, Calculator, Database, Settings,Loader2,ShieldCheck, Building2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, _hasHydrated } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ==========================================
  // 1. AUTHENTICATION & HYDRATION CHECK
  // ==========================================
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [_hasHydrated, isAuthenticated, router]);

  if (!_hasHydrated) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-900 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
          Restoring Secure Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    if (confirm("Are you sure you want to log out?")) {
      logout();
      router.push("/login");
    }
  };

  const userRole = user?.role || "EMPLOYEE";

  // ==========================================
  // 2. NAVIGATION CONFIGURATION
  // ==========================================
  const allNavLinks = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" />, allowedRoles: ["ADMIN", "HR_MANAGER", "SUPERVISOR", "EMPLOYEE"] },
    { name: "Customers", href: "/customers", icon: <Building2 className="w-4 h-4" />, allowedRoles: ["ADMIN", "HR_MANAGER"] },
    { name: "Billing (Invoices)", href: "/payroll/invoices", icon: <FileText className="w-4 h-4" />, allowedRoles: ["ADMIN", "HR_MANAGER"] },
    { name: "Tracking (Jobs)", href: "/tracking", icon: <Briefcase className="w-4 h-4" />, allowedRoles: ["ADMIN", "HR_MANAGER"] },
    { name: "Employees", href: "/employees", icon: <Users className="w-4 h-4" />, allowedRoles: ["ADMIN", "HR_MANAGER", "SUPERVISOR"] },
    { name: "Timesheets", href: "/timesheets", icon: <Clock className="w-4 h-4" />, allowedRoles: ["ADMIN", "HR_MANAGER", "SUPERVISOR", "EMPLOYEE"] },
    { name: "Payroll", href: "/payroll", icon: <Calculator className="w-4 h-4" />, allowedRoles: ["ADMIN", "HR_MANAGER"] },
    { name: "Migration", href: "/system/migration-tools", icon: <Database className="w-4 h-4" />, allowedRoles: ["ADMIN"] },
    { name: "System Users", href: "/system/users", icon: <Settings className="w-4 h-4" />, allowedRoles: ["ADMIN"] },
  ];

  const visibleNavLinks = allNavLinks.filter(link => link.allowedRoles.includes(userRole));

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden ">
      
      {/* ==========================================
          SIDEBAR (Desktop)
          ========================================== */}
      <aside className="hidden w-64 flex-col bg-slate-900 text-white md:flex border-r border-black shadow-2xl z-30">
        <div className="flex h-16 items-center justify-center border-b border-slate-800 px-6 bg-slate-950">
          <ShieldCheck className="w-6 h-6 text-indigo-500 mr-2" />
          <h1 className="text-sm font-black tracking-[0.2em] text-center uppercase">Payroll System</h1>
        </div>
        
        {/* User Identity Section */}
        <div className="px-4 py-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg border border-indigo-400">
              {user?.email[0].toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-xs font-bold truncate text-slate-200">{user?.email}</p>
              <span className="mt-1 inline-block w-fit px-2 py-0.5 text-[9px] font-black tracking-widest text-indigo-300 bg-indigo-900/50 rounded-sm border border-indigo-500/30 uppercase">
                {userRole}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto custom-scrollbar">
          {visibleNavLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`group flex items-center gap-3 rounded-sm px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                pathname.startsWith(link.href)
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 translate-x-1"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-800 p-4 bg-slate-950">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-sm bg-red-600/10 border border-red-600/30 px-4 py-2 text-xs font-black uppercase text-red-500 hover:bg-red-600 hover:text-white transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Sign Out System
          </button>
        </div>
      </aside>

      {/* ==========================================
          MAIN CONTENT AREA
          ========================================== */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative p-1">
        
        {/* MOBILE HEADER */}
        <header className="flex h-16 items-center justify-between bg-slate-900 px-4 shadow-xl md:hidden shrink-0 z-40">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black text-white tracking-widest uppercase">Payroll</h1>
            <span className="text-[10px] font-black text-indigo-400 bg-indigo-900/50 px-2 py-0.5 rounded-sm border border-indigo-500/30">{userRole}</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-sm p-1.5 text-slate-300 hover:bg-slate-800 transition-colors border border-slate-700"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* MOBILE OVERLAY MENU */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 top-16 z-50 bg-slate-900 md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <nav className="space-y-1 px-4 py-6">
              {visibleNavLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 rounded-sm px-4 py-4 text-sm font-bold uppercase tracking-widest border-b border-slate-800 ${
                    pathname.startsWith(link.href)
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400"
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-sm bg-red-600 p-4 text-sm font-black uppercase text-white shadow-lg"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-slate-100 relative">
          {children}
        </main>

        {/* GLOBAL STATUS BAR (Optional but professional) */}
        <footer className="h-6 bg-slate-200 border-t border-slate-300 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">System Connected • Secure Tunnel Active</span>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Migration Edition v1.0</p>
        </footer>
      </div>
    </div>
  );
}