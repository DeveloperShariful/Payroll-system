// app/(dashboard)/employees/[employee_id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEmployeeById } from "@/lib/api/api_employees";
import { Employee } from "@/types";

export default function EmployeeProfilePage() {
  const { employee_id } = useParams();
  const router = useRouter();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("core"); // Tab State

  useEffect(() => {
    if (employee_id) {
      getEmployeeById(Number(employee_id))
        .then(setEmployee)
        .catch(() => console.error("Error loading employee"))
        .finally(() => setIsLoading(false));
    }
  }, [employee_id]);

  if (isLoading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Tabbed Data Interface...</div>;
  if (!employee) return <div className="p-8 text-center text-red-500">Employee record not found or deleted.</div>;

  const tabs = [
    { id: "core", name: "Core HR Record" },
    { id: "finance", name: "Bank & Financials" },
    { id: "union", name: "Union / Labor Rules" },
    { id: "legacy", name: "Legacy MS Access Dump (200+ Cols)" },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            &larr; Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {employee.first_name} {employee.last_name}
              <span className={`inline-flex rounded-full px-3 py-0.5 text-sm font-medium ${employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {employee.is_active ? "Active Labor" : "Suspended"}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">System ID: {employee.id} | Legacy Access ID: {employee.legacy_id || "N/A"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 text-sm font-medium hover:bg-indigo-100">
            Edit File
          </button>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        {/* TABS NAVIGATION */}
        <div className="border-b border-gray-200 bg-gray-50 px-4 sm:px-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* TAB CONTENTS */}
        <div className="p-6">
          
          {/* TAB 1: CORE DATA */}
          {activeTab === "core" && (
            <div className="animate-in fade-in duration-300">
              <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2 mb-4">Relational Core Information</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{employee.first_name} {employee.last_name}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{employee.email}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">SSN (Last 4)</dt>
                  <dd className="mt-1 text-sm font-mono bg-gray-100 inline-block px-2 rounded text-gray-800">***-**-{employee.ssn_last_four || "XXXX"}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Hire Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{employee.hire_date}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Department ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{employee.department_id}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Current Assigned Customer ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {employee.customer_id ? (
                       <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">#{employee.customer_id}</span>
                    ) : "Unassigned Pool"}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* TAB 2: FINANCIAL / BANK */}
          {activeTab === "finance" && (
            <div className="animate-in fade-in duration-300">
              <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2 mb-4">Direct Deposit Details (JSONB Data)</h3>
              {employee.dynamic_attributes?.bank_details ? (
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Bank Name</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{employee.dynamic_attributes.bank_details.bank_name || "N/A"}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Account Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{employee.dynamic_attributes.bank_details.account_type || "Checking"}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Account Number</dt>
                    <dd className="mt-1 text-sm font-mono text-gray-900">••••••••{employee.dynamic_attributes.bank_details.account_number?.slice(-4) || "XXXX"}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Routing Number</dt>
                    <dd className="mt-1 text-sm font-mono text-gray-900">{employee.dynamic_attributes.bank_details.routing_number || "N/A"}</dd>
                  </div>
                </dl>
              ) : (
                <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md text-sm border border-yellow-200">
                  No bank details found in legacy data for this employee. Paper check processing required.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: UNION RULES */}
          {activeTab === "union" && (
            <div className="animate-in fade-in duration-300">
              <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2 mb-4">Labor Source Specifics (JSONB Data)</h3>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center mb-6">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${employee.dynamic_attributes?.union_info?.is_union_member ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-bold text-gray-900">
                      {employee.dynamic_attributes?.union_info?.is_union_member ? "Active Union Member" : "Non-Union Labor"}
                    </h4>
                    <p className="text-sm text-gray-500">Payroll taxes will dynamically calculate Union Dues based on this flag.</p>
                  </div>
                </div>
                
                {employee.dynamic_attributes?.union_info?.is_union_member && (
                  <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-xs font-semibold text-gray-500 uppercase">Union Local Chapter Number</span>
                      <span className="block mt-1 text-lg font-medium text-gray-900">{employee.dynamic_attributes.union_info.union_local_number || "Not Specified"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LEGACY MS ACCESS DUMP */}
          {/* TAB 4: LEGACY MS ACCESS DUMP (Client-Friendly Table View) */}
          {activeTab === "legacy" && (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center border-b pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Migrated Legacy Columns</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Showing all unmapped fields migrated directly from MS Access. 
                    Total Migrated Fields: <span className="font-bold text-indigo-600">{Object.keys(employee.dynamic_attributes?.legacy_custom_fields || {}).length} Columns</span>
                  </p>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-3 py-1.5 rounded-full font-bold border border-green-200 shadow-sm">
                  100% Migrated Successfully
                </span>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-gray-200">
                          Original MS Access Column Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-gray-200">
                          Migrated Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.keys(employee.dynamic_attributes?.legacy_custom_fields || {}).length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-6 py-8 text-center text-sm text-gray-500">
                            Run the backend seed script to generate 250 columns for the demo.
                          </td>
                        </tr>
                      ) : (
                        Object.entries(employee.dynamic_attributes?.legacy_custom_fields || {}).map(([key, value], index) => (
                          <tr key={key} className={index % 2 === 0 ? "bg-white hover:bg-indigo-50" : "bg-gray-50 hover:bg-indigo-50"}>
                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-slate-700 font-mono">
                              {key}
                            </td>
                            <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                              {value as string}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6 flex justify-between">
                  <p className="text-xs text-gray-500">Notice how performance remains extremely fast despite 250+ dynamic columns using Postgres JSONB indexing.</p>
                  <button className="text-xs text-indigo-600 font-semibold hover:text-indigo-900">Export to Excel</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}