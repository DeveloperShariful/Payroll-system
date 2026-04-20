// frontend/components/employee-form/Step3ReviewSubmit.tsx
"use client";

import { useState } from "react";
import { useFormStore } from "@/store/formStore";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";

export default function Step3ReviewSubmit() {
  const { formData, prevStep, resetForm } = useFormStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmitToAPI = async () => {
    setIsSubmitting(true);
    setErrorMsg("");
    
    try {
      // Send the complete payload to our Enterprise FastAPI backend
      const response = await apiClient.post("/employees/", formData);
      setSuccessMsg(`Success! Employee ${response.data.first_name} created with ID: ${response.data.id}`);
      
      // Auto-reset form after 3 seconds
      setTimeout(() => resetForm(), 3000);
    } catch (error: any) {
      // Handles 401 Unauthorized or 400 Validation errors from FastAPI
      setErrorMsg(error.response?.data?.detail || "Failed to create employee. Make sure you are logged in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Review & Submit</h2>
        <p className="text-sm text-gray-500 mb-6">Verify the data payload before saving it to the Enterprise Database.</p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-900 border-b pb-2 mb-4">Core Relational Data (PostgreSQL Columns)</h3>
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div><span className="text-gray-500">Name:</span> {formData.first_name} {formData.last_name}</div>
          <div><span className="text-gray-500">Email:</span> {formData.email}</div>
          <div><span className="text-gray-500">Hire Date:</span> {formData.hire_date}</div>
          <div><span className="text-gray-500">Dept ID:</span> {formData.department_id}</div>
        </div>

        <h3 className="font-medium text-gray-900 border-b pb-2 mb-4">Legacy JSONB Payload</h3>
        <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-auto">
          {JSON.stringify(formData.dynamic_attributes, null, 2)}
        </pre>
      </div>

      {errorMsg && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm border border-red-200">{errorMsg}</div>}
      {successMsg && <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm border border-green-200">{successMsg}</div>}

      <div className="flex justify-between pt-8 border-t border-gray-50 mt-8">
        <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting || !!successMsg}>Back</Button>
        <Button type="button" onClick={handleSubmitToAPI} disabled={isSubmitting || !!successMsg}>
          {isSubmitting ? "Processing..." : "Submit to Database"}
        </Button>
      </div>
    </div>
  );
}