/**
 * Webhooks API client
 */

import { apiClient } from "./axios-client";
import type {
  Webhook,
  WebhookDelivery,
  WebhookDeliveryAttempt,
  WebhookStats,
  WebhookFilters,
  RedriveRequest,
  RedriveResponse,
  RedriveJob,
  CreateWebhookRequest,
  UpdateWebhookRequest,
  WebhookTestRequest,
  WebhookTestResponse,
} from "../types/webhooks";

export const webhooksApi = {
  /**
   * List webhooks
   */
  list: async (): Promise<Webhook[]> => {
    const response = await apiClient.get("/v1/webhooks/");
    return response.data;
  },

  /**
   * Get webhook by ID
   */
  get: async (id: string): Promise<Webhook> => {
    const response = await apiClient.get(`/v1/webhooks/${id}/`);
    return response.data;
  },

  /**
   * Create webhook
   */
  create: async (data: CreateWebhookRequest): Promise<Webhook> => {
    const response = await apiClient.post("/v1/webhooks/", data);
    return response.data;
  },

  /**
   * Update webhook
   */
  update: async (id: string, data: UpdateWebhookRequest): Promise<Webhook> => {
    const response = await apiClient.patch(`/v1/webhooks/${id}/`, data);
    return response.data;
  },

  /**
   * Delete webhook
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/webhooks/${id}/`);
  },

  /**
   * Test webhook
   */
  test: async (id: string, data: WebhookTestRequest): Promise<WebhookTestResponse> => {
    const response = await apiClient.post(`/v1/webhooks/${id}/test/`, data);
    return response.data;
  },

  /**
   * Get webhook deliveries
   */
  getDeliveries: async (
    filters: WebhookFilters = {}
  ): Promise<{
    results: WebhookDelivery[];
    count: number;
    next?: string;
    previous?: string;
  }> => {
    const params = new URLSearchParams();

    if (filters.webhook_id) params.append("webhook_id", filters.webhook_id);
    if (filters.status) params.append("status", filters.status);
    if (filters.event_type) params.append("event_type", filters.event_type);
    if (filters.response_status) params.append("response_status", String(filters.response_status));
    if (filters.search) params.append("search", filters.search);
    if (filters.date_range) {
      params.append("created_after", filters.date_range.start);
      params.append("created_before", filters.date_range.end);
    }

    const response = await apiClient.get(`/v1/webhook-deliveries/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get delivery by ID
   */
  getDelivery: async (id: string): Promise<WebhookDelivery> => {
    const response = await apiClient.get(`/v1/webhook-deliveries/${id}/`);
    return response.data;
  },

  /**
   * Get delivery attempts
   */
  getDeliveryAttempts: async (deliveryId: string): Promise<WebhookDeliveryAttempt[]> => {
    const response = await apiClient.get(`/v1/webhook-deliveries/${deliveryId}/attempts/`);
    return response.data;
  },

  /**
   * Retry single delivery
   */
  retryDelivery: async (id: string): Promise<{ success: boolean; delivery_id: string }> => {
    const response = await apiClient.post(`/v1/webhook-deliveries/${id}/retry/`);
    return response.data;
  },

  /**
   * Bulk redrive deliveries
   */
  redriveDeliveries: async (data: RedriveRequest): Promise<RedriveResponse> => {
    const response = await apiClient.post("/v1/webhook-deliveries/redrive/", data);
    return response.data;
  },

  /**
   * Get redrive job status
   */
  getRedriveJob: async (jobId: string): Promise<RedriveJob> => {
    const response = await apiClient.get(`/v1/webhook-deliveries/redrive-jobs/${jobId}/`);
    return response.data;
  },

  /**
   * Cancel redrive job
   */
  cancelRedriveJob: async (jobId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/v1/webhook-deliveries/redrive-jobs/${jobId}/cancel/`);
    return response.data;
  },

  /**
   * Get webhook statistics
   */
  getStats: async (timeframe: "hour" | "day" | "week" | "month" = "day"): Promise<WebhookStats> => {
    const response = await apiClient.get(`/v1/webhooks/stats/?timeframe=${timeframe}`);
    return response.data;
  },

  /**
   * Get webhook health check
   */
  getHealth: async (): Promise<{
    healthy_webhooks: number;
    unhealthy_webhooks: number;
    recent_failures: number;
    avg_success_rate: number;
  }> => {
    const response = await apiClient.get("/v1/webhooks/health/");
    return response.data;
  },
};

