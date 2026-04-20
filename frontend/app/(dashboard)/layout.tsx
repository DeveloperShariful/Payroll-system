// app/(dashboard)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("access_token");
    if (token) {
      setHasAccess(true);
    } else {
      router.push("/login");
    }
  }, [router]);

  if (!isMounted) return null; 
  if (!hasAccess) return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Define access control for Sidebar Menus based on Backend UserRole enum
  const userRole = user?.role || "EMPLOYEE"; // Fallback to lowest privilege

  const allNavLinks = [
    { name: "Dashboard", href: "/dashboard", allowedRoles: ["ADMIN", "HR_MANAGER", "SUPERVISOR", "EMPLOYEE"] },
    { name: "Customers", href: "/customers", allowedRoles: ["ADMIN", "HR_MANAGER"] },
    { name: "Billing (Invoices)", href: "/payroll/invoices", allowedRoles: ["ADMIN", "HR_MANAGER"] },
    { name: "Tracking (Jobs)", href: "/tracking", allowedRoles: ["ADMIN", "HR_MANAGER"] },
    { name: "Employees", href: "/employees", allowedRoles: ["ADMIN", "HR_MANAGER", "SUPERVISOR"] },
    { name: "Timesheets", href: "/timesheets", allowedRoles: ["ADMIN", "HR_MANAGER", "SUPERVISOR", "EMPLOYEE"] },
    { name: "Payroll", href: "/payroll", allowedRoles: ["ADMIN", "HR_MANAGER"] },
    { name: "Migration", href: "/system/migration-tools", allowedRoles: ["ADMIN"] },
    { name: "System Users", href: "/system/users", allowedRoles: ["ADMIN"] },
  ];

  // Filter links based on current user's role
  const visibleNavLinks = allNavLinks.filter(link => link.allowedRoles.includes(userRole));

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="hidden w-64 flex-col bg-slate-900 text-white md:flex">
        <div className="flex h-16 items-center justify-center border-b border-slate-800 px-4">
          <h1 className="text-lg font-bold tracking-wider text-center">PAYROLL SYSTEM</h1>
        </div>
        
        {/* User Role Badge */}
        <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800 flex justify-center">
          <span className="px-2 py-1 text-xs font-semibold tracking-wider text-indigo-300 bg-indigo-900/50 rounded-full">
            {userRole}
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {visibleNavLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith(link.href)
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center rounded-md bg-red-600/90 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between bg-white px-4 shadow-sm md:hidden">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">PAYROLL SYSTEM</h1>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{userRole}</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-md p-2 text-slate-400 hover:bg-gray-100 hover:text-slate-500 focus:outline-none"
          >
            <span className="sr-only">Open menu</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3 bg-white border-b">
              {visibleNavLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block rounded-md px-3 py-2 text-base font-medium ${
                    pathname.startsWith(link.href)
                      ? "bg-indigo-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="mt-4 block w-full rounded-md bg-red-600 px-3 py-2 text-center text-base font-medium text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}