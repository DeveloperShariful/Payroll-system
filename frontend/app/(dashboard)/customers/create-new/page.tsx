// app/(dashboard)/customers/create-new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomer } from "@/lib/api/api_customers";

export default function CreateCustomerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    customer_code: "",
    industry: "",
    contact_email: "",
    contact_phone: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCustomer({ ...newCustomer, [e.target.name]: e.target.value });
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createCustomer({ ...newCustomer, is_active: true, dynamic_attributes: {} });
      router.push("/customers"); // Success হলে সোজা লিস্ট পেজে নিয়ে যাবে
    } catch (err: any) {
      alert("Failed to create customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
        <button onClick={() => router.push("/customers")} className="text-sm font-medium text-gray-500">Cancel</button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer Code *</label>
            <input type="text" name="customer_code" required value={newCustomer.customer_code} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="e.g. CUST-001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name *</label>
            <input type="text" name="name" required value={newCustomer.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Industry</label>
            <input type="text" name="industry" value={newCustomer.industry} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Email</label>
            <input type="email" name="contact_email" value={newCustomer.contact_email} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
            <input type="text" name="contact_phone" value={newCustomer.contact_phone} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div className="pt-4 border-t">
            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50">
              {isSubmitting ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}