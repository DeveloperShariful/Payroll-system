// frontend/components/employee-form/Step2FinancialPersonal.tsx
"use client";

import { useState } from "react";
import { useFormStore } from "@/store/formStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function Step2FinancialPersonal() {
  const { formData, updateFormData, nextStep, prevStep } = useFormStore();
  const existingDynamic = formData.dynamic_attributes || {};

  const [dynamicData, setDynamicData] = useState<Record<string, string>>({
    basic_salary: existingDynamic.basic_salary || "",
    bank_account: existingDynamic.bank_account || "",
    tin_number: existingDynamic.tin_number || "",
    pay_frequency: existingDynamic.pay_frequency || "Bi-weekly",
    present_address: existingDynamic.present_address || "",
    emergency_contact: existingDynamic.emergency_contact || "",
    blood_group: existingDynamic.blood_group || "",
    marital_status: existingDynamic.marital_status || "",
  });

  const handleChange = (key: string, value: string) => setDynamicData(p => ({ ...p, [key]: value }));

  const handleNext = () => {
    updateFormData({ dynamic_attributes: { ...existingDynamic, ...dynamicData } });
    nextStep();
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-300">
      
      {/* Financial Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Financial & Payroll Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Basic Salary / Hourly Rate" placeholder="$60,000 or $35/hr" value={dynamicData.basic_salary} onChange={e => handleChange("basic_salary", e.target.value)} />
          <Input label="Pay Frequency" placeholder="Weekly, Bi-weekly, Monthly" value={dynamicData.pay_frequency} onChange={e => handleChange("pay_frequency", e.target.value)} />
          <Input label="Bank Account Details" placeholder="Chase - Acct: 1234..." value={dynamicData.bank_account} onChange={e => handleChange("bank_account", e.target.value)} />
          <Input label="Tax Information (TIN)" placeholder="XXX-XX-XXXX" value={dynamicData.tin_number} onChange={e => handleChange("tin_number", e.target.value)} />
        </div>
      </section>

      {/* Personal Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Personal & Emergency Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Present Address" placeholder="123 Enterprise St, NY" className="md:col-span-2" value={dynamicData.present_address} onChange={e => handleChange("present_address", e.target.value)} />
          <Input label="Emergency Contact" placeholder="John Doe (Brother) - 555-0192" value={dynamicData.emergency_contact} onChange={e => handleChange("emergency_contact", e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Blood Group" placeholder="O+" value={dynamicData.blood_group} onChange={e => handleChange("blood_group", e.target.value)} />
            <Input label="Marital Status" placeholder="Single / Married" value={dynamicData.marital_status} onChange={e => handleChange("marital_status", e.target.value)} />
          </div>
        </div>
      </section>

      <div className="flex justify-between pt-6 border-t mt-8">
        <Button type="button" variant="outline" onClick={prevStep}>Back</Button>
        <Button type="button" onClick={handleNext}>Continue to Compliance</Button>
      </div>
    </div>
  );
}