import { apiClient } from "./axios-client";

export type Submission = {
  id: string;
  form: string;
  form_title: string;
  form_slug: string;
  version: number;
  respondent_key: string;
  locale: string;
  started_at: string;
  completed_at: string | null;
  metadata_json: Record<string, any> | null;
  answers: Answer[];
  tags: string[];
};

export type Answer = {
  id: string;
  block_id: string;
  type: string;
  value_json: any;
  created_at: string;
  updated_at: string;
};

export type SubmissionStats = {
  total_submissions: number;
  completed_submissions: number;
  partial_submissions: number;
  completion_rate: number;
  average_completion_time: number;
  total_views: number;
};

export type SubmissionFilters = {
  form_pk?: string;
  is_completed?: boolean;
  tags?: string;
  search?: string;
  started_after?: string;
  started_before?: string;
  completed_after?: string;
  completed_before?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
};

export const submissionsApi = {
  // List submissions for a form
  list: async (
    filters: SubmissionFilters = {}
  ): Promise<{
    results: Submission[];
    count: number;
    next: string | null;
    previous: string | null;
  }> => {
    const response = await apiClient.get("/v1/submissions/", { params: filters });
    return response.data;
  },

  // Get a single submission
  get: async (id: string): Promise<Submission> => {
    const response = await apiClient.get(`/v1/submissions/${id}/`);
    return response.data;
  },

  // Create a new submission
  create: async (data: {
    form: string;
    respondent_key: string;
    locale?: string;
    version: number;
    answers: Record<string, any>;
    completed_at?: string;
    metadata_json?: Record<string, any>;
  }): Promise<Submission> => {
    const response = await apiClient.post("/v1/submissions/", data);
    return response.data;
  },

  // Update a submission (mainly for tags/metadata)
  update: async (
    id: string,
    data: {
      metadata_json?: Record<string, any>;
      completed_at?: string;
    }
  ): Promise<Submission> => {
    const response = await apiClient.patch(`/v1/submissions/${id}/`, data);
    return response.data;
  },

  // Delete a submission
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/submissions/${id}/`);
  },

  // Export submissions
  export: async (filters: SubmissionFilters & { format: "csv" | "parquet" }): Promise<Blob> => {
    const response = await apiClient.post("/v1/submissions/export/", filters, {
      responseType: "blob",
    });
    return response.data;
  },

  // Get submission statistics
  stats: async (form_pk?: string): Promise<SubmissionStats> => {
    const params = form_pk ? { form_pk } : {};
    const response = await apiClient.get("/v1/submissions/stats/", { params });
    return response.data;
  },

  // Add tags to a submission
  addTags: async (id: string, tags: string[]): Promise<Submission> => {
    const response = await apiClient.post(`/v1/submissions/${id}/add_tags/`, { tags });
    return response.data;
  },

  // Remove tags from a submission
  removeTags: async (id: string, tags: string[]): Promise<Submission> => {
    const response = await apiClient.post(`/v1/submissions/${id}/remove_tags/`, { tags });
    return response.data;
  },

  // Bulk operations
  bulkAddTags: async (submissionIds: string[], tags: string[]): Promise<void> => {
    await apiClient.post("/v1/submissions/bulk_add_tags/", {
      submission_ids: submissionIds,
      tags,
    });
  },

  bulkExport: async (submissionIds: string[], format: "csv" | "parquet"): Promise<Blob> => {
    const response = await apiClient.post(
      "/v1/submissions/bulk_export/",
      {
        submission_ids: submissionIds,
        format,
      },
      {
        responseType: "blob",
      }
    );
    return response.data;
  },
};

// Helper function to transform API submission to frontend format
export const transformSubmission = (apiSubmission: Submission): any => {
  return {
    id: apiSubmission.id,
    respondentId: apiSubmission.respondent_key,
    completedAt: apiSubmission.completed_at,
    status: apiSubmission.completed_at ? "completed" : "partial",
    score: apiSubmission.metadata_json?.score,
    tags: apiSubmission.tags || [],
    answers: apiSubmission.answers.reduce(
      (acc, answer) => {
        acc[answer.block_id] = answer.value_json;
        return acc;
      },
      {} as Record<string, any>
    ),
    metadata: {
      userAgent: apiSubmission.metadata_json?.user_agent || "",
      ipAddress: apiSubmission.metadata_json?.ip_address || "",
      duration: apiSubmission.metadata_json?.duration || 0,
      device: apiSubmission.metadata_json?.device || "",
      locale: apiSubmission.locale,
      referrer: apiSubmission.metadata_json?.referrer,
    },
  };
};

// Helper to transform frontend stats to API format
export const transformStats = (apiStats: SubmissionStats): any => {
  return {
    views: apiStats.total_views,
    submissions: apiStats.total_submissions,
    completionRate: apiStats.completion_rate,
    averageTime: apiStats.average_completion_time,
  };
};
