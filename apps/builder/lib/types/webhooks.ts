/**
 * Webhook-related types and interfaces
 */

export interface Webhook {
  id: string;
  organization_id: string;
  name: string;
  url: string;
  secret: string;
  active: boolean;

  // Event configuration
  events: WebhookEvent[];
  headers: Record<string, string>;

  // Settings
  timeout_seconds: number;
  max_retries: number;
  retry_strategy: "exponential" | "linear" | "fixed";

  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;

  // Stats
  stats: {
    total_deliveries: number;
    successful_deliveries: number;
    failed_deliveries: number;
    avg_response_time: number;
    last_delivery_at?: string;
    success_rate: number;
  };
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  webhook_name: string;
  webhook_url: string;

  // Trigger information
  event_type: WebhookEvent;
  resource_type: string;
  resource_id: string;

  // Delivery details
  status: "pending" | "success" | "failed" | "retrying";
  attempt_number: number;
  max_attempts: number;

  // Request/Response
  request_payload: any;
  request_headers: Record<string, string>;
  response_status?: number;
  response_headers?: Record<string, string>;
  response_body?: string;
  error_message?: string;

  // Timing
  created_at: string;
  sent_at?: string;
  completed_at?: string;
  next_retry_at?: string;
  response_time_ms?: number;

  // Metadata
  idempotency_key: string;
  user_agent: string;
}

export interface WebhookDeliveryAttempt {
  id: string;
  delivery_id: string;
  attempt_number: number;

  // Request details
  sent_at: string;
  request_headers: Record<string, string>;
  request_payload: any;

  // Response details
  status: "success" | "failed" | "timeout";
  response_status?: number;
  response_headers?: Record<string, string>;
  response_body?: string;
  response_time_ms?: number;
  error_message?: string;

  // Retry information
  completed_at: string;
  next_retry_at?: string;
}

export type WebhookEvent =
  | "form.created"
  | "form.updated"
  | "form.published"
  | "form.unpublished"
  | "form.deleted"
  | "submission.created"
  | "submission.updated"
  | "submission.partial"
  | "submission.completed"
  | "submission.deleted"
  | "user.invited"
  | "user.joined"
  | "user.removed";

export interface WebhookFilters {
  webhook_id?: string;
  status?: WebhookDelivery["status"];
  event_type?: WebhookEvent;
  date_range?: {
    start: string;
    end: string;
  };
  response_status?: number;
  search?: string;
}

export interface WebhookStats {
  total_webhooks: number;
  active_webhooks: number;
  total_deliveries_today: number;
  successful_deliveries_today: number;
  failed_deliveries_today: number;
  avg_response_time_today: number;

  // Time series data for charts
  delivery_timeline: Array<{
    timestamp: string;
    total: number;
    successful: number;
    failed: number;
  }>;

  // Response time distribution
  response_time_distribution: Array<{
    range: string;
    count: number;
  }>;

  // Status breakdown
  status_breakdown: Record<WebhookDelivery["status"], number>;

  // Event type breakdown
  event_breakdown: Record<WebhookEvent, number>;
}

export interface RedriveRequest {
  delivery_ids: string[];
  reason?: string;
}

export interface RedriveResponse {
  total_requested: number;
  successful_redrive: number;
  failed_redrive: number;
  job_id: string;
  estimated_completion: string;
}

export interface RedriveJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  total_deliveries: number;
  processed_deliveries: number;
  successful_redrives: number;
  failed_redrives: number;

  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;

  // Progress tracking
  progress_percentage: number;
  current_delivery?: string;
  estimated_completion?: string;
}

export interface CreateWebhookRequest {
  name: string;
  url: string;
  events: WebhookEvent[];
  headers?: Record<string, string>;
  timeout_seconds?: number;
  max_retries?: number;
  retry_strategy?: Webhook["retry_strategy"];
}

export interface UpdateWebhookRequest {
  name?: string;
  url?: string;
  events?: WebhookEvent[];
  headers?: Record<string, string>;
  timeout_seconds?: number;
  max_retries?: number;
  retry_strategy?: Webhook["retry_strategy"];
  active?: boolean;
}

