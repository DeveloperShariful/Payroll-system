// frontend/components/layout/Topbar.tsx
"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { LogOut, UserCircle } from "lucide-react";

export default function Topbar() {
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 z-10 flex-shrink-0">
      <div className="flex items-center">
        {/* আপনি চাইলে এখানে Page Title ডাইনামিক করতে পারেন */}
        <h2 className="text-lg font-semibold text-gray-800">Admin Portal</h2>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600 border-r border-gray-200 pr-4">
          <UserCircle className="h-5 w-5 text-gray-400" />
          <span className="font-medium">Admin User</span>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center text-sm font-medium text-red-600 hover:text-red-800 transition-colors bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </button>
      </div>
    </header>
  );
}