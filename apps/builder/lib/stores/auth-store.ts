import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { authApi } from "../api/auth";

import type { User, Organization } from "@skemya/contracts";

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string,
    organizationName: string
  ) => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      organization: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        try {
          set({ isLoading: true });
          const response = await authApi.login({ email, password });

          localStorage.setItem("access_token", response.access);
          localStorage.setItem("refresh_token", response.refresh);

          // Set cookie for middleware
          document.cookie = `auth-token=${response.access}; path=/; max-age=3600; SameSite=Strict`;

          set({
            user: response.user,
            organization: response.organization,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          // Clear tokens
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");

          // Clear cookie
          document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

          set({
            user: null,
            organization: null,
            isAuthenticated: false,
          });
        }
      },

      signup: async (email, password, name, organizationName) => {
        try {
          set({ isLoading: true });
          const response = await authApi.signup({
            name,
            email,
            password,
            organization_name: organizationName,
          });

          localStorage.setItem("access_token", response.access);
          localStorage.setItem("refresh_token", response.refresh);

          // Set cookie for middleware
          document.cookie = `auth-token=${response.access}; path=/; max-age=3600; SameSite=Strict`;

          set({
            user: response.user,
            organization: response.organization,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true });
          const token = localStorage.getItem("access_token");
          if (!token) {
            set({ isAuthenticated: false, isLoading: false });
            return;
          }

          const response = await authApi.getMe();
          set({
            user: response.user,
            organization: response.organization,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            user: null,
            organization: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Failed to rehydrate auth store:", error);
          // Clear corrupted storage
          localStorage.removeItem("auth-storage");
        }
      },
    }
  )
);