export interface WebhookTestRequest {
  event_type: WebhookEvent;
  test_payload?: any;
}

export interface WebhookTestResponse {
  success: boolean;
  response_status?: number;
  response_body?: string;
  response_time_ms?: number;
  error_message?: string;
}

// Available webhook events with descriptions
export const WEBHOOK_EVENTS: Array<{
  value: WebhookEvent;
  label: string;
  description: string;
  category: "forms" | "submissions" | "users";
}> = [
  // Form events
  {
    value: "form.created",
    label: "Form Created",
    description: "Triggered when a new form is created",
    category: "forms",
  },
  {
    value: "form.updated",
    label: "Form Updated",
    description: "Triggered when a form is modified",
    category: "forms",
  },
  {
    value: "form.published",
    label: "Form Published",
    description: "Triggered when a form is published",
    category: "forms",
  },
  {
    value: "form.unpublished",
    label: "Form Unpublished",
    description: "Triggered when a form is unpublished",
    category: "forms",
  },
  {
    value: "form.deleted",
    label: "Form Deleted",
    description: "Triggered when a form is deleted",
    category: "forms",
  },

  // Submission events
  {
    value: "submission.created",
    label: "Submission Created",
    description: "Triggered when a new submission is created",
    category: "submissions",
  },
  {
    value: "submission.updated",
    label: "Submission Updated",
    description: "Triggered when a submission is modified",
    category: "submissions",
  },
  {
    value: "submission.partial",
    label: "Partial Submission",
    description: "Triggered when a partial submission is saved",
    category: "submissions",
  },
  {
    value: "submission.completed",
    label: "Submission Completed",
    description: "Triggered when a submission is completed",
    category: "submissions",
  },
  {
    value: "submission.deleted",
    label: "Submission Deleted",
    description: "Triggered when a submission is deleted",
    category: "submissions",
  },

  // User events
  {
    value: "user.invited",
    label: "User Invited",
    description: "Triggered when a user is invited to the organization",
    category: "users",
  },
  {
    value: "user.joined",
    label: "User Joined",
    description: "Triggered when a user joins the organization",
    category: "users",
  },
  {
    value: "user.removed",
    label: "User Removed",
    description: "Triggered when a user is removed from the organization",
    category: "users",
  },
];

// Retry strategies with descriptions
export const RETRY_STRATEGIES = [
  {
    value: "exponential" as const,
    label: "Exponential Backoff",
    description: "Delay increases exponentially with each retry (1s, 2s, 4s, 8s, ...)",
  },
  {
    value: "linear" as const,
    label: "Linear Backoff",
    description: "Fixed increment between retries (1s, 2s, 3s, 4s, ...)",
  },
  {
    value: "fixed" as const,
    label: "Fixed Delay",
    description: "Same delay between all retries (1s, 1s, 1s, 1s, ...)",
  },
] as const;

// Common HTTP status codes for filtering
export const HTTP_STATUS_CODES = [
  { value: 200, label: "200 - Success", category: "success" },
  { value: 201, label: "201 - Created", category: "success" },
  { value: 204, label: "204 - No Content", category: "success" },
  { value: 400, label: "400 - Bad Request", category: "client_error" },
  { value: 401, label: "401 - Unauthorized", category: "client_error" },
  { value: 403, label: "403 - Forbidden", category: "client_error" },
  { value: 404, label: "404 - Not Found", category: "client_error" },
  { value: 422, label: "422 - Unprocessable Entity", category: "client_error" },
  { value: 429, label: "429 - Rate Limited", category: "client_error" },
  { value: 500, label: "500 - Internal Server Error", category: "server_error" },
  { value: 502, label: "502 - Bad Gateway", category: "server_error" },
  { value: 503, label: "503 - Service Unavailable", category: "server_error" },
  { value: 504, label: "504 - Gateway Timeout", category: "server_error" },
] as const;