// Mock data for development
export const MOCK_WEBHOOKS: Webhook[] = [
  {
    id: "1",
    organization_id: "1",
    name: "Slack Notifications",
    url: "https://example.com/webhook/slack-test",
    secret: "whsec_1234567890abcdef",
    active: true,
    events: ["submission.created", "submission.completed"],
    headers: {
      "Content-Type": "application/json",
      "X-Custom-Header": "value",
    },
    timeout_seconds: 30,
    max_retries: 3,
    retry_strategy: "exponential",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-20T15:30:00Z",
    created_by: "1",
    stats: {
      total_deliveries: 1247,
      successful_deliveries: 1201,
      failed_deliveries: 46,
      avg_response_time: 250,
      last_delivery_at: "2024-01-25T14:30:00Z",
      success_rate: 96.3,
    },
  },
  {
    id: "2",
    organization_id: "1",
    name: "CRM Integration",
    url: "https://api.hubspot.com/webhooks/v3/forms",
    secret: "whsec_abcdef1234567890",
    active: true,
    events: ["submission.created", "form.published"],
    headers: {
      Authorization: "Bearer pat-xxxx",
      "Content-Type": "application/json",
    },
    timeout_seconds: 15,
    max_retries: 5,
    retry_strategy: "exponential",
    created_at: "2024-01-10T09:00:00Z",
    updated_at: "2024-01-22T11:15:00Z",
    created_by: "1",
    stats: {
      total_deliveries: 892,
      successful_deliveries: 847,
      failed_deliveries: 45,
      avg_response_time: 180,
      last_delivery_at: "2024-01-25T13:45:00Z",
      success_rate: 94.9,
    },
  },
];

export const MOCK_DELIVERIES: WebhookDelivery[] = [
  {
    id: "1",
    webhook_id: "1",
    webhook_name: "Slack Notifications",
    webhook_url: "https://example.com/webhook/slack-test",
    event_type: "submission.created",
    resource_type: "submission",
    resource_id: "sub_1234567890",
    status: "success",
    attempt_number: 1,
    max_attempts: 3,
    request_payload: {
      event: "submission.created",
      data: {
        id: "sub_1234567890",
        form_id: "form_123",
        answers: [
          { field: "name", value: "John Doe" },
          { field: "email", value: "john@example.com" },
        ],
        submitted_at: "2024-01-25T14:30:00Z",
      },
    },
    request_headers: {
      "Content-Type": "application/json",
      "X-Webhook-Signature": "sha256=abcdef...",
      "User-Agent": "Skemya-Webhook/1.0",
    },
    response_status: 200,
    response_headers: {
      "Content-Type": "application/json",
      Server: "nginx",
    },
    response_body: '{"ok": true}',
    created_at: "2024-01-25T14:30:00Z",
    sent_at: "2024-01-25T14:30:01Z",
    completed_at: "2024-01-25T14:30:01Z",
    response_time_ms: 234,
    idempotency_key: "idem_1234567890",
    user_agent: "Skemya-Webhook/1.0",
  },
  {
    id: "2",
    webhook_id: "2",
    webhook_name: "CRM Integration",
    webhook_url: "https://api.hubspot.com/webhooks/v3/forms",
    event_type: "submission.created",
    resource_type: "submission",
    resource_id: "sub_0987654321",
    status: "failed",
    attempt_number: 3,
    max_attempts: 5,
    request_payload: {
      event: "submission.created",
      data: {
        id: "sub_0987654321",
        form_id: "form_456",
        answers: [
          { field: "company", value: "Acme Corp" },
          { field: "industry", value: "Technology" },
        ],
        submitted_at: "2024-01-25T13:45:00Z",
      },
    },
    request_headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer pat-xxxx",
      "X-Webhook-Signature": "sha256=fedcba...",
      "User-Agent": "Skemya-Webhook/1.0",
    },
    response_status: 429,
    response_headers: {
      "Content-Type": "application/json",
      "Retry-After": "300",
    },
    response_body: '{"error": "Rate limit exceeded"}',
    error_message: "Rate limit exceeded, will retry in 300 seconds",
    created_at: "2024-01-25T13:45:00Z",
    sent_at: "2024-01-25T13:45:02Z",
    completed_at: "2024-01-25T13:45:03Z",
    next_retry_at: "2024-01-25T13:50:00Z",
    response_time_ms: 156,
    idempotency_key: "idem_0987654321",
    user_agent: "Skemya-Webhook/1.0",
  },
  {
    id: "3",
    webhook_id: "1",
    webhook_name: "Slack Notifications",
    webhook_url: "https://example.com/webhook/slack-test",
    event_type: "form.published",
    resource_type: "form",
    resource_id: "form_789",
    status: "retrying",
    attempt_number: 2,
    max_attempts: 3,
    request_payload: {
      event: "form.published",
      data: {
        id: "form_789",
        title: "Customer Feedback Survey",
        published_at: "2024-01-25T12:00:00Z",
      },
    },
    request_headers: {
      "Content-Type": "application/json",
      "X-Webhook-Signature": "sha256=123abc...",
      "User-Agent": "Skemya-Webhook/1.0",
    },
    error_message: "Connection timeout after 30 seconds",
    created_at: "2024-01-25T12:00:00Z",
    sent_at: "2024-01-25T12:00:02Z",
    next_retry_at: "2024-01-25T12:05:00Z",
    idempotency_key: "idem_form789pub",
    user_agent: "Skemya-Webhook/1.0",
  },
];

