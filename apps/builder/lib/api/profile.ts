/**
 * Profile API client
 */

import { apiClient } from "./axios-client";
import type {
  UserProfile,
  UserSession,
  ApiToken,
  SecuritySettings,
  NotificationPreferences,
  UpdateProfileRequest,
  ChangePasswordRequest,
  Enable2FARequest,
  CreateApiTokenRequest,
} from "../types/profile";

export const profileApi = {
  /**
   * Get current user profile
   */
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get("/v1/profile/");
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await apiClient.patch("/v1/profile/", data);
    return response.data;
  },

  /**
   * Upload avatar
   */
  uploadAvatar: async (file: File): Promise<{ avatar_url: string }> => {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await apiClient.post("/v1/profile/avatar/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<{ success: boolean }> => {
    const response = await apiClient.post("/v1/profile/change-password/", data);
    return response.data;
  },

  /**
   * Get 2FA setup info
   */
  get2FASetup: async (): Promise<{ qr_code: string; secret: string; backup_codes: string[] }> => {
    const response = await apiClient.get("/v1/profile/2fa/setup/");
    return response.data;
  },

  /**
   * Enable 2FA
   */
  enable2FA: async (data: Enable2FARequest): Promise<{ backup_codes: string[] }> => {
    const response = await apiClient.post("/v1/profile/2fa/enable/", data);
    return response.data;
  },

  /**
   * Disable 2FA
   */
  disable2FA: async (password: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post("/v1/profile/2fa/disable/", { password });
    return response.data;
  },

  /**
   * Get user sessions
   */
  getSessions: async (): Promise<UserSession[]> => {
    const response = await apiClient.get("/v1/profile/sessions/");
    return response.data;
  },

  /**
   * Revoke session
   */
  revokeSession: async (sessionId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/v1/profile/sessions/${sessionId}/`);
    return response.data;
  },

  /**
   * Revoke all sessions except current
   */
  revokeAllSessions: async (): Promise<{ revoked_count: number }> => {
    const response = await apiClient.post("/v1/profile/sessions/revoke-all/");
    return response.data;
  },

  /**
   * Get API tokens
   */
  getApiTokens: async (): Promise<ApiToken[]> => {
    const response = await apiClient.get("/v1/profile/api-tokens/");
    return response.data;
  },

  /**
   * Create API token
   */
  createApiToken: async (
    data: CreateApiTokenRequest
  ): Promise<{ token: string; token_data: ApiToken }> => {
    const response = await apiClient.post("/v1/profile/api-tokens/", data);
    return response.data;
  },

  /**
   * Revoke API token
   */
  revokeApiToken: async (tokenId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/v1/profile/api-tokens/${tokenId}/`);
    return response.data;
  },

  /**
   * Get security settings
   */
  getSecuritySettings: async (): Promise<SecuritySettings> => {
    const response = await apiClient.get("/v1/profile/security/");
    return response.data;
  },

  /**
   * Get notification preferences
   */
  getNotificationPreferences: async (): Promise<NotificationPreferences> => {
    const response = await apiClient.get("/v1/profile/notifications/");
    return response.data;
  },

  /**
   * Update notification preferences
   */
  updateNotificationPreferences: async (
    data: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> => {
    const response = await apiClient.patch("/v1/profile/notifications/", data);
    return response.data;
  },

  /**
   * Request account deletion
   */
  requestAccountDeletion: async (
    password: string,
    reason?: string
  ): Promise<{ deletion_scheduled: string }> => {
    const response = await apiClient.post("/v1/profile/delete-account/", { password, reason });
    return response.data;
  },

  /**
   * Cancel account deletion
   */
  cancelAccountDeletion: async (): Promise<{ success: boolean }> => {
    const response = await apiClient.post("/v1/profile/cancel-deletion/");
    return response.data;
  },

  /**
   * Export user data (GDPR)
   */
  exportData: async (): Promise<{ download_url: string; expires_at: string }> => {
    const response = await apiClient.post("/v1/profile/export-data/");
    return response.data;
  },

  /**
   * Verify email
   */
  verifyEmail: async (token: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post("/v1/profile/verify-email/", { token });
    return response.data;
  },

  /**
   * Resend email verification
   */
  resendEmailVerification: async (): Promise<{ success: boolean }> => {
    const response = await apiClient.post("/v1/profile/resend-verification/");
    return response.data;
  },
};

// Mock data for development
export const MOCK_PROFILE: UserProfile = {
  id: "1",
  email: "user@example.com",
  first_name: "John",
  last_name: "Doe",
  avatar_url:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  phone: "+1 (555) 123-4567",
  timezone: "America/New_York",
  language: "en",
  email_verified: true,
  phone_verified: false,
  two_factor_enabled: false,
  newsletter_subscribed: true,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-20T15:30:00Z",
  last_login: "2024-01-25T09:15:00Z",
  login_count: 127,
};

export const MOCK_SESSIONS: UserSession[] = [
  {
    id: "1",
    device: "MacBook Pro",
    browser: "Chrome 120.0",
    ip_address: "192.168.1.100",
    location: "New York, US",
    created_at: "2024-01-25T09:15:00Z",
    last_activity: "2024-01-25T14:30:00Z",
    is_current: true,
  },
  {
    id: "2",
    device: "iPhone 15",
    browser: "Safari Mobile",
    ip_address: "192.168.1.101",
    location: "New York, US",
    created_at: "2024-01-24T18:22:00Z",
    last_activity: "2024-01-24T22:15:00Z",
    is_current: false,
  },
];

export const MOCK_API_TOKENS: ApiToken[] = [
  {
    id: "1",
    name: "Production API",
    token_preview: "sk_live_1234...****",
    permissions: ["forms:read", "forms:write", "submissions:read"],
    created_at: "2024-01-15T10:00:00Z",
    last_used: "2024-01-25T09:15:00Z",
    is_active: true,
  },
  {
    id: "2",
    name: "Development Testing",
    token_preview: "sk_test_5678...****",
    permissions: ["forms:read", "submissions:read"],
    created_at: "2024-01-20T14:30:00Z",
    last_used: "2024-01-23T11:45:00Z",
    expires_at: "2024-07-20T14:30:00Z",
    is_active: true,
  },
];
