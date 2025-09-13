import { integrationsApi } from "../integrations";
import { apiClient } from "../axios-client";

// Mock the axios client
jest.mock("../axios-client");

describe("integrationsApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("list", () => {
    it("fetches integrations list", async () => {
      const mockIntegrations = [
        { id: "1", name: "Slack", type: "slack", enabled: true },
        { id: "2", name: "Google Sheets", type: "google_sheets", enabled: false },
      ];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockIntegrations });

      const result = await integrationsApi.list();

      expect(apiClient.get).toHaveBeenCalledWith("/v1/integrations/");
      expect(result).toEqual({ data: { integrations: mockIntegrations } });
    });

    it("handles empty response", async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: null });

      const result = await integrationsApi.list();

      expect(result).toEqual({ data: { integrations: [] } });
    });

    it("handles undefined response", async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({});

      const result = await integrationsApi.list();

      expect(result).toEqual({ data: { integrations: [] } });
    });
  });

  describe("get", () => {
    it("fetches single integration", async () => {
      const mockIntegration = {
        id: "123",
        name: "Webhook",
        type: "webhook",
        enabled: true,
        config: { url: "https://example.com/hook" },
      };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockIntegration });

      const result = await integrationsApi.get("123");

      expect(apiClient.get).toHaveBeenCalledWith("/v1/integrations/123/");
      expect(result).toEqual(mockIntegration);
    });

    it("handles empty response", async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: null });

      const result = await integrationsApi.get("123");

      expect(result).toEqual({ id: "123", name: "", type: "unknown" });
    });

    it("handles array response", async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });

      const result = await integrationsApi.get("123");

      expect(result).toEqual({ id: "123", name: "", type: "unknown" });
    });

    it("handles response without type", async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: { id: "123", name: "Test" } });

      const result = await integrationsApi.get("123");

      expect(result).toEqual({ id: "123", name: "", type: "unknown" });
    });
  });

  describe("configure", () => {
    it("configures integration", async () => {
      const config = { apiKey: "secret-key", endpoint: "https://api.example.com" };
      const updatedIntegration = {
        id: "123",
        name: "API Integration",
        type: "api",
        config,
        enabled: true,
      };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: updatedIntegration });

      const result = await integrationsApi.configure("123", config);

      expect(apiClient.post).toHaveBeenCalledWith("/v1/integrations/123/configure/", config);
      expect(result).toEqual(updatedIntegration);
    });

    it("handles empty config", async () => {
      const updatedIntegration = { id: "123", name: "Test", type: "test" };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: updatedIntegration });

      const result = await integrationsApi.configure("123", {});

      expect(apiClient.post).toHaveBeenCalledWith("/v1/integrations/123/configure/", {});
      expect(result).toEqual(updatedIntegration);
    });
  });

  describe("toggle", () => {
    it("enables integration", async () => {
      const enabledIntegration = {
        id: "123",
        name: "Slack",
        type: "slack",
        enabled: true,
      };
      (apiClient.put as jest.Mock).mockResolvedValue({ data: enabledIntegration });

      const result = await integrationsApi.toggle("123", true);

      expect(apiClient.put).toHaveBeenCalledWith("/v1/integrations/123/", { enabled: true });
      expect(result).toEqual(enabledIntegration);
    });

    it("disables integration", async () => {
      const disabledIntegration = {
        id: "123",
        name: "Slack",
        type: "slack",
        enabled: false,
      };
      (apiClient.put as jest.Mock).mockResolvedValue({ data: disabledIntegration });

      const result = await integrationsApi.toggle("123", false);

      expect(apiClient.put).toHaveBeenCalledWith("/v1/integrations/123/", { enabled: false });
      expect(result).toEqual(disabledIntegration);
    });
  });

  describe("test", () => {
    it("tests integration successfully", async () => {
      const response = { success: true, message: "Connection successful" };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: response });

      const result = await integrationsApi.test("123");

      expect(apiClient.post).toHaveBeenCalledWith("/v1/integrations/123/test/");
      expect(result).toEqual(response);
    });

    it("handles test failure", async () => {
      const response = { success: false, message: "Connection failed: Invalid credentials" };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: response });

      const result = await integrationsApi.test("123");

      expect(result).toEqual(response);
    });
  });

  describe("create", () => {
    it("creates new integration", async () => {
      const newIntegrationData = {
        type: "webhook",
        name: "My Webhook",
        config: { url: "https://example.com/webhook" },
      };
      const createdIntegration = {
        id: "456",
        ...newIntegrationData,
        enabled: false,
        createdAt: new Date(),
      };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: createdIntegration });

      const result = await integrationsApi.create(newIntegrationData);

      expect(apiClient.post).toHaveBeenCalledWith("/v1/integrations/", newIntegrationData);
      expect(result).toEqual(createdIntegration);
    });

    it("creates integration without config", async () => {
      const newIntegrationData = {
        type: "email",
        name: "Email Notifications",
      };
      const createdIntegration = {
        id: "789",
        ...newIntegrationData,
        enabled: false,
      };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: createdIntegration });

      const result = await integrationsApi.create(newIntegrationData);

      expect(apiClient.post).toHaveBeenCalledWith("/v1/integrations/", newIntegrationData);
      expect(result).toEqual(createdIntegration);
    });
  });

  describe("delete", () => {
    it("deletes integration", async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

      const result = await integrationsApi.delete("123");

      expect(apiClient.delete).toHaveBeenCalledWith("/v1/integrations/123/");
      expect(result).toEqual({ success: true });
    });

    it("handles deletion failure", async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({ data: { success: false } });

      const result = await integrationsApi.delete("123");

      expect(result).toEqual({ success: false });
    });
  });

  describe("sync", () => {
    it("syncs integration successfully", async () => {
      const response = { success: true, message: "Sync completed: 50 records updated" };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: response });

      const result = await integrationsApi.sync("123");

      expect(apiClient.post).toHaveBeenCalledWith("/v1/integrations/123/sync/");
      expect(result).toEqual(response);
    });

    it("handles sync failure", async () => {
      const response = { success: false, message: "Sync failed: API rate limit exceeded" };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: response });

      const result = await integrationsApi.sync("123");

      expect(result).toEqual(response);
    });
  });
});