export const MOCK_WEBHOOK_STATS: WebhookStats = {
  total_webhooks: 2,
  active_webhooks: 2,
  total_deliveries_today: 47,
  successful_deliveries_today: 43,
  failed_deliveries_today: 4,
  avg_response_time_today: 215,

  delivery_timeline: [
    { timestamp: "2024-01-25T00:00:00Z", total: 5, successful: 5, failed: 0 },
    { timestamp: "2024-01-25T01:00:00Z", total: 3, successful: 3, failed: 0 },
    { timestamp: "2024-01-25T02:00:00Z", total: 2, successful: 2, failed: 0 },
    { timestamp: "2024-01-25T03:00:00Z", total: 1, successful: 1, failed: 0 },
    { timestamp: "2024-01-25T04:00:00Z", total: 0, successful: 0, failed: 0 },
    { timestamp: "2024-01-25T05:00:00Z", total: 1, successful: 0, failed: 1 },
    { timestamp: "2024-01-25T06:00:00Z", total: 4, successful: 3, failed: 1 },
    { timestamp: "2024-01-25T07:00:00Z", total: 6, successful: 6, failed: 0 },
    { timestamp: "2024-01-25T08:00:00Z", total: 8, successful: 7, failed: 1 },
    { timestamp: "2024-01-25T09:00:00Z", total: 12, successful: 11, failed: 1 },
    { timestamp: "2024-01-25T10:00:00Z", total: 5, successful: 5, failed: 0 },
  ],

  response_time_distribution: [
    { range: "0-100ms", count: 15 },
    { range: "100-200ms", count: 18 },
    { range: "200-500ms", count: 12 },
    { range: "500ms-1s", count: 2 },
    { range: "1s+", count: 0 },
  ],

  status_breakdown: {
    pending: 2,
    success: 41,
    failed: 3,
    retrying: 1,
  },

  event_breakdown: {
    "form.created": 2,
    "form.updated": 1,
    "form.published": 3,
    "form.unpublished": 0,
    "form.deleted": 0,
    "submission.created": 35,
    "submission.updated": 2,
    "submission.partial": 4,
    "submission.completed": 0,
    "submission.deleted": 0,
    "user.invited": 0,
    "user.joined": 0,
    "user.removed": 0,
  },
};
