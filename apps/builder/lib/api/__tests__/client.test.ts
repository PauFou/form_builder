import { apiClient } from "../client";

describe("MockApiClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET requests", () => {
    it("fetches forms list", async () => {
      const response = await apiClient.get("/forms");

      expect(response.data).toBeTruthy();
      const data = response.data as any;
      expect(data).toHaveProperty("forms");
      expect(data.forms).toHaveLength(2);
      expect(data.forms[0]).toMatchObject({
        id: "1",
        title: "Customer Feedback Survey",
        status: "published",
      });
      expect(data).toHaveProperty("total", 2);
      expect(data).toHaveProperty("page", 1);
      expect(data).toHaveProperty("limit", 10);
    });

    it("fetches form versions", async () => {
      const response = await apiClient.get("/forms/123/versions");

      expect(response.data).toBeTruthy();
      const data = response.data as any[];
      expect(data).toBeInstanceOf(Array);
      expect(data).toHaveLength(2);
      expect(data[0]).toHaveProperty("id");
      expect(data[0]).toHaveProperty("version");
      expect(data[0]).toHaveProperty("schema");
      expect(data[0]).toHaveProperty("publishedAt");
    });

    it("fetches single form by id", async () => {
      const formId = "test-form-id";
      const response = await apiClient.get(`/forms/${formId}`);

      expect(response.data).toBeTruthy();
      const data = response.data as any;
      expect(data).toMatchObject({
        id: formId,
        title: "Sample Form",
        description: "This is a sample form",
      });
      expect(data).toHaveProperty("pages");
      expect(data.pages).toBeInstanceOf(Array);
      expect(data).toHaveProperty("createdAt");
      expect(data).toHaveProperty("updatedAt");
    });

    it("fetches current user info", async () => {
      const response = await apiClient.get("/auth/me");

      expect(response.data).toBeTruthy();
      const data = response.data as any;
      expect(data).toHaveProperty("user");
      expect(data.user).toMatchObject({
        id: "1",
        email: "user@example.com",
      });
      expect(data).toHaveProperty("organization");
      expect(data.organization).toMatchObject({
        id: "1",
        name: "Test Org",
      });
    });

    it("fetches integration by id", async () => {
      const integrationId = "test-integration";
      const response = await apiClient.get(`/integrations/${integrationId}`);

      expect(response.data).toMatchObject({
        id: integrationId,
        name: "Integration",
        type: "webhook",
      });
    });

    it("returns null data for unknown endpoints", async () => {
      const response = await apiClient.get("/unknown/endpoint");

      expect(response.data).toBeNull();
    });

    it("logs requests with options", async () => {
      const options = { headers: { Authorization: "Bearer token" } };
      await apiClient.get("/forms", options);

      expect(console.log).toHaveBeenCalledWith("Mock GET:", "/forms", options);
    });
  });

  describe("POST requests", () => {
    it("creates new resource with generated id", async () => {
      const newData = { title: "New Form", description: "Test" };
      const response = await apiClient.post("/forms", newData);

      expect(response.data).toMatchObject(newData);
      expect(response.data).toHaveProperty("id");
      expect(typeof response.data.id).toBe("string");
    });

    it("logs POST requests", async () => {
      const data = { test: "data" };
      await apiClient.post("/api/test", data);

      expect(console.log).toHaveBeenCalledWith("Mock POST:", "/api/test", data);
    });

    it("handles POST without data", async () => {
      const response = await apiClient.post("/api/action");

      expect(response.data).toHaveProperty("id");
      expect(console.log).toHaveBeenCalledWith("Mock POST:", "/api/action", undefined);
    });
  });

  describe("PUT requests", () => {
    it("updates resource with timestamp", async () => {
      const updateData = { title: "Updated Form", status: "published" };
      const response = await apiClient.put("/forms/123", updateData);

      expect(response.data).toMatchObject(updateData);
      expect(response.data).toHaveProperty("updatedAt");
      expect(response.data.updatedAt).toBeInstanceOf(Date);
    });

    it("logs PUT requests", async () => {
      const data = { update: "value" };
      await apiClient.put("/api/resource/456", data);

      expect(console.log).toHaveBeenCalledWith("Mock PUT:", "/api/resource/456", data);
    });

    it("handles PUT without data", async () => {
      const response = await apiClient.put("/api/resource/789");

      expect(response.data).toHaveProperty("updatedAt");
      expect(console.log).toHaveBeenCalledWith("Mock PUT:", "/api/resource/789", undefined);
    });
  });

  describe("DELETE requests", () => {
    it("deletes resource successfully", async () => {
      const response = await apiClient.delete("/forms/123");

      expect(response.data).toEqual({ success: true });
    });

    it("logs DELETE requests", async () => {
      await apiClient.delete("/api/resource/456");

      expect(console.log).toHaveBeenCalledWith("Mock DELETE:", "/api/resource/456");
    });
  });

  describe("edge cases", () => {
    it("handles complex URLs with multiple segments", async () => {
      const response = await apiClient.get("/api/v1/forms/123/blocks/456");

      expect(response.data).toBeNull();
    });

    it("handles empty POST data", async () => {
      const response = await apiClient.post("/forms", {});

      expect(response.data).toHaveProperty("id");
      expect(Object.keys(response.data)).toHaveLength(1);
    });

    it("handles null PUT data", async () => {
      const response = await apiClient.put("/forms/123", null);

      expect(response.data).toHaveProperty("updatedAt");
    });
  });
});
