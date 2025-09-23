/**
 * Profile and user-related types
 */

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  phone?: string;
  timezone: string;
  language: string;

  // Account settings
  email_verified: boolean;
  phone_verified: boolean;
  two_factor_enabled: boolean;
  newsletter_subscribed: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
  last_login: string;
  login_count: number;
}

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  ip_address: string;
  location: string;
  created_at: string;
  last_activity: string;
  is_current: boolean;
}

export interface ApiToken {
  id: string;
  name: string;
  token_preview: string; // e.g., "sk_test_1234...****"
  permissions: string[];
  created_at: string;
  last_used: string;
  expires_at?: string;
  is_active: boolean;
}

export interface SecuritySettings {
  password_last_changed: string;
  failed_login_attempts: number;
  account_locked_until?: string;
  backup_codes_generated: boolean;
  security_questions_set: boolean;
}

export interface NotificationPreferences {
  email_notifications: {
    form_submissions: boolean;
    form_comments: boolean;
    security_alerts: boolean;
    product_updates: boolean;
    marketing: boolean;
  };
  in_app_notifications: {
    form_activity: boolean;
    team_mentions: boolean;
    system_alerts: boolean;
  };
  push_notifications: {
    enabled: boolean;
    critical_only: boolean;
  };
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  timezone?: string;
  language?: string;
  avatar_url?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface Enable2FARequest {
  verification_code: string;
}

export interface CreateApiTokenRequest {
  name: string;
  permissions: string[];
  expires_at?: string;
}

// Available permissions for API tokens
export const API_PERMISSIONS = [
  { id: "forms:read", name: "Read Forms", description: "View form configurations and metadata" },
  { id: "forms:write", name: "Write Forms", description: "Create, update, and delete forms" },
  {
    id: "submissions:read",
    name: "Read Submissions",
    description: "View form submissions and responses",
  },
  {
    id: "submissions:write",
    name: "Write Submissions",
    description: "Create and update submissions",
  },
  { id: "webhooks:read", name: "Read Webhooks", description: "View webhook configurations" },
  { id: "webhooks:write", name: "Write Webhooks", description: "Create and manage webhooks" },
  {
    id: "analytics:read",
    name: "Read Analytics",
    description: "Access form analytics and reports",
  },
  { id: "templates:read", name: "Read Templates", description: "View and use templates" },
  { id: "templates:write", name: "Write Templates", description: "Create and manage templates" },
] as const;

// Available timezones
export const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Europe/Berlin", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
] as const;

// Available languages
export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "es", label: "Español" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Português" },
  { value: "nl", label: "Nederlands" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "zh", label: "中文" },
] as const;
