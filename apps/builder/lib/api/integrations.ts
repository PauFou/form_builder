import { apiClient } from "./client";
import type { Integration } from "@forms/contracts";

export const integrationsApi = {
  // List available integrations
  list: async (): Promise<{ data: { integrations: Integration[] } }> => {
    return {
      data: {
        integrations: [
          {
            id: "google-sheets",
            name: "Google Sheets",
            type: "google-sheets",
            description: "Send form responses to Google Sheets",
            icon: "📊",
            enabled: false,
            configured: false,
          },
          {
            id: "slack",
            name: "Slack",
            type: "slack",
            description: "Get notifications in Slack",
            icon: "💬",
            enabled: false,
            configured: false,
          },
          {
            id: "notion",
            name: "Notion",
            type: "notion",
            description: "Create Notion database entries",
            icon: "📝",
            enabled: false,
            configured: false,
          },
          {
            id: "airtable",
            name: "Airtable",
            type: "airtable",
            description: "Add records to Airtable",
            icon: "📋",
            enabled: false,
            configured: false,
          },
          {
            id: "hubspot",
            name: "HubSpot",
            type: "hubspot",
            description: "Create contacts and deals",
            icon: "🚀",
            enabled: false,
            configured: false,
          },
          {
            id: "make",
            name: "Make (Integromat)",
            type: "make",
            description: "Connect to 1000+ apps",
            icon: "🔗",
            enabled: false,
            configured: false,
          },
          {
            id: "zapier",
            name: "Zapier",
            type: "zapier",
            description: "Automate workflows",
            icon: "⚡",
            enabled: false,
            configured: false,
          },
          {
            id: "stripe",
            name: "Stripe",
            type: "stripe",
            description: "Accept payments",
            icon: "💳",
            enabled: false,
            configured: false,
          },
        ],
      },
    };
  },

  // Get integration details
  get: async (id: string): Promise<Integration> => {
    const response = (await apiClient.get(`/integrations/${id}`)) as any;
    if (!response.data || Array.isArray(response.data) || !response.data.type) {
      return { id, name: "", type: "unknown" };
    }
    return response.data;
  },

  // Configure integration
  configure: async (id: string, config: any): Promise<Integration> => {
    const response = await apiClient.post(`/integrations/${id}/configure`, config);
    return response.data;
  },

  // Enable/disable integration
  toggle: async (id: string, enabled: boolean): Promise<Integration> => {
    const response = await apiClient.put(`/integrations/${id}`, { enabled });
    return response.data;
  },

  // Test integration
  test: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post(`/integrations/${id}/test`);
    return response.data;
  },

  // Create integration
  create: async (data: { type: string; name: string; config?: any }): Promise<Integration> => {
    const response = await apiClient.post(`/integrations`, data);
    return response.data;
  },

  // Delete integration
  delete: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/integrations/${id}`);
    return response.data;
  },

  // Sync integration
  sync: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post(`/integrations/${id}/sync`);
    return response.data;
  },
};
