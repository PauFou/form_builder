import { apiClient } from "./axios-client";
import type { Integration } from "@forms/contracts";

export const integrationsApi = {
  // List available integrations
  list: async (): Promise<{ data: { integrations: Integration[] } }> => {
    const response = await apiClient.get("/v1/integrations/");
    return { data: { integrations: response.data || [] } };
  },

  // Get integration details
  get: async (id: string): Promise<Integration> => {
    const response = (await apiClient.get(`/v1/integrations/${id}/`)) as any;
    if (!response.data || Array.isArray(response.data) || !response.data.type) {
      return { id, name: "", type: "unknown" };
    }
    return response.data;
  },

  // Configure integration
  configure: async (id: string, config: any): Promise<Integration> => {
    const response = await apiClient.post(`/v1/integrations/${id}/configure/`, config);
    return response.data;
  },

  // Enable/disable integration
  toggle: async (id: string, enabled: boolean): Promise<Integration> => {
    const response = await apiClient.put(`/v1/integrations/${id}/`, { enabled });
    return response.data;
  },

  // Test integration
  test: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post(`/v1/integrations/${id}/test/`);
    return response.data;
  },

  // Create integration
  create: async (data: { type: string; name: string; config?: any }): Promise<Integration> => {
    const response = await apiClient.post(`/v1/integrations/`, data);
    return response.data;
  },

  // Delete integration
  delete: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/v1/integrations/${id}/`);
    return response.data;
  },

  // Sync integration
  sync: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post(`/v1/integrations/${id}/sync/`);
    return response.data;
  },
};
