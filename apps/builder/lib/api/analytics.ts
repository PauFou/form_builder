import { apiClient } from "./axios-client";

export type EventType =
  | "form_view"
  | "form_start"
  | "step_view"
  | "field_focus"
  | "field_change"
  | "field_error"
  | "step_complete"
  | "form_submit"
  | "form_abandon"
  | "outcome_reached"
  | "payment_initiated"
  | "payment_completed"
  | "partial_save";

export type DeviceType = "desktop" | "mobile" | "tablet";

export type AnalyticsEvent = {
  event_type: EventType;
  form_id: string;
  organization_id: string;
  respondent_id: string;
  session_id: string;
  timestamp?: string;
  step_id?: string;
  field_id?: string;
  field_type?: string;
  field_value?: string;
  error_type?: string;
  error_message?: string;
  outcome_id?: string;
  submission_id?: string;
  is_partial?: boolean;
  device_type?: DeviceType;
  browser?: string;
  os?: string;
  country_code?: string;
  page_load_time_ms?: number;
  time_to_interactive_ms?: number;
  time_on_step_ms?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer_domain?: string;
};

export type FormAnalytics = {
  form_id: string;
  period: string;
  views: number;
  starts: number;
  completions: number;
  completion_rate: number;
  avg_completion_time_seconds: number;
  drop_off_rate: number;
  error_rate: number;
  device_breakdown: Record<string, number>;
  top_drop_off_points: Array<{
    step_id: string;
    started: number;
    completed: number;
    drop_rate: number;
  }>;
};

export type FunnelStep = {
  step_name: string;
  count: number;
  conversion_rate: number;
};

export type RealtimeStats = {
  form_id: string;
  date: string;
  stats: Record<EventType, number>;
};

export type DashboardWidget = {
  widget_id: string;
  widget_type: "line" | "bar" | "pie" | "funnel" | "table" | "metric";
  title: string;
  query: string;
  config: Record<string, any>;
};

export type Dashboard = {
  dashboard_id?: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  created_at?: string;
  updated_at?: string;
};

// Analytics service configuration
const ANALYTICS_BASE_URL = process.env.NEXT_PUBLIC_ANALYTICS_URL || "http://localhost:8002";

export const analyticsApi = {
  // Event tracking
  trackEvent: async (event: AnalyticsEvent): Promise<{ status: string; event_id?: string }> => {
    try {
      const response = await fetch(`${ANALYTICS_BASE_URL}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to track event:", error);
      // Fail silently for analytics
      return { status: "failed" };
    }
  },

  // Batch event tracking
  trackEventsBatch: async (
    events: AnalyticsEvent[]
  ): Promise<{ status: string; count?: number }> => {
    try {
      const response = await fetch(`${ANALYTICS_BASE_URL}/events/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(events),
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to track events batch:", error);
      return { status: "failed" };
    }
  },

  // Get form analytics
  getFormAnalytics: async (
    formId: string,
    organizationId: string,
    startDate?: string,
    endDate?: string
  ): Promise<FormAnalytics> => {
    const params = new URLSearchParams({
      organization_id: organizationId,
    });

    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const response = await fetch(
      `${ANALYTICS_BASE_URL}/analytics/form/${formId}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch form analytics: ${response.status}`);
    }

    return await response.json();
  },

  // Get funnel analytics
  getFunnelAnalytics: async (
    formId: string,
    organizationId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ funnel: FunnelStep[] }> => {
    const params = new URLSearchParams({
      organization_id: organizationId,
    });

    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const response = await fetch(
      `${ANALYTICS_BASE_URL}/analytics/funnel/${formId}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch funnel analytics: ${response.status}`);
    }

    return await response.json();
  },

  // Get real-time analytics
  getRealtimeAnalytics: async (formId: string): Promise<RealtimeStats> => {
    const response = await fetch(`${ANALYTICS_BASE_URL}/analytics/realtime/${formId}`, {
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch realtime analytics: ${response.status}`);
    }

    return await response.json();
  },

  // Dashboard management
  createDashboard: async (
    dashboard: Dashboard,
    organizationId: string
  ): Promise<{ dashboard_id: string; status: string }> => {
    const response = await fetch(
      `${ANALYTICS_BASE_URL}/dashboards?organization_id=${organizationId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(dashboard),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create dashboard: ${response.status}`);
    }

    return await response.json();
  },

  getDashboard: async (dashboardId: string): Promise<Dashboard> => {
    const response = await fetch(`${ANALYTICS_BASE_URL}/dashboards/${dashboardId}`, {
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard: ${response.status}`);
    }

    return await response.json();
  },

  executeDashboard: async (dashboardId: string): Promise<Record<string, any>> => {
    const response = await fetch(`${ANALYTICS_BASE_URL}/dashboards/${dashboardId}/execute`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to execute dashboard: ${response.status}`);
    }

    return await response.json();
  },
};

// Helper function to get auth token
async function getAuthToken(): Promise<string> {
  // In a real app, this would get the JWT token from your auth system
  // For now, return a placeholder
  return "placeholder-token";
}

// Helper function to create a session ID
export function createSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Helper function to create a respondent ID
export function createRespondentId(): string {
  return `respondent_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Helper to detect device type
export function detectDeviceType(): DeviceType {
  if (typeof window === "undefined") return "desktop";

  const userAgent = window.navigator.userAgent;

  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return "tablet";
  }

  if (
    /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(
      userAgent
    )
  ) {
    return "mobile";
  }

  return "desktop";
}

// Helper to get browser info
export function getBrowserInfo(): { browser: string; os: string } {
  if (typeof window === "undefined") {
    return { browser: "unknown", os: "unknown" };
  }

  const userAgent = window.navigator.userAgent;

  // Detect browser
  let browser = "unknown";
  if (userAgent.includes("Chrome")) browser = "chrome";
  else if (userAgent.includes("Firefox")) browser = "firefox";
  else if (userAgent.includes("Safari")) browser = "safari";
  else if (userAgent.includes("Edge")) browser = "edge";

  // Detect OS
  let os = "unknown";
  if (userAgent.includes("Windows")) os = "windows";
  else if (userAgent.includes("Mac")) os = "macos";
  else if (userAgent.includes("Linux")) os = "linux";
  else if (userAgent.includes("Android")) os = "android";
  else if (userAgent.includes("iOS")) os = "ios";

  return { browser, os };
}

// Helper to get UTM parameters
export function getUtmParameters(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const urlParams = new URLSearchParams(window.location.search);
  const utmParams: Record<string, string> = {};

  const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  utmKeys.forEach((key) => {
    const value = urlParams.get(key);
    if (value) utmParams[key] = value;
  });

  return utmParams;
}

// Helper to get referrer domain
export function getReferrerDomain(): string {
  if (typeof document === "undefined") return "";

  try {
    const referrer = document.referrer;
    if (!referrer) return "";

    const url = new URL(referrer);
    return url.hostname;
  } catch {
    return "";
  }
}
