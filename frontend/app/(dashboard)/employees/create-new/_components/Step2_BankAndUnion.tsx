// app/(dashboard)/employees/_components/create-new/Step2_BankAndUnion.tsx
"use client";

import { useEmployeeFormStore } from "@/store/useEmployeeFormStore";
import { BankDetails, UnionInfo } from "@/types";

export default function Step2_BankAndUnion() {
  const { formData, updateDynamicAttributes } = useEmployeeFormStore();
  
  const bankDetails = (formData.dynamic_attributes.bank_details || {}) as Partial<BankDetails>;
  const unionInfo = (formData.dynamic_attributes.union_info || {}) as Partial<UnionInfo>;

  const handleBankChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    updateDynamicAttributes("bank_details", { [e.target.name]: e.target.value });
  };

  const handleUnionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    updateDynamicAttributes("union_info", { [e.target.name]: value });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Nested Forms: Bank Details</h3>
        <p className="mt-1 text-sm text-gray-500">This data goes directly into the PostgreSQL JSONB column.</p>
      </div>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 bg-gray-50 p-4 rounded-md border border-gray-200">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Bank Name</label>
          <input
            type="text"
            name="bank_name"
            value={bankDetails.bank_name || ""}
            onChange={handleBankChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Account Number</label>
          <input
            type="text"
            name="account_number"
            value={bankDetails.account_number || ""}
            onChange={handleBankChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Routing Number</label>
          <input
            type="text"
            name="routing_number"
            value={bankDetails.routing_number || ""}
            onChange={handleBankChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Labor Source Specifics: Union Info</h3>
        <div className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-200 space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_union_member"
              checked={unionInfo.is_union_member || false}
              onChange={handleUnionChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label className="ml-2 block text-sm text-gray-900">Is Union Member?</label>
          </div>
          
          {unionInfo.is_union_member && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Union Local Number</label>
              <input
                type="text"
                name="union_local_number"
                value={unionInfo.union_local_number || ""}
                onChange={handleUnionChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}