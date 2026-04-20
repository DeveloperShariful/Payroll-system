// app/(dashboard)/employees/create-new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEmployeeFormStore } from "../../../../store/useEmployeeFormStore";
import { createEmployee } from "../../../../lib/api/api_employees";
import Step1_CoreInfo from "./_components/Step1_CoreInfo";
import Step2_BankAndUnion from "./_components/Step2_BankAndUnion";

export default function CreateEmployeePage() {
  const router = useRouter();
  const { currentStep, setStep, formData, resetForm } = useEmployeeFormStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const steps = [
    { id: 1, name: "Core Information" },
    { id: 2, name: "Financial & Union (JSONB)" },
    { id: 3, name: "Review & Submit" }
  ];

  const handleNext = () => setStep(currentStep + 1);
  const handlePrev = () => setStep(currentStep - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const payload = {
        ...formData,
        department_id: formData.department_id || 1, 
      };
      
      const newEmployee = await createEmployee(payload);
      resetForm();
      router.push(`/employees/${newEmployee.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create employee.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Add New Employee</h1>
        <button onClick={() => { resetForm(); router.push("/employees"); }} className="text-sm font-medium text-gray-500 hover:text-gray-700">
          Cancel
        </button>
      </div>

      <nav aria-label="Progress">
        <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
          {steps.map((step) => (
            <li key={step.name} className="md:flex-1">
              <div className={`group flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 ${
                currentStep > step.id ? "border-indigo-600" : currentStep === step.id ? "border-indigo-600" : "border-gray-200"
              }`}>
                <span className={`text-sm font-medium ${currentStep >= step.id ? "text-indigo-600" : "text-gray-500"}`}>
                  Step {step.id}
                </span>
                <span className="text-sm font-medium text-gray-900">{step.name}</span>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="rounded-lg bg-white p-6 shadow sm:p-8">
        {currentStep === 1 && <Step1_CoreInfo />}
        {currentStep === 2 && <Step2_BankAndUnion />}
        
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Review Data Before Submission</h3>
            <pre className="max-h-96 overflow-auto rounded-md bg-gray-50 p-4 text-sm text-gray-700">
              {JSON.stringify(formData, null, 2)}
            </pre>
            <p className="text-sm text-gray-500">Notice how the nested MS Access fields are perfectly mapped to JSONB.</p>
          </div>
        )}

        <div className="mt-8 flex justify-between border-t border-gray-200 pt-5">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={handlePrev}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          
          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Next Step
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Confirm & Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}