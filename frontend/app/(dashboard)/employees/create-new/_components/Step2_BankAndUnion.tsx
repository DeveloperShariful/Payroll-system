// frontend/app/(dashboard)/employees/_components/create-new/Step2_BankAndUnion.tsx
"use client";

import { useEmployeeFormStore } from "@/store/useEmployeeFormStore";
import { BankDetails, UnionInfo } from "@/types";

export default function Step2_BankAndUnion() {
  const { formData, updateDynamicAttributes, updateCompliance } = useEmployeeFormStore();
  
  const bankDetails = (formData.dynamic_attributes.bank_details || {}) as Partial<BankDetails>;
  const unionInfo = (formData.dynamic_attributes.union_info || {}) as Partial<UnionInfo>;

  const handleBankChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    updateDynamicAttributes("bank_details", { [e.target.name]: e.target.value });
  };

  const handleUnionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    updateDynamicAttributes("union_info", { [e.target.name]: value });
  };

  const handleLicenseAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCompliance(e.target.name, e.target.value);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      
      {/* 100% Client Requirement: Compliance Tracking */}
      <div className="bg-orange-50 p-5 rounded-xl border border-orange-200">
        <h3 className="text-lg font-bold text-orange-900 mb-2">Compliance & Licenses (Alert Dashboard)</h3>
        <p className="text-sm text-orange-700 mb-4">Dates entered here will trigger the "Days to Renewal" alert on the main dashboard.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-orange-800 uppercase mb-1">General Liability Exp.</label>
            <input 
              type="date" name="Mc Labor GL" 
              value={formData.compliance_tracking["Mc Labor GL"] || ""} onChange={handleLicenseAdd}
              className="w-full border-orange-300 rounded-md p-2 bg-white focus:ring-orange-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-orange-800 uppercase mb-1">Workers Comp Exp.</label>
            <input 
              type="date" name="Mc Labor WC" 
              value={formData.compliance_tracking["Mc Labor WC"] || ""} onChange={handleLicenseAdd}
              className="w-full border-orange-300 rounded-md p-2 bg-white focus:ring-orange-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-orange-800 uppercase mb-1">Plumbers License Exp.</label>
            <input 
              type="date" name="Industrial Power Group Plumbers License" 
              value={formData.compliance_tracking["Industrial Power Group Plumbers License"] || ""} onChange={handleLicenseAdd}
              className="w-full border-orange-300 rounded-md p-2 bg-white focus:ring-orange-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-orange-800 uppercase mb-1">Electrical License Exp.</label>
            <input 
              type="date" name="Industrial Power Group Electrical License" 
              value={formData.compliance_tracking["Industrial Power Group Electrical License"] || ""} onChange={handleLicenseAdd}
              className="w-full border-orange-300 rounded-md p-2 bg-white focus:ring-orange-500" 
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Direct Deposit Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="sm:col-span-3">
            <label className="block text-sm font-bold text-gray-700">Bank Name</label>
            <input type="text" name="bank_name" value={bankDetails.bank_name || ""} onChange={handleBankChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Account Number</label>
            <input type="text" name="account_number" value={bankDetails.account_number || ""} onChange={handleBankChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Routing Number</label>
            <input type="text" name="routing_number" value={bankDetails.routing_number || ""} onChange={handleBankChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Labor Source Rules</h3>
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <div className="flex items-center">
            <input type="checkbox" name="is_union_member" checked={unionInfo.is_union_member || false} onChange={handleUnionChange} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            <label className="ml-3 block text-base font-bold text-gray-900">Is this employee an active Union Member?</label>
          </div>
          
          {unionInfo.is_union_member && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-sm font-bold text-gray-700">Union Local Chapter Number</label>
              <input type="text" name="union_local_number" value={unionInfo.union_local_number || ""} onChange={handleUnionChange} className="mt-1 block w-full sm:w-1/2 rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}