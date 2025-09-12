import { apiClient } from "../../../lib/api/client";

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;

describe("apiClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe("GET requests", () => {
    it("should make GET request and return mock data", async () => {
      const result = await apiClient.get("/test-endpoint");

      expect(console.log).toHaveBeenCalledWith("Mock GET:", "/test-endpoint", undefined);
      expect(result).toEqual({ data: null });
    });

    it("should return forms data when fetching /forms", async () => {
      const result = await apiClient.get("/forms");

      expect(result.data).toBeDefined();
      expect(result.data).toHaveProperty("forms");
      const data = result.data as any;
      expect(data.forms).toBeDefined();
      expect(data.forms.length).toBeGreaterThan(0);
      expect(data.total).toBeDefined();
    });

    it("should return form data when fetching specific form", async () => {
      const result = await apiClient.get("/forms/123");

      expect(result.data).toBeDefined();
      const data = result.data as any;
      expect(data.id).toBe("123");
      expect(data.title).toBe("Sample Form");
      expect(data.pages).toBeDefined();
    });

    it("should return versions when fetching form versions", async () => {
      const result = await apiClient.get("/forms/123/versions");

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      const data = result.data as any[];
      expect(data.length).toBeGreaterThan(0);
    });

    it("should pass options to console log", async () => {
      const options = { page: 1, limit: 10 };
      await apiClient.get("/test", options);

      expect(console.log).toHaveBeenCalledWith("Mock GET:", "/test", options);
    });
  });

  describe("POST requests", () => {
    it("should make POST request with body", async () => {
      const payload = { name: "test", value: 123 };
      const result = await apiClient.post("/test", payload);

      expect(console.log).toHaveBeenCalledWith("Mock POST:", "/test", payload);
      expect(result.data).toBeDefined();
      const data = result.data as any;
      expect(data).toMatchObject(payload);
      expect(data.id).toBeDefined();
    });

    it("should generate unique IDs for created resources", async () => {
      const payload = { name: "test" };
      const result1 = await apiClient.post("/test", payload);
      const result2 = await apiClient.post("/test", payload);

      expect(result1.data).toBeDefined();
      expect(result2.data).toBeDefined();
      const data1 = result1.data as any;
      const data2 = result2.data as any;
      expect(data1.id).not.toBe(data2.id);
    });
  });

  describe("PUT requests", () => {
    it("should make PUT request with body", async () => {
      const payload = { name: "updated" };
      const result = await apiClient.put("/test/1", payload);

      expect(console.log).toHaveBeenCalledWith("Mock PUT:", "/test/1", payload);
      expect(result.data).toBeDefined();
      const data = result.data as any;
      expect(data).toMatchObject(payload);
      expect(data.updatedAt).toBeDefined();
    });

    it("should add updatedAt timestamp", async () => {
      const result = await apiClient.put("/test/1", { name: "test" });

      expect(result.data).toBeDefined();
      const data = result.data as any;
      expect(data.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("DELETE requests", () => {
    it("should make DELETE request", async () => {
      const result = await apiClient.delete("/test/1");

      expect(console.log).toHaveBeenCalledWith("Mock DELETE:", "/test/1");
      expect(result.data).toBeDefined();
      const data = result.data as any;
      expect(data.success).toBe(true);
    });
  });

  describe("Special endpoints", () => {
    it("should return auth data for /auth/me", async () => {
      const result = await apiClient.get("/auth/me");

      expect(result.data).toBeDefined();
      const data = result.data as any;
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe("user@example.com");
      expect(data.organization).toBeDefined();
    });

    it("should return integration data for integration endpoints", async () => {
      const result = await apiClient.get("/integrations/webhook-123");

      expect(result.data).toBeDefined();
      const data = result.data as any;
      expect(data.id).toBe("webhook-123");
      expect(data.type).toBe("webhook");
    });
  });
});
