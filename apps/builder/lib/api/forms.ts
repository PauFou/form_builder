import { apiClient } from './client';
import type { Form, FormVersion, CreateFormDto, UpdateFormDto } from '@forms/contracts';

export const formsApi = {
  // List forms
  list: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    status?: string;
  }) => {
    const response = await apiClient.get('/forms', { params });
    return response.data;
  },

  // Get single form
  get: async (id: string) => {
    const response = await apiClient.get(`/forms/${id}`);
    return response.data;
  },

  // Create form
  create: async (data: CreateFormDto) => {
    const response = await apiClient.post('/forms', data);
    return response.data;
  },

  // Update form
  update: async (id: string, data: UpdateFormDto) => {
    const response = await apiClient.put(`/forms/${id}`, data);
    return response.data;
  },

  // Delete form
  delete: async (id: string) => {
    const response = await apiClient.delete(`/forms/${id}`);
    return response.data;
  },

  // Duplicate form
  duplicate: async (id: string) => {
    const response = await apiClient.post(`/forms/${id}/duplicate`);
    return response.data;
  },

  // Publish form version
  publish: async (id: string, data?: { canary_percent?: number }) => {
    const response = await apiClient.post(`/forms/${id}/publish`, data);
    return response.data;
  },

  // Get form versions
  versions: async (id: string) => {
    const response = await apiClient.get(`/forms/${id}/versions`);
    return response.data;
  },

  // Rollback to version
  rollback: async (id: string, versionId: string) => {
    const response = await apiClient.post(`/forms/${id}/rollback`, { version_id: versionId });
    return response.data;
  },

  // Import form
  import: async (data: { type: 'typeform' | 'google_forms'; source: string }) => {
    const response = await apiClient.post('/forms/import', data);
    return response.data;
  },
};