import { apiClient } from "./client";

import type { User, Organization } from "@forms/contracts";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  organization_name: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  organization: Organization;
}

export const authApi = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  },

  // Signup
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/signup", data);
    return response.data;
  },

  // Logout
  logout: async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      await apiClient.post("/auth/logout", { refresh: refreshToken });
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },

  // Get current user
  getMe: async (): Promise<{ user: User; organization: Organization }> => {
    const response = (await apiClient.get("/auth/me")) as any;
    if (!response.data || !response.data.user) {
      return {
        user: { id: "", email: "" } as User,
        organization: { id: "", name: "" } as Organization,
      };
    }
    return response.data;
  },

  // Refresh token
  refresh: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await apiClient.post("/auth/refresh", { refresh: refreshToken });
    return response.data;
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post("/auth/password-reset/request", { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (
    token: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post("/auth/password-reset/confirm", { token, password });
    return response.data;
  },
};
