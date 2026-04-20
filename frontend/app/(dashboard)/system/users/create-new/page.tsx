// app/(dashboard)/system/users/create-new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/api/api_users";

export default function CreateUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "EMPLOYEE",
    is_active: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createUser(newUser);
      router.push("/system/users"); // Success: Redirect to user list
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Add New System User</h1>
        <button onClick={() => router.push("/system/users")} className="text-sm font-medium text-gray-500 hover:text-gray-900">Cancel</button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address *</label>
            <input type="email" name="email" required value={newUser.email} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500" placeholder="user@company.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password *</label>
            <input type="password" name="password" required minLength={8} value={newUser.password} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500" placeholder="Minimum 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">System Role *</label>
            <select name="role" value={newUser.role} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500 bg-white">
              <option value="EMPLOYEE">Employee (Labor)</option>
              <option value="SUPERVISOR">Supervisor (Timesheet Approver)</option>
              <option value="HR_MANAGER">HR Manager (Payroll Processor)</option>
              <option value="ADMIN">Admin (Full Access)</option>
            </select>
          </div>
          <div className="pt-4 border-t">
            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {isSubmitting ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}