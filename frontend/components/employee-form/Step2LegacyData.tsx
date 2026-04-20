// frontend/components/employee-form/Step2LegacyData.tsx
"use client";

import { useState } from "react";
import { useFormStore } from "@/store/formStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function Step2LegacyData() {
  const { formData, updateFormData, nextStep, prevStep } = useFormStore();

  // Local state to hold the dynamic MS Access bloat columns
  const [dynamicData, setDynamicData] = useState<Record<string, string>>({
    blood_group: formData.dynamic_attributes?.blood_group || "",
    emergency_contact: formData.dynamic_attributes?.emergency_contact || "",
    previous_employer: formData.dynamic_attributes?.previous_employer || "",
  });

  const handleInputChange = (key: string, value: string) => {
    setDynamicData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    // ⚠️ THE MAGIC: We wrap these random fields into the JSONB 'dynamic_attributes' object
    updateFormData({ dynamic_attributes: dynamicData });
    nextStep();
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Legacy MS Access Fields</h2>
        <p className="text-sm text-gray-500 mb-6">
          These fields represent the 200+ columns from the old system. They will be stored dynamically in PostgreSQL JSONB.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Blood Group Code"
          placeholder="e.g. O+"
          value={dynamicData.blood_group}
          onChange={(e) => handleInputChange("blood_group", e.target.value)}
        />
        <Input
          label="Emergency Contact Number"
          placeholder="e.g. +1 234 567 8900"
          value={dynamicData.emergency_contact}
          onChange={(e) => handleInputChange("emergency_contact", e.target.value)}
        />
        <Input
          label="Previous Employer Name"
          placeholder="e.g. ACME Corp"
          className="md:col-span-2"
          value={dynamicData.previous_employer}
          onChange={(e) => handleInputChange("previous_employer", e.target.value)}
        />
      </div>

      <div className="flex justify-between pt-8 border-t border-gray-50 mt-8">
        <Button type="button" variant="outline" onClick={prevStep}>Back</Button>
        <Button type="button" onClick={handleNext}>Continue to Review</Button>
      </div>
    </div>
  );
}