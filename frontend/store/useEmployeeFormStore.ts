// frontend/store/useEmployeeFormStore.ts
import { create } from "zustand";
import { EmployeeDynamicAttributes } from "../types";

interface EmployeeFormData {
  first_name: string;
  last_name: string;
  email: string;
  department_id: number | null;
  customer_id: number | null;
  hire_date: string;
  ssn_last_four: string;
  is_active: boolean;
  compliance_tracking: Record<string, string>; // NEW FIELD ADDED
  dynamic_attributes: EmployeeDynamicAttributes;
}

const initialFormData: EmployeeFormData = {
  first_name: "",
  last_name: "",
  email: "",
  department_id: null,
  customer_id: null,
  hire_date: "",
  ssn_last_four: "",
  is_active: true,
  compliance_tracking: {}, // Initialize empty object
  dynamic_attributes: {
    bank_details: { bank_name: "", account_number: "", routing_number: "", account_type: "Checking" },
    emergency_contact: { name: "", relationship: "", phone_number: "" },
    union_info: { is_union_member: false, union_local_number: "" },
    legacy_custom_fields: {},
  },
};

interface EmployeeFormState {
  formData: EmployeeFormData;
  currentStep: number;
  setStep: (step: number) => void;
  updateCoreInfo: (data: Partial<Omit<EmployeeFormData, "dynamic_attributes" | "compliance_tracking">>) => void;
  updateCompliance: (licenseName: string, expireDate: string) => void; // NEW FUNCTION
  updateDynamicAttributes: (key: keyof EmployeeDynamicAttributes, data: any) => void;
  updateLegacyField: (key: string, value: any) => void;
  resetForm: () => void;
}

export const useEmployeeFormStore = create<EmployeeFormState>((set) => ({
  formData: initialFormData,
  currentStep: 1,

  setStep: (step) => set({ currentStep: step }),

  updateCoreInfo: (data) =>
    set((state) => ({ formData: { ...state.formData, ...data } })),

  // NEW FUNCTION TO HANDLE LICENSE RENEWALS
  updateCompliance: (licenseName, expireDate) =>
    set((state) => ({
      formData: {
        ...state.formData,
        compliance_tracking: {
          ...state.formData.compliance_tracking,
          [licenseName]: expireDate,
        },
      },
    })),

  updateDynamicAttributes: (key, data) =>
    set((state) => ({
      formData: {
        ...state.formData,
        dynamic_attributes: {
          ...state.formData.dynamic_attributes,
          [key]: { ...state.formData.dynamic_attributes[key], ...data },
        },
      },
    })),

  updateLegacyField: (key, value) =>
    set((state) => ({
      formData: {
        ...state.formData,
        dynamic_attributes: {
          ...state.formData.dynamic_attributes,
          legacy_custom_fields: {
            ...(state.formData.dynamic_attributes.legacy_custom_fields || {}),
            [key]: value,
          },
        },
      },
    })),

  resetForm: () => set({ formData: initialFormData, currentStep: 1 }),
}));