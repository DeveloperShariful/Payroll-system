// src/store/useAuthStore.ts
import { create } from "zustand";
import { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

// Safely get data from localStorage during initialization
const getInitialState = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user_data");
    if (token && userStr) {
      return { token, user: JSON.parse(userStr), isAuthenticated: true };
    }
  }
  return { token: null, user: null, isAuthenticated: false };
};

const initialState = getInitialState();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialState.user,
  token: initialState.token,
  isAuthenticated: initialState.isAuthenticated,
  
  login: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
      localStorage.setItem("user_data", JSON.stringify(user)); // Save user data persistently
    }
    set({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_data"); // Clear user data on logout
    }
    set({ user: null, token: null, isAuthenticated: false });
  },
}));