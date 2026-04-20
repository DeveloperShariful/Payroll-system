// frontend/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Users, 
  Clock, 
  DollarSign, 
  DatabaseBackup, 
  ShieldCheck 
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Timesheets", href: "/timesheets", icon: Clock },
  { name: "Payroll Processing", href: "/payroll", icon: DollarSign },
  { name: "Legacy Sync", href: "/legacy-sync", icon: DatabaseBackup },
  { name: "Audit Logs", href: "/reports/audit-logs", icon: ShieldCheck },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-gray-100 flex-shrink-0 flex flex-col h-full border-r border-gray-800 shadow-xl z-20">
      <div className="h-16 flex items-center px-6 border-b border-gray-800 bg-gray-950">
        <span className="text-xl font-bold tracking-wider text-blue-400">Enterprise</span>
        <span className="text-xl font-bold tracking-wider text-white ml-1">Payroll</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isActive 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-white" : "text-gray-400"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800 bg-gray-950 text-xs text-gray-500 text-center">
        Migration Build v1.0.0
      </div>
    </aside>
  );
}