import { apiClient } from './client';
import type { Integration, IntegrationConnection } from '@forms/contracts';

export const integrationsApi = {
  // List integrations
  list: async (params?: { 
    search?: string;
    type?: string;
    status?: string;
  }) => {
    const response = await apiClient.get('/integrations', { params });
    return response.data;
  },

  // Get single integration
  get: async (id: string) => {
    const response = await apiClient.get(`/integrations/${id}`);
    return response.data;
  },

  // Create integration
  create: async (data: {
    type: string;
    name: string;
    config?: any;
    settings?: any;
  }) => {
    const response = await apiClient.post('/integrations', data);
    return response.data;
  },

  // Update integration
  update: async (id: string, data: Partial<Integration>) => {
    const response = await apiClient.put(`/integrations/${id}`, data);
    return response.data;
  },

  // Delete integration
  delete: async (id: string) => {
    const response = await apiClient.delete(`/integrations/${id}`);
    return response.data;
  },

  // Test integration
  test: async (id: string, sampleData?: any) => {
    const response = await apiClient.post(`/integrations/${id}/test`, {
      sample_data: sampleData
    });
    return response.data;
  },

  // Start OAuth flow
  oauthStart: async (id: string) => {
    const response = await apiClient.post(`/integrations/${id}/oauth/start`);
    return response.data;
  },

  // Complete OAuth flow
  oauthCallback: async (id: string, code: string, state: string) => {
    const response = await apiClient.post(`/integrations/${id}/oauth/callback`, {
      code,
      state
    });
    return response.data;
  },

  // Sync integration
  sync: async (id: string) => {
    const response = await apiClient.post(`/integrations/${id}/sync`);
    return response.data;
  },
};

export const integrationConnectionsApi = {
  // List connections
  list: async (params?: {
    form?: string;
    integration?: string;
  }) => {
    const response = await apiClient.get('/integration-connections', { params });
    return response.data;
  },

  // Get single connection
  get: async (id: string) => {
    const response = await apiClient.get(`/integration-connections/${id}`);
    return response.data;
  },

  // Create connection
  create: async (data: {
    form: string;
    integration: string;
    enabled?: boolean;
    trigger_events?: string[];
    field_mapping?: any;
    settings?: any;
  }) => {
    const response = await apiClient.post('/integration-connections', data);
    return response.data;
  },

  // Update connection
  update: async (id: string, data: Partial<IntegrationConnection>) => {
    const response = await apiClient.put(`/integration-connections/${id}`, data);
    return response.data;
  },

  // Delete connection
  delete: async (id: string) => {
    const response = await apiClient.delete(`/integration-connections/${id}`);
    return response.data;
  },

  // Test connection
  test: async (id: string, sampleData?: any) => {
    const response = await apiClient.post(`/integration-connections/${id}/test`, {
      sample_data: sampleData
    });
    return response.data;
  },

  // Get field mapping suggestions
  getMappingSuggestions: async (id: string) => {
    const response = await apiClient.get(`/integration-connections/${id}/mapping-suggestions`);
    return response.data;
  },
};

export const integrationLogsApi = {
  // List logs
  list: async (params?: {
    connection?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const response = await apiClient.get('/integration-logs', { params });
    return response.data;
  },

  // Get single log
  get: async (id: string) => {
    const response = await apiClient.get(`/integration-logs/${id}`);
    return response.data;
  },

  // Retry failed log
  retry: async (id: string) => {
    const response = await apiClient.post(`/integration-logs/${id}/retry`);
    return response.data;
  },
};