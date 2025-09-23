/**
 * Organization-related types and interfaces
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website_url?: string;

  // Plan and billing
  plan: "free" | "pro" | "scale" | "enterprise";
  plan_expires_at?: string;
  billing_email: string;

  // Limits
  limits: {
    forms: number;
    submissions_per_month: number;
    team_members: number;
    storage_mb: number;
    api_requests_per_month: number;
  };

  // Usage stats
  usage: {
    forms_count: number;
    submissions_this_month: number;
    team_members_count: number;
    storage_used_mb: number;
    api_requests_this_month: number;
  };

  // Settings
  settings: {
    allow_public_forms: boolean;
    require_2fa: boolean;
    data_retention_days: number;
    custom_domain?: string;
    remove_branding: boolean;
    sso_enabled: boolean;
  };

  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: "owner" | "admin" | "editor" | "viewer";
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;

  // Status
  status: "active" | "pending" | "suspended";
  invited_at: string;
  joined_at?: string;
  last_active: string;

  // Permissions
  permissions: string[];
}

export interface OrganizationInvite {
  id: string;
  organization_id: string;
  email: string;
  role: OrganizationMember["role"];
  invited_by: string;
  invited_at: string;
  expires_at: string;
  accepted_at?: string;
  token: string;
}

export interface BillingInfo {
  customer_id: string;
  subscription_id?: string;
  plan: Organization["plan"];
  status: "active" | "past_due" | "canceled" | "trialing";
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;

  // Payment method
  payment_method?: {
    type: "card" | "bank" | "paypal";
    last4?: string;
    brand?: string;
    expires_month?: number;
    expires_year?: number;
  };

  // Billing address
  billing_address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "draft";
  created_at: string;
  due_date: string;
  paid_at?: string;
  invoice_url: string;

  // Line items
  items: Array<{
    description: string;
    quantity: number;
    unit_amount: number;
    total_amount: number;
  }>;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  actor_id: string;
  actor_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  website_url?: string;
  billing_email?: string;
  settings?: Partial<Organization["settings"]>;
}

export interface InviteMemberRequest {
  email: string;
  role: OrganizationMember["role"];
  message?: string;
}

export interface UpdateMemberRequest {
  role: OrganizationMember["role"];
  permissions?: string[];
}

// Available permissions
export const ORGANIZATION_PERMISSIONS = [
  { id: "forms:create", name: "Create Forms", description: "Create new forms" },
  { id: "forms:edit", name: "Edit Forms", description: "Edit existing forms" },
  { id: "forms:delete", name: "Delete Forms", description: "Delete forms" },
  { id: "forms:publish", name: "Publish Forms", description: "Publish and unpublish forms" },
  { id: "submissions:view", name: "View Submissions", description: "View form submissions" },
  { id: "submissions:export", name: "Export Submissions", description: "Export submission data" },
  { id: "submissions:delete", name: "Delete Submissions", description: "Delete submissions" },
  { id: "analytics:view", name: "View Analytics", description: "Access form analytics" },
  { id: "webhooks:manage", name: "Manage Webhooks", description: "Create and configure webhooks" },
  { id: "integrations:manage", name: "Manage Integrations", description: "Configure integrations" },
  { id: "team:manage", name: "Manage Team", description: "Invite and manage team members" },
  {
    id: "billing:manage",
    name: "Manage Billing",
    description: "Access billing and subscription settings",
  },
  { id: "settings:manage", name: "Manage Settings", description: "Change organization settings" },
] as const;

// Default permissions by role
export const ROLE_PERMISSIONS = {
  owner: ORGANIZATION_PERMISSIONS.map((p) => p.id),
  admin: ORGANIZATION_PERMISSIONS.filter((p) => p.id !== "billing:manage").map((p) => p.id),
  editor: [
    "forms:create",
    "forms:edit",
    "forms:publish",
    "submissions:view",
    "submissions:export",
    "analytics:view",
    "webhooks:manage",
    "integrations:manage",
  ],
  viewer: ["submissions:view", "analytics:view"],
} as const;

// Plan features and limits
export const PLAN_FEATURES = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "3 active forms",
      "1,000 submissions/month",
      "10 MB file uploads",
      "Basic analytics",
      "Email support",
    ],
    limits: {
      forms: 3,
      submissions_per_month: 1000,
      team_members: 1,
      storage_mb: 100,
      api_requests_per_month: 1000,
    },
  },
  pro: {
    name: "Pro",
    price: 29,
    features: [
      "Unlimited forms",
      "10,000 submissions/month",
      "100 MB file uploads",
      "Advanced analytics",
      "Remove branding",
      "Custom domain",
      "Webhooks",
      "Priority support",
    ],
    limits: {
      forms: -1, // unlimited
      submissions_per_month: 10000,
      team_members: 5,
      storage_mb: 1000,
      api_requests_per_month: 10000,
    },
  },
  scale: {
    name: "Scale",
    price: 99,
    features: [
      "Everything in Pro",
      "100,000 submissions/month",
      "1 GB file uploads",
      "Advanced integrations",
      "Team collaboration",
      "SSO support",
      "Audit logs",
      "Dedicated support",
    ],
    limits: {
      forms: -1,
      submissions_per_month: 100000,
      team_members: 25,
      storage_mb: 10000,
      api_requests_per_month: 100000,
    },
  },
  enterprise: {
    name: "Enterprise",
    price: null, // Custom pricing
    features: [
      "Everything in Scale",
      "Unlimited submissions",
      "Unlimited storage",
      "White-label solution",
      "Custom integrations",
      "Dedicated infrastructure",
      "SLA guarantee",
      "24/7 phone support",
    ],
    limits: {
      forms: -1,
      submissions_per_month: -1,
      team_members: -1,
      storage_mb: -1,
      api_requests_per_month: -1,
    },
  },
} as const;
