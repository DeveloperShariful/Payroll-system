// frontend/app/(dashboard)/customers/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCustomers } from "@/lib/api/api_customers";
import { Customer } from "@/types";
import { Search, Plus, Loader2 } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination States
  const [offset, setOffset] = useState(0);
  const LIMIT = 100;
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchCustomers = async (searchTerm: string, currentOffset: number, isLoadMore = false) => {
    if (!isLoadMore) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const data = await getCustomers(searchTerm, true, LIMIT, currentOffset);
      
      if (data.length < LIMIT) setHasMore(false);
      else setHasMore(true);

      if (isLoadMore) {
        setCustomers(prev => [...prev, ...data]);
      } else {
        setCustomers(data);
      }
    } catch (err) {
      console.error("Failed to load customers.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Search Debounce (Resets Pagination)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setOffset(0);
      fetchCustomers(search, 0, false);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // Load More Button Handler
  const handleLoadMore = () => {
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    fetchCustomers(search, newOffset, true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Client Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage 93,000+ customer profiles securely.</p>
        </div>
        <Link 
          href="/customers/create-new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add New Client
        </Link>
      </div>

      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name, code, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-lg border-gray-300 shadow-sm pl-10 p-3 border focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Code</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Industry</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Email</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500 animate-pulse">Loading database...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">No records found.</td></tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900">{customer.customer_code}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-700">{customer.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{customer.industry || "-"}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-indigo-600">{customer.contact_email || "-"}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <Link href={`/customers/${customer.id}`} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors">
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Load More Pagination Button */}
        {!isLoading && hasMore && customers.length > 0 && (
          <div className="bg-gray-50 p-4 border-t flex justify-center">
            <button 
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 text-sm font-bold text-gray-700 rounded-lg shadow-sm hover:bg-gray-100 disabled:opacity-50"
            >
              {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoadingMore ? "Loading..." : `Load Next ${LIMIT} Records`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}