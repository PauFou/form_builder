import { apiClient } from "../../../lib/api/client";

// Mock fetch globally
global.fetch = jest.fn();

describe("apiClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any stored tokens
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("GET requests", () => {
    it("should make GET request with correct headers", async () => {
      const mockResponse = { data: "test" };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.get("/test-endpoint");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test-endpoint"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should include auth token if available", async () => {
      const token = "test-token";
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", token);
      }

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await apiClient.get("/test");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );
    });
  });

  describe("POST requests", () => {
    it("should make POST request with body", async () => {
      const payload = { name: "test", value: 123 };
      const mockResponse = { id: 1, ...payload };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.post("/test", payload);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(payload),
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("PUT requests", () => {
    it("should make PUT request with body", async () => {
      const payload = { name: "updated" };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => payload,
      });

      const result = await apiClient.put("/test/1", payload);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test/1"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(payload),
        })
      );
    });
  });

  describe("DELETE requests", () => {
    it("should make DELETE request", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await apiClient.delete("/test/1");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test/1"),
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  describe("Error handling", () => {
    it("should throw error for non-ok responses", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(apiClient.get("/test")).rejects.toThrow("Not Found");
    });

    it("should handle network errors", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      await expect(apiClient.get("/test")).rejects.toThrow("Network error");
    });
  });

  describe("Query parameters", () => {
    it("should append query parameters to URL", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await apiClient.get("/test", { page: 1, limit: 10 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test?page=1&limit=10"),
        expect.any(Object)
      );
    });
  });
});
