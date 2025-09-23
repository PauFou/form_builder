/**
 * Organization API client
 */

import { apiClient } from "./axios-client";
import type {
  Organization,
  OrganizationMember,
  OrganizationInvite,
  BillingInfo,
  Invoice,
  AuditLog,
  UpdateOrganizationRequest,
  InviteMemberRequest,
  UpdateMemberRequest,
} from "../types/organization";

export const organizationApi = {
  /**
   * Get current organization
   */
  getCurrent: async (): Promise<Organization> => {
    const response = await apiClient.get("/v1/organization/");
    return response.data;
  },

  /**
   * Update organization
   */
  update: async (data: UpdateOrganizationRequest): Promise<Organization> => {
    const response = await apiClient.patch("/v1/organization/", data);
    return response.data;
  },

  /**
   * Upload organization logo
   */
  uploadLogo: async (file: File): Promise<{ logo_url: string }> => {
    const formData = new FormData();
    formData.append("logo", file);

    const response = await apiClient.post("/v1/organization/logo/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Get organization members
   */
  getMembers: async (): Promise<OrganizationMember[]> => {
    const response = await apiClient.get("/v1/organization/members/");
    return response.data;
  },

  /**
   * Invite member
   */
  inviteMember: async (data: InviteMemberRequest): Promise<OrganizationInvite> => {
    const response = await apiClient.post("/v1/organization/members/invite/", data);
    return response.data;
  },

  /**
   * Update member
   */
  updateMember: async (
    memberId: string,
    data: UpdateMemberRequest
  ): Promise<OrganizationMember> => {
    const response = await apiClient.patch(`/v1/organization/members/${memberId}/`, data);
    return response.data;
  },

  /**
   * Remove member
   */
  removeMember: async (memberId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/v1/organization/members/${memberId}/`);
    return response.data;
  },

  /**
   * Get pending invites
   */
  getInvites: async (): Promise<OrganizationInvite[]> => {
    const response = await apiClient.get("/v1/organization/invites/");
    return response.data;
  },

  /**
   * Cancel invite
   */
  cancelInvite: async (inviteId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/v1/organization/invites/${inviteId}/`);
    return response.data;
  },

  /**
   * Resend invite
   */
  resendInvite: async (inviteId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/v1/organization/invites/${inviteId}/resend/`);
    return response.data;
  },

  /**
   * Get billing info
   */
  getBilling: async (): Promise<BillingInfo> => {
    const response = await apiClient.get("/v1/organization/billing/");
    return response.data;
  },

  /**
   * Update billing info
   */
  updateBilling: async (data: Partial<BillingInfo>): Promise<BillingInfo> => {
    const response = await apiClient.patch("/v1/organization/billing/", data);
    return response.data;
  },

  /**
   * Get invoices
   */
  getInvoices: async (): Promise<Invoice[]> => {
    const response = await apiClient.get("/v1/organization/billing/invoices/");
    return response.data;
  },

  /**
   * Change plan
   */
  changePlan: async (
    plan: Organization["plan"]
  ): Promise<{ success: boolean; checkout_url?: string }> => {
    const response = await apiClient.post("/v1/organization/billing/change-plan/", { plan });
    return response.data;
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (): Promise<{ success: boolean }> => {
    const response = await apiClient.post("/v1/organization/billing/cancel/");
    return response.data;
  },

  /**
   * Get audit logs
   */
  getAuditLogs: async (params?: {
    limit?: number;
    offset?: number;
    action?: string;
    actor_id?: string;
    resource_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{ results: AuditLog[]; count: number }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get(`/v1/organization/audit-logs/?${searchParams.toString()}`);
    return response.data;
  },

  /**
   * Get usage stats
   */
  getUsage: async (): Promise<Organization["usage"]> => {
    const response = await apiClient.get("/v1/organization/usage/");
    return response.data;
  },

  /**
   * Transfer ownership
   */
  transferOwnership: async (newOwnerId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post("/v1/organization/transfer-ownership/", {
      new_owner_id: newOwnerId,
    });
    return response.data;
  },

  /**
   * Delete organization
   */
  delete: async (confirmationText: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete("/v1/organization/", {
      data: { confirmation: confirmationText },
    });
    return response.data;
  },
};

// Mock data for development
export const MOCK_ORGANIZATION: Organization = {
  id: "1",
  name: "Acme Corporation",
  slug: "acme-corp",
  description: "Building the future of form technology",
  logo_url: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&h=150&fit=crop",
  website_url: "https://acme.com",
  plan: "pro",
  billing_email: "billing@acme.com",
  limits: {
    forms: -1,
    submissions_per_month: 10000,
    team_members: 5,
    storage_mb: 1000,
    api_requests_per_month: 10000,
  },
  usage: {
    forms_count: 12,
    submissions_this_month: 2847,
    team_members_count: 3,
    storage_used_mb: 234,
    api_requests_this_month: 1254,
  },
  settings: {
    allow_public_forms: true,
    require_2fa: false,
    data_retention_days: 365,
    custom_domain: "forms.acme.com",
    remove_branding: true,
    sso_enabled: false,
  },
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-20T15:30:00Z",
  created_by: "1",
};

export const MOCK_MEMBERS: OrganizationMember[] = [
  {
    id: "1",
    user_id: "1",
    organization_id: "1",
    role: "owner",
    email: "john.doe@acme.com",
    first_name: "John",
    last_name: "Doe",
    avatar_url:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    status: "active",
    invited_at: "2024-01-15T10:00:00Z",
    joined_at: "2024-01-15T10:05:00Z",
    last_active: "2024-01-25T14:30:00Z",
    permissions: [],
  },
  {
    id: "2",
    user_id: "2",
    organization_id: "1",
    role: "admin",
    email: "jane.smith@acme.com",
    first_name: "Jane",
    last_name: "Smith",
    avatar_url:
      "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
    status: "active",
    invited_at: "2024-01-16T09:00:00Z",
    joined_at: "2024-01-16T09:15:00Z",
    last_active: "2024-01-24T18:45:00Z",
    permissions: [],
  },
  {
    id: "3",
    user_id: "3",
    organization_id: "1",
    role: "editor",
    email: "mike.wilson@acme.com",
    first_name: "Mike",
    last_name: "Wilson",
    status: "pending",
    invited_at: "2024-01-20T14:00:00Z",
    last_active: "2024-01-20T14:00:00Z",
    permissions: [],
  },
];

export const MOCK_INVOICES: Invoice[] = [
  {
    id: "1",
    number: "INV-2024-001",
    amount: 29.0,
    currency: "USD",
    status: "paid",
    created_at: "2024-01-01T00:00:00Z",
    due_date: "2024-01-01T00:00:00Z",
    paid_at: "2024-01-01T00:15:00Z",
    invoice_url: "https://billing.skemya.com/invoices/inv_1234",
    items: [
      {
        description: "Pro Plan - January 2024",
        quantity: 1,
        unit_amount: 29.0,
        total_amount: 29.0,
      },
    ],
  },
  {
    id: "2",
    number: "INV-2024-002",
    amount: 29.0,
    currency: "USD",
    status: "paid",
    created_at: "2024-02-01T00:00:00Z",
    due_date: "2024-02-01T00:00:00Z",
    paid_at: "2024-02-01T00:08:00Z",
    invoice_url: "https://billing.skemya.com/invoices/inv_5678",
    items: [
      {
        description: "Pro Plan - February 2024",
        quantity: 1,
        unit_amount: 29.0,
        total_amount: 29.0,
      },
    ],
  },
];
