// app/(dashboard)/system/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUsers, updateUser } from "@/lib/api/api_users";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditModal = (user: any) => {
    // Add an empty password field to the state
    setEditingUser({ id: user.id, role: user.role, is_active: user.is_active, email: user.email, password: "" });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Build payload: Only send password if admin typed something new
      const payload: any = {
        email: editingUser.email,
        role: editingUser.role,
        is_active: editingUser.is_active,
      };
      
      if (editingUser.password.trim() !== "") {
        payload.password = editingUser.password;
      }

      await updateUser(editingUser.id, payload);
      setIsEditModalOpen(false);
      fetchUsers(); 
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User & Access Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage system access, roles, and account statuses.</p>
        </div>
        <Link 
          href="/system/users/create-new"
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          + Add New User
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">System Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Loading users...</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 font-medium">{u.email}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'HR_MANAGER' ? 'bg-blue-100 text-blue-800' :
                        u.role === 'SUPERVISOR' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button onClick={() => openEditModal(u)} className="text-indigo-600 hover:text-indigo-900">Edit Details</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Edit User Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={editingUser.email} 
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-indigo-500" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reset Password <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input 
                  type="text" 
                  minLength={8}
                  placeholder="Leave blank to keep current password"
                  value={editingUser.password} 
                  onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-indigo-500 bg-gray-50" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">System Role</label>
                <select 
                  value={editingUser.role} 
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-indigo-500 bg-white"
                >
                  <option value="EMPLOYEE">Employee (Labor)</option>
                  <option value="SUPERVISOR">Supervisor (Timesheet Approver)</option>
                  <option value="HR_MANAGER">HR Manager (Payroll Processor)</option>
                  <option value="ADMIN">Admin (Full Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Account Status</label>
                <select 
                  value={editingUser.is_active ? "true" : "false"} 
                  onChange={(e) => setEditingUser({...editingUser, is_active: e.target.value === "true"})} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-indigo-500 bg-white"
                >
                  <option value="true">Active (Can Login)</option>
                  <option value="false">Disabled (Cannot Login)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}