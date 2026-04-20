// frontend/components/employee-form/Step1CoreData.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmployeeFormSchema, EmployeeFormValues } from "@/schemas/employee.schema";
import { useFormStore } from "@/store/formStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function Step1CoreData() {
  const { formData, updateFormData, nextStep } = useFormStore();

  // Connecting Zod Schema with React Hook Form
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(EmployeeFormSchema),
    defaultValues: {
      first_name: formData.first_name || "",
      last_name: formData.last_name || "",
      email: formData.email || "",
      department_id: formData.department_id || 1, // Defaulting to HR or General
      hire_date: formData.hire_date || new Date().toISOString().split('T')[0],
      is_active: formData.is_active ?? true,
      dynamic_attributes: formData.dynamic_attributes || {},
    },
  });

  const onSubmit = (data: any) => {
    // Save current step data to global Zustand store and move to next step
    updateFormData(data);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Core Relational Data</h2>
        <p className="text-sm text-gray-500 mb-6">Standard fields required for basic PostgreSQL structure.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input 
          label="First Name" 
          placeholder="e.g. John"
          {...register("first_name")} 
          error={errors.first_name?.message} 
        />
        <Input 
          label="Last Name" 
          placeholder="e.g. Doe"
          {...register("last_name")} 
          error={errors.last_name?.message} 
        />
        <Input 
          label="Email Address" 
          type="email" 
          placeholder="john.doe@enterprise.com"
          {...register("email")} 
          error={errors.email?.message} 
        />
        <Input 
          label="Date of Hire" 
          type="date" 
          {...register("hire_date")} 
          error={errors.hire_date?.message} 
        />
      </div>

      <div className="flex justify-end pt-8 border-t border-gray-50 mt-8">
        <Button type="submit">Continue to Legacy Fields</Button>
      </div>
    </form>
  );
}