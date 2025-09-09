import { apiClient } from './client';

export const integrationsApi = {
  // List available integrations
  list: async () => {
    return {
      data: {
        integrations: [
          {
            id: 'google-sheets',
            name: 'Google Sheets',
            description: 'Send form responses to Google Sheets',
            icon: '📊',
            enabled: false,
            configured: false
          },
          {
            id: 'slack',
            name: 'Slack',
            description: 'Get notifications in Slack',
            icon: '💬',
            enabled: false,
            configured: false
          },
          {
            id: 'notion',
            name: 'Notion',
            description: 'Create Notion database entries',
            icon: '📝',
            enabled: false,
            configured: false
          },
          {
            id: 'airtable',
            name: 'Airtable',
            description: 'Add records to Airtable',
            icon: '📋',
            enabled: false,
            configured: false
          },
          {
            id: 'hubspot',
            name: 'HubSpot',
            description: 'Create contacts and deals',
            icon: '🚀',
            enabled: false,
            configured: false
          },
          {
            id: 'make',
            name: 'Make (Integromat)',
            description: 'Connect to 1000+ apps',
            icon: '🔗',
            enabled: false,
            configured: false
          },
          {
            id: 'zapier',
            name: 'Zapier',
            description: 'Automate workflows',
            icon: '⚡',
            enabled: false,
            configured: false
          },
          {
            id: 'stripe',
            name: 'Stripe',
            description: 'Accept payments',
            icon: '💳',
            enabled: false,
            configured: false
          }
        ]
      }
    };
  },

  // Get integration details
  get: async (id: string) => {
    const response = await apiClient.get(`/integrations/${id}`);
    return response.data;
  },

  // Configure integration
  configure: async (id: string, config: any) => {
    const response = await apiClient.post(`/integrations/${id}/configure`, config);
    return response.data;
  },

  // Enable/disable integration
  toggle: async (id: string, enabled: boolean) => {
    const response = await apiClient.put(`/integrations/${id}`, { enabled });
    return response.data;
  },

  // Test integration
  test: async (id: string) => {
    const response = await apiClient.post(`/integrations/${id}/test`);
    return response.data;
  }
};