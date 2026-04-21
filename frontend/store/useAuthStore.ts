// frontend/store/useAuthStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean; // <--- This is the magic flag
  setHasHydrated: (state: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false, // Initially false

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      login: (user, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", token);
        }
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
      // On rehydration (when page reloads), set the flag to true
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);