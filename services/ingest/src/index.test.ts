/**
 * Tests for edge ingest service
 */

import { describe, it, expect, vi } from "vitest";
import worker from "./index";

// Mock environment
const mockEnv = {
  RATE_LIMIT: {
    get: vi.fn(),
    put: vi.fn(),
  },
  EVENT_QUEUE: {
    send: vi.fn(),
  },
  SUBMISSION_QUEUE: {
    send: vi.fn(),
  },
  HMAC_SECRET: "test-secret",
  API_ENDPOINT: "https://api.test.com",
  CLICKHOUSE_ENDPOINT: "https://clickhouse.test.com",
  ALLOWED_ORIGINS: "https://app.test.com,https://test.com",
  MAX_EVENTS_PER_BATCH: "1000",
  MAX_REQUEST_SIZE: "1048576",
};

// Mock execution context
const mockCtx = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
};

describe("Edge Ingest Worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Health Check", () => {
    it("should return healthy status", async () => {
      const request = new Request("https://ingest.test.com/health");
      const response = await worker.fetch(request, mockEnv as any, mockCtx as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("healthy");
      expect(data.timestamp).toBeDefined();
    });
  });

  describe("Analytics Events", () => {
    it("should accept valid view event", async () => {
      const event = {
        event_type: "view",
        form_id: "123e4567-e89b-12d3-a456-426614174000",
        session_id: "session-123",
        page_load_time_ms: 250,
      };

      const request = new Request("https://ingest.test.com/events/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://app.test.com",
        },
        body: JSON.stringify(event),
      });

      // Mock rate limit check
      mockEnv.RATE_LIMIT.get.mockResolvedValue("10");
      mockEnv.RATE_LIMIT.put.mockResolvedValue(undefined);
      mockEnv.EVENT_QUEUE.send.mockResolvedValue(undefined);

      const response = await worker.fetch(request, mockEnv as any, mockCtx as any);

      expect(response.status).toBe(204);
      expect(mockEnv.EVENT_QUEUE.send).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: "view",
          form_id: event.form_id,
          session_id: event.session_id,
          timestamp: expect.any(String),
        })
      );
    });

    it("should reject invalid event", async () => {
      const invalidEvent = {
        event_type: "view",
        // Missing required form_id
        session_id: "session-123",
      };

      const request = new Request("https://ingest.test.com/events/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://app.test.com",
        },
        body: JSON.stringify(invalidEvent),
      });

      mockEnv.RATE_LIMIT.get.mockResolvedValue("10");
      mockEnv.RATE_LIMIT.put.mockResolvedValue(undefined);

      const response = await worker.fetch(request, mockEnv as any, mockCtx as any);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation error");
      expect(data.details).toBeDefined();
    });

    it("should handle batch events", async () => {
      const events = [
        {
          event_type: "view",
          form_id: "123e4567-e89b-12d3-a456-426614174000",
          session_id: "session-1",
          page_load_time_ms: 200,
        },
        {
          event_type: "interaction",
          form_id: "123e4567-e89b-12d3-a456-426614174000",
          session_id: "session-1",
          interaction_type: "field_change",
          field_id: "field-1",
        },
      ];

      const request = new Request("https://ingest.test.com/events/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://app.test.com",
        },
        body: JSON.stringify({ events }),
      });

      mockEnv.RATE_LIMIT.get.mockResolvedValue("10");
      mockEnv.RATE_LIMIT.put.mockResolvedValue(undefined);
      mockEnv.EVENT_QUEUE.send.mockResolvedValue(undefined);

      const response = await worker.fetch(request, mockEnv as any, mockCtx as any);

      expect(response.status).toBe(202);
      const data = await response.json();
      expect(data.accepted).toBe(2);
      expect(mockEnv.EVENT_QUEUE.send).toHaveBeenCalled();
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limits", async () => {
      const request = new Request("https://ingest.test.com/events/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://app.test.com",
        },
        body: JSON.stringify({
          event_type: "view",
          form_id: "123e4567-e89b-12d3-a456-426614174000",
          session_id: "session-123",
          page_load_time_ms: 250,
        }),
      });

      // Mock rate limit exceeded
      mockEnv.RATE_LIMIT.get.mockResolvedValue("100"); // Max is 100

      const response = await worker.fetch(request, mockEnv as any, mockCtx as any);

      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("60");
      const data = await response.json();
      expect(data.error).toBe("Rate limit exceeded");
    });
  });

  describe("CORS", () => {
    it("should handle preflight requests", async () => {
      const request = new Request("https://ingest.test.com/events/track", {
        method: "OPTIONS",
        headers: {
          Origin: "https://app.test.com",
          "Access-Control-Request-Method": "POST",
        },
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx as any);

      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://app.test.com");
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    });

    it("should reject unauthorized origins", async () => {
      const request = new Request("https://ingest.test.com/events/track", {
        method: "OPTIONS",
        headers: {
          Origin: "https://evil.com",
          "Access-Control-Request-Method": "POST",
        },
      });

      const response = await worker.fetch(request, mockEnv as any, mockCtx as any);

      expect(response.status).toBe(200);
      expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });
  });

  describe("Form Submissions", () => {
    it("should handle form submission", async () => {
      const submission = {
        session_id: "session-123",
        data: {
          field1: "value1",
          field2: "value2",
        },
        metadata: {
          started_at: "2024-01-01T10:00:00Z",
          completed_at: "2024-01-01T10:05:00Z",
        },
      };

      const formId = "123e4567-e89b-12d3-a456-426614174000";
      const request = new Request(`https://ingest.test.com/forms/${formId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://app.test.com",
        },
        body: JSON.stringify(submission),
      });

      mockEnv.RATE_LIMIT.get.mockResolvedValue("10");
      mockEnv.RATE_LIMIT.put.mockResolvedValue(undefined);
      mockEnv.SUBMISSION_QUEUE.send.mockResolvedValue(undefined);
      mockEnv.EVENT_QUEUE.send.mockResolvedValue(undefined);

      const response = await worker.fetch(request, mockEnv as any, mockCtx as any);

      expect(response.status).toBe(202);
      const data = await response.json();
      expect(data.status).toBe("accepted");
      expect(data.id).toBeDefined();

      expect(mockEnv.SUBMISSION_QUEUE.send).toHaveBeenCalledWith(
        expect.objectContaining({
          form_id: formId,
          session_id: submission.session_id,
          data: submission.data,
        })
      );

      expect(mockEnv.EVENT_QUEUE.send).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: "submission",
          form_id: formId,
          is_complete: true,
        })
      );
    });

    it("should handle partial submission", async () => {
      const partial = {
        session_id: "session-123",
        current_step: 2,
        data: {
          field1: "value1",
        },
      };

      const formId = "123e4567-e89b-12d3-a456-426614174000";
      const request = new Request(`https://ingest.test.com/forms/${formId}/partial`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://app.test.com",
        },
        body: JSON.stringify(partial),
      });

      mockEnv.RATE_LIMIT.get.mockResolvedValue("10");
      mockEnv.RATE_LIMIT.put.mockResolvedValue(undefined);
      mockEnv.SUBMISSION_QUEUE.send.mockResolvedValue(undefined);

      const response = await worker.fetch(request, mockEnv as any, mockCtx as any);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("saved");

      expect(mockEnv.SUBMISSION_QUEUE.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "partial",
          form_id: formId,
          session_id: partial.session_id,
          current_step: partial.current_step,
        })
      );
    });
  });
});
