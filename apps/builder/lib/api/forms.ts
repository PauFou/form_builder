import { apiClient } from "./client";

import type { Form, FormVersion, CreateFormDto, UpdateFormDto } from "@forms/contracts";

export const formsApi = {
  // List forms
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ forms: Form[]; total: number; page: number; limit: number }> => {
    const response = (await apiClient.get("/forms", { params })) as any;
    if (!response.data || !response.data.forms) return { forms: [], total: 0, page: 1, limit: 10 };
    // Map forms to ensure they have all required properties
    const forms = response.data.forms.map(
      (f: any): Form => ({
        id: f.id,
        title: f.title,
        description: f.description,
        pages: f.pages || [],
        ...f,
      })
    );
    return { ...response.data, forms };
  },

  // Get single form
  get: async (id: string): Promise<Form> => {
    const response = (await apiClient.get(`/forms/${id}`)) as any;
    if (!response.data || Array.isArray(response.data)) return { id, title: "", pages: [] };
    return {
      id: response.data.id,
      title: response.data.title,
      description: response.data.description,
      pages: response.data.pages || [],
      ...response.data,
    };
  },

  // Create form
  create: async (data: CreateFormDto): Promise<Form> => {
    const response = await apiClient.post("/forms", data);
    return response.data;
  },

  // Update form
  update: async (id: string, data: UpdateFormDto): Promise<Form> => {
    const response = await apiClient.put(`/forms/${id}`, data);
    return response.data;
  },

  // Delete form
  delete: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/forms/${id}`);
    return response.data;
  },

  // Duplicate form
  duplicate: async (id: string): Promise<Form> => {
    const response = await apiClient.post(`/forms/${id}/duplicate`);
    return response.data;
  },

  // Publish form version
  publish: async (id: string, data?: { canary_percent?: number }): Promise<FormVersion> => {
    const response = await apiClient.post(`/forms/${id}/publish`, data);
    return response.data;
  },

  // Get form versions
  versions: async (id: string): Promise<FormVersion[]> => {
    const response = (await apiClient.get(`/forms/${id}/versions`)) as any;
    return Array.isArray(response.data) ? response.data : [];
  },

  // Rollback to version
  rollback: async (id: string, versionId: string): Promise<Form> => {
    const response = await apiClient.post(`/forms/${id}/rollback`, { version_id: versionId });
    return response.data;
  },

  // Validate import source
  validateImport: async (data: {
    type: "typeform" | "google_forms";
    source: string;
  }): Promise<{ valid: boolean; message?: string; error?: string }> => {
    const response = await apiClient.post("/forms/import/validate", data);
    return response.data;
  },

  // Preview import
  previewImport: async (data: {
    type: "typeform" | "google_forms";
    source: string;
    credentials?: any;
  }): Promise<{ preview: any }> => {
    const response = await apiClient.post("/forms/import/preview", data);
    return response.data;
  },

  // Import form
  importForm: async (data: {
    type: "typeform" | "google_forms";
    source: string;
    credentials?: any;
  }): Promise<{ success: boolean; form_id?: string; message?: string }> => {
    const response = await apiClient.post("/forms/import", data);
    return response.data;
  },

  // Get import requirements
  getImportRequirements: async (sourceType: "typeform" | "google_forms"): Promise<any> => {
    const response = await apiClient.get(`/forms/import/requirements/${sourceType}`);
    return response.data;
  },
};

// Export individual functions for compatibility
export const getForm = formsApi.get;
export const updateForm = formsApi.update;
export const createForm = formsApi.create;
export const deleteForm = formsApi.delete;
export const listForms = formsApi.list;
