import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Organization } from '@forms/contracts';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, organizationName: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      organization: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email, password) => {
        try {
          set({ isLoading: true });
          const response = await authApi.login({ email, password });
          
          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);
          
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
          set({
            user: null,
            organization: null,
            isAuthenticated: false,
          });
        }
      },

      signup: async (email, password, organizationName) => {
        try {
          set({ isLoading: true });
          const response = await authApi.signup({
            email,
            password,
            organization_name: organizationName,
          });
          
          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);
          
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
          const token = localStorage.getItem('access_token');
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
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);