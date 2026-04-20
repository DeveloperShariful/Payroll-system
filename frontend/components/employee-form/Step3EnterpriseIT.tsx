// frontend/components/employee-form/Step3EnterpriseIT.tsx
"use client";

import { useState } from "react";
import { useFormStore } from "@/store/formStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function Step3EnterpriseIT() {
  const { formData, updateFormData, nextStep, prevStep } = useFormStore();
  const existingDynamic = formData.dynamic_attributes || {};

  const [dynamicData, setDynamicData] = useState<Record<string, string>>({
    background_check: existingDynamic.background_check || "Pending",
    visa_status: existingDynamic.visa_status || "Citizen",
    nda_signed: existingDynamic.nda_signed || "No",
    skills: existingDynamic.skills || "",
    assigned_assets: existingDynamic.assigned_assets || "",
    system_roles: existingDynamic.system_roles || "Standard User",
  });

  const handleChange = (key: string, value: string) => setDynamicData(p => ({ ...p, [key]: value }));

  const handleNext = () => {
    updateFormData({ dynamic_attributes: { ...existingDynamic, ...dynamicData } });
    nextStep();
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-300">
      
      {/* Compliance Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Compliance & Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Background Check Status" placeholder="Cleared / Pending" value={dynamicData.background_check} onChange={e => handleChange("background_check", e.target.value)} />
          <Input label="Work Permit / Visa Status" placeholder="US Citizen / H1B" value={dynamicData.visa_status} onChange={e => handleChange("visa_status", e.target.value)} />
          <Input label="NDAs & Agreements" placeholder="Signed / Pending" value={dynamicData.nda_signed} onChange={e => handleChange("nda_signed", e.target.value)} />
          <Input label="Skills & Certifications" placeholder="AWS, Python, First Aid" value={dynamicData.skills} onChange={e => handleChange("skills", e.target.value)} />
        </div>
      </section>

      {/* IT & Assets Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Assets & IT Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Assigned Assets (SN)" placeholder="MacBook Pro (SN:123X)" className="md:col-span-2" value={dynamicData.assigned_assets} onChange={e => handleChange("assigned_assets", e.target.value)} />
          <Input label="System Roles & Access" placeholder="Jira, AWS, Payroll Admin" className="md:col-span-2" value={dynamicData.system_roles} onChange={e => handleChange("system_roles", e.target.value)} />
        </div>
      </section>

      <div className="flex justify-between pt-6 border-t mt-8">
        <Button type="button" variant="outline" onClick={prevStep}>Back</Button>
        <Button type="button" onClick={handleNext}>Review Data Payload</Button>
      </div>
    </div>
  );
}