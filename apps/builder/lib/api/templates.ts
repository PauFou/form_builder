/**
 * Templates API client
 */

import { apiClient } from "./axios-client";
import type {
  Template,
  TemplateCategory,
  TemplateFilters,
  CreateTemplateRequest,
  UseTemplateRequest,
  TemplateUsage,
} from "../types/templates";

export const templatesApi = {
  /**
   * List templates with optional filters
   */
  list: async (
    filters: TemplateFilters = {}
  ): Promise<{
    templates: Template[];
    total: number;
    categories: TemplateCategory[];
  }> => {
    const params = new URLSearchParams();

    if (filters.search) params.append("search", filters.search);
    if (filters.category_id) params.append("category_id", filters.category_id);
    if (filters.difficulty) params.append("difficulty", filters.difficulty);
    if (filters.is_featured !== undefined)
      params.append("is_featured", String(filters.is_featured));
    if (filters.sort_by) params.append("sort_by", filters.sort_by);
    if (filters.sort_order) params.append("sort_order", filters.sort_order);
    if (filters.tags?.length) {
      filters.tags.forEach((tag) => params.append("tags", tag));
    }

    const response = await apiClient.get(`/v1/templates/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get template by ID
   */
  get: async (id: string): Promise<Template> => {
    const response = await apiClient.get(`/v1/templates/${id}/`);
    return response.data;
  },

  /**
   * Get template categories
   */
  getCategories: async (): Promise<TemplateCategory[]> => {
    const response = await apiClient.get("/v1/templates/categories/");
    return response.data;
  },

  /**
   * Create template from existing form
   */
  create: async (data: CreateTemplateRequest): Promise<Template> => {
    const response = await apiClient.post("/v1/templates/", data);
    return response.data;
  },

  /**
   * Use template to create new form
   */
  use: async (data: UseTemplateRequest): Promise<{ form_id: string }> => {
    const response = await apiClient.post("/v1/templates/use/", data);
    return response.data;
  },

  /**
   * Update template
   */
  update: async (id: string, data: Partial<CreateTemplateRequest>): Promise<Template> => {
    const response = await apiClient.patch(`/v1/templates/${id}/`, data);
    return response.data;
  },

  /**
   * Delete template
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/templates/${id}/`);
  },

  /**
   * Get template usage analytics
   */
  getUsage: async (id: string): Promise<TemplateUsage[]> => {
    const response = await apiClient.get(`/v1/templates/${id}/usage/`);
    return response.data;
  },

  /**
   * Rate template
   */
  rate: async (id: string, rating: number): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/v1/templates/${id}/rate/`, { rating });
    return response.data;
  },

  /**
   * Get featured templates
   */
  getFeatured: async (): Promise<Template[]> => {
    const response = await apiClient.get("/v1/templates/featured/");
    return response.data;
  },

  /**
   * Search templates
   */
  search: async (query: string): Promise<Template[]> => {
    const response = await apiClient.get(`/v1/templates/search/?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

// Mock data for development
export const MOCK_TEMPLATES: Template[] = [
  {
    id: "1",
    title: "Contact Us Form",
    description:
      "Simple contact form with name, email, and message fields. Perfect for business websites.",
    category: {
      id: "contact",
      name: "Contact Forms",
      description: "Get in touch forms for businesses",
      icon: "Mail",
      color: "blue",
      sort_order: 1,
    },
    tags: ["business", "simple", "contact"],
    thumbnail: "/templates/contact-form.png",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-20T15:30:00Z",
    created_by: "system",
    use_count: 1250,
    rating: 4.8,
    rating_count: 95,
    form_schema: {},
    difficulty: "beginner",
    estimated_time: 5,
    is_featured: true,
    is_public: true,
    includes_pii: true,
    compliance_notes: "Collects email and may collect personal information in message",
  },
  {
    id: "2",
    title: "Customer Satisfaction Survey",
    description:
      "Comprehensive survey to measure customer satisfaction with products and services.",
    category: {
      id: "survey",
      name: "Surveys & Polls",
      description: "Collect feedback and opinions",
      icon: "BarChart3",
      color: "green",
      sort_order: 2,
    },
    tags: ["business", "survey", "customer", "rating"],
    thumbnail: "/templates/satisfaction-survey.png",
    created_at: "2024-01-10T14:00:00Z",
    updated_at: "2024-01-18T09:15:00Z",
    created_by: "system",
    use_count: 890,
    rating: 4.6,
    rating_count: 67,
    form_schema: {},
    difficulty: "intermediate",
    estimated_time: 15,
    is_featured: true,
    is_public: true,
    includes_pii: false,
    compliance_notes: "Anonymous survey, no PII collected",
  },
  {
    id: "3",
    title: "Event Registration",
    description:
      "Complete registration form for events with attendee details and payment integration.",
    category: {
      id: "registration",
      name: "Registration",
      description: "Event and service registration",
      icon: "UserPlus",
      color: "purple",
      sort_order: 3,
    },
    tags: ["event", "registration", "payment", "multi-step"],
    thumbnail: "/templates/event-registration.png",
    created_at: "2024-01-08T11:30:00Z",
    updated_at: "2024-01-22T16:45:00Z",
    created_by: "system",
    use_count: 543,
    rating: 4.9,
    rating_count: 78,
    form_schema: {},
    difficulty: "advanced",
    estimated_time: 25,
    is_featured: true,
    is_public: true,
    includes_pii: true,
    compliance_notes: "Collects personal information and payment details",
  },
];
