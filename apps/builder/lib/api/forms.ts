import { apiClient } from "./axios-client";

import type { Form, FormVersion, CreateFormDto, UpdateFormDto } from "@skemya/contracts";

export const formsApi = {
  // List forms
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<{ forms: Form[]; total: number; page: number; limit: number }> => {
    const response = (await apiClient.get("/v1/forms/", { params })) as any;

    // Handle different response formats from Django REST Framework
    let forms: Form[] = [];
    let total = 0;
    const page = params?.page || 1;
    const limit = params?.limit || 10;

    if (response.data) {
      // Check if it's a paginated response
      if (response.data.results && Array.isArray(response.data.results)) {
        forms = response.data.results;
        total = response.data.count || response.data.results.length;
      }
      // Check if it's a custom response with forms array
      else if (response.data.forms && Array.isArray(response.data.forms)) {
        forms = response.data.forms;
        total = response.data.total || response.data.forms.length;
      }
      // Direct array response
      else if (Array.isArray(response.data)) {
        forms = response.data;
        total = response.data.length;
      }
    }

    // Map forms to ensure they have all required properties
    const mappedForms = forms.map(
      (f: any): Form => ({
        id: String(f.id), // Ensure ID is always a string
        title: f.title || "",
        description: f.description || "",
        pages: f.pages || [
          {
            id: "page-1",
            title: "Page 1",
            blocks: [],
          },
        ],
        logic: f.logic || { rules: [] },
        theme: f.theme || {},
        settings: f.settings || {},
        createdAt: f.created_at ? new Date(f.created_at) : new Date(),
        updatedAt: f.updated_at ? new Date(f.updated_at) : new Date(),
        ...f,
      })
    );

    return { forms: mappedForms, total, page, limit };
  },

  // Get single form
  get: async (id: string): Promise<Form> => {
    const response = (await apiClient.get(`/v1/forms/${id}/`)) as any;

    if (!response.data || Array.isArray(response.data)) {
      throw new Error("Form not found");
    }

    const form = response.data;

    // Ensure pages have the correct structure with blocks
    const pages = form.pages || [
      {
        id: "page-1",
        title: "Page 1",
        blocks: [],
      },
    ];

    // Make sure each page has blocks array
    const normalizedPages = pages.map((page: any) => ({
      id: page.id || `page-${Date.now()}`,
      title: page.title || "Page",
      description: page.description || "",
      blocks: Array.isArray(page.blocks)
        ? page.blocks.map((block: any) => ({
            id: block.id || `block-${Date.now()}`,
            type: block.type || "short_text",
            question: block.question || block.title || "",
            description: block.description || "",
            placeholder: block.placeholder || "",
            required: block.required || false,
            helpText: block.helpText || "",
            key: block.key || block.id,
            validation: block.validation || [],
            options: block.options || [],
            ...block,
          }))
        : [],
    }));

    const result = {
      id: String(form.id), // Ensure ID is always a string
      title: form.title || "",
      description: form.description || "",
      pages: normalizedPages,
      logic: form.logic || { rules: [] },
      theme: form.theme || {},
      settings: form.settings || {},
      createdAt: form.created_at ? new Date(form.created_at) : new Date(),
      updatedAt: form.updated_at ? new Date(form.updated_at) : new Date(),
      ...form,
    };

    return result;
  },

  // Create form
  create: async (data: CreateFormDto): Promise<Form> => {
    const response = await apiClient.post("/v1/forms/", data);
    const form = response.data;

    // Ensure pages have the correct structure with blocks
    const pages = form.pages || [
      {
        id: "page-1",
        title: "Page 1",
        blocks: [],
      },
    ];

    // Make sure each page has blocks array
    const normalizedPages = pages.map((page: any) => ({
      id: page.id || `page-${Date.now()}`,
      title: page.title || "Page",
      description: page.description || "",
      blocks: Array.isArray(page.blocks)
        ? page.blocks.map((block: any) => ({
            id: block.id || `block-${Date.now()}`,
            type: block.type || "short_text",
            question: block.question || block.title || "",
            description: block.description || "",
            placeholder: block.placeholder || "",
            required: block.required || false,
            helpText: block.helpText || "",
            key: block.key || block.id,
            validation: block.validation || [],
            options: block.options || [],
            ...block,
          }))
        : [],
    }));

    return {
      id: String(form.id), // Ensure ID is always a string
      title: form.title || data.title || "",
      description: form.description || data.description || "",
      pages: normalizedPages,
      logic: form.logic || { rules: [] },
      theme: form.theme || {},
      settings: form.settings || {},
      createdAt: form.created_at ? new Date(form.created_at) : new Date(),
      updatedAt: form.updated_at ? new Date(form.updated_at) : new Date(),
      ...form,
    };
  },

  // Update form
  update: async (id: string, data: UpdateFormDto): Promise<Form> => {
    const response = await apiClient.put(`/v1/forms/${id}/`, data);
    const form = response.data;

    // Ensure pages have the correct structure with blocks
    const pages = form.pages || [
      {
        id: "page-1",
        title: "Page 1",
        blocks: [],
      },
    ];

    // Make sure each page has blocks array
    const normalizedPages = pages.map((page: any) => ({
      id: page.id || `page-${Date.now()}`,
      title: page.title || "Page",
      description: page.description || "",
      blocks: Array.isArray(page.blocks)
        ? page.blocks.map((block: any) => ({
            id: block.id || `block-${Date.now()}`,
            type: block.type || "short_text",
            question: block.question || block.title || "",
            description: block.description || "",
            placeholder: block.placeholder || "",
            required: block.required || false,
            helpText: block.helpText || "",
            key: block.key || block.id,
            validation: block.validation || [],
            options: block.options || [],
            ...block,
          }))
        : [],
    }));

    return {
      id: String(form.id), // Ensure ID is always a string
      title: form.title || "",
      description: form.description || "",
      pages: normalizedPages,
      logic: form.logic || { rules: [] },
      theme: form.theme || {},
      settings: form.settings || {},
      createdAt: form.created_at ? new Date(form.created_at) : new Date(),
      updatedAt: form.updated_at ? new Date(form.updated_at) : new Date(),
      ...form,
    };
  },

  // Delete form
  delete: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/v1/forms/${id}/`);
    return response.data;
  },

  // Duplicate form
  duplicate: async (id: string): Promise<Form> => {
    const response = await apiClient.post(`/v1/forms/${id}/duplicate/`);
    return response.data;
  },

  // Publish form version
  publish: async (
    id: string,
    data?: { canary_percent?: number; release_notes?: string }
  ): Promise<FormVersion> => {
    const response = await apiClient.post(`/v1/forms/${id}/publish/`, data);
    return response.data;
  },

  // Unpublish form
  unpublish: async (id: string): Promise<void> => {
    await apiClient.post(`/v1/forms/${id}/unpublish/`);
  },

  // Get form versions
  versions: async (id: string): Promise<FormVersion[]> => {
    const response = (await apiClient.get(`/v1/forms/${id}/versions/`)) as any;
    return Array.isArray(response.data) ? response.data : [];
  },

  // Rollback to version
  rollback: async (id: string, versionId: string): Promise<Form> => {
    const response = await apiClient.post(`/v1/forms/${id}/rollback/`, { version_id: versionId });
    return response.data;
  },

  // Validate import source
  validateImport: async (data: {
    type: "typeform" | "google_forms" | "tally";
    source: string;
  }): Promise<{ valid: boolean; message?: string; error?: string }> => {
    const response = await apiClient.post("/v1/forms/import/validate/", data);
    return response.data;
  },

  // Preview import
  previewImport: async (data: {
    type: "typeform" | "google_forms" | "tally";
    source: string;
    credentials?: any;
  }): Promise<{
    success: boolean;
    preview?: {
      title: string;
      description: string;
      page_count: number;
      field_count: number;
      has_logic: boolean;
      field_types: Record<string, number>;
      warnings: string[];
      mapping_report: any;
    };
    error?: string;
  }> => {
    const response = await apiClient.post("/v1/forms/import/preview/", data);
    return response.data;
  },

  // Import form
  importForm: async (data: {
    type: "typeform" | "google_forms" | "tally";
    source: string;
    credentials?: any;
  }): Promise<{
    success: boolean;
    form_id?: string;
    status?: string;
    errors?: string[];
    warnings?: string[];
    mapping_report?: any;
    message?: string;
  }> => {
    const response = await apiClient.post("/v1/forms/import/", data);
    return response.data;
  },

  // Get import requirements
  getImportRequirements: async (
    sourceType: "typeform" | "google_forms" | "tally"
  ): Promise<{
    credentials_required: boolean;
    credential_fields?: Array<{
      name: string;
      label: string;
      type: string;
      required: boolean;
      help_text?: string;
    }>;
    oauth_required?: boolean;
    supported_features?: string[];
    limitations?: string[];
  }> => {
    const response = await apiClient.get(`/v1/forms/import/requirements/${sourceType}/`);
    return response.data;
  },

  // Export submissions
  exportSubmissions: async (
    formId: string,
    params: {
      ids?: string[];
      format: "csv" | "json" | "xlsx" | "parquet";
      options?: {
        dateRange?: { start?: string; end?: string };
        status?: string;
        includeMetadata?: boolean;
        includePartials?: boolean;
        anonymize?: boolean;
        fields?: string[];
      };
    }
  ): Promise<any> => {
    const response = await apiClient.post(`/v1/forms/${formId}/submissions/export/`, params, {
      responseType: "blob",
    });
    return response;
  },

  // Get submissions
  getSubmissions: async (
    formId: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      tags?: string[];
    }
  ): Promise<{ submissions: any[]; total: number; page: number; limit: number }> => {
    const response = await apiClient.get(`/v1/forms/${formId}/submissions/`, { params });
    return response.data;
  },

  // Get single submission
  getSubmission: async (formId: string, submissionId: string): Promise<any> => {
    const response = await apiClient.get(`/v1/forms/${formId}/submissions/${submissionId}/`);
    return response.data;
  },

  // Update submission
  updateSubmission: async (formId: string, submissionId: string, data: any): Promise<any> => {
    const response = await apiClient.patch(
      `/v1/forms/${formId}/submissions/${submissionId}/`,
      data
    );
    return response.data;
  },

  // Delete submissions
  deleteSubmissions: async (formId: string, submissionIds: string[]): Promise<void> => {
    await apiClient.post(`/v1/forms/${formId}/submissions/delete/`, { ids: submissionIds });
  },

  // Get tags
  getTags: async (formId: string): Promise<string[]> => {
    const response = await apiClient.get(`/v1/forms/${formId}/tags/`);
    return response.data;
  },

  // Get versions (alias for versions method)
  getVersions: async (id: string): Promise<any[]> => {
    return formsApi.versions(id);
  },

  // Restore version
  restoreVersion: async (formId: string, versionId: string): Promise<void> => {
    await apiClient.post(`/v1/forms/${formId}/versions/${versionId}/restore/`);
  },
};

// Export individual functions for compatibility
export const getForm = formsApi.get;
export const updateForm = formsApi.update;
export const createForm = formsApi.create;
export const deleteForm = formsApi.delete;
export const listForms = formsApi.list;
