// store/useEmployeeFormStore.ts
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
  updateCoreInfo: (data: Partial<Omit<EmployeeFormData, "dynamic_attributes">>) => void;
  updateDynamicAttributes: (key: keyof EmployeeDynamicAttributes, data: any) => void;
  updateLegacyField: (key: string, value: any) => void;
  resetForm: () => void;
}

export const useEmployeeFormStore = create<EmployeeFormState>((set) => ({
  formData: initialFormData,
  currentStep: 1,

  setStep: (step) => set({ currentStep: step }),

  updateCoreInfo: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
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