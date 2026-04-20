// app/(dashboard)/customers/[customer_id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getCustomerById } from "@/lib/api/api_customers";
import { getEmployees } from "@/lib/api/api_employees";
import { Customer, Employee } from "@/types";

export default function CustomerProfilePage() {
  const { customer_id } = useParams();
  const router = useRouter();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [assignedEmployees, setAssignedEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomerAndEmployees = async () => {
      try {
        if (customer_id) {
          // Fetch Master Data (Customer)
          const customerData = await getCustomerById(Number(customer_id));
          setCustomer(customerData);

          // Fetch Detail Data (Employees linked to this customer)
          // In MS Access, this is equivalent to a Sub-Form query
          const allEmployees = await getEmployees();
          const linkedEmployees = allEmployees.filter(emp => emp.customer_id === Number(customer_id));
          setAssignedEmployees(linkedEmployees);
        }
      } catch (err) {
        setError("Failed to load complex customer data. Record may be corrupt or deleted.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerAndEmployees();
  }, [customer_id]);

  if (isLoading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading MS Access Master-Detail View...</div>;
  if (error || !customer) return <div className="p-8 text-center text-red-500">{error || "Customer not found"}</div>;

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            &larr; Back to Search
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {customer.name} <span className="text-gray-400 text-lg font-normal ml-2">({customer.customer_code})</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <button className="rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            Edit Customer
          </button>
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
            Generate Client Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: MASTER DATA (Customer Info) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow sm:rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Company Master Record</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Core details migrated from legacy system.</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {customer.is_active ? "Active Client" : "Inactive"}
                    </span>
                  </dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Industry</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{customer.industry || "Not specified"}</dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-blue-600 sm:col-span-2 sm:mt-0 cursor-pointer hover:underline">{customer.contact_email || "N/A"}</dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{customer.contact_phone || "N/A"}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Legacy JSONB Data Dump */}
          <div className="bg-white shadow sm:rounded-lg border border-gray-200">
            <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-100">
              <h3 className="text-sm font-medium leading-6 text-yellow-800">Legacy MS Access Metadata</h3>
            </div>
            <div className="p-4">
              <pre className="whitespace-pre-wrap rounded-md bg-gray-900 text-green-400 p-4 text-xs overflow-x-auto h-48 overflow-y-auto">
                {Object.keys(customer.dynamic_attributes || {}).length > 0 
                  ? JSON.stringify(customer.dynamic_attributes, null, 2) 
                  : "// No legacy custom columns found during migration."}
              </pre>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SUB-FORM / DETAIL DATA (Assigned Employees) */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow sm:rounded-lg border border-gray-200 h-full flex flex-col">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Labor Roster (Sub-Form View)</h3>
                <p className="mt-1 text-sm text-gray-500">Total {assignedEmployees.length} employees currently assigned to this site.</p>
              </div>
              <button className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded border border-indigo-100 hover:bg-indigo-100 font-medium">
                + Assign Labor
              </button>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Labor Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SSN (Last 4)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        No active labor assigned to this customer yet.
                      </td>
                    </tr>
                  ) : (
                    assignedEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                              {emp.first_name[0]}{emp.last_name[0]}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{emp.first_name} {emp.last_name}</div>
                              <div className="text-sm text-gray-500">{emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ***-**-{emp.ssn_last_four || "XXXX"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${emp.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {emp.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link href={`/employees/${emp.id}`} className="text-indigo-600 hover:text-indigo-900 font-semibold">
                            Open File &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}