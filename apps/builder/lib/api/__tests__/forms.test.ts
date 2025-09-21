import { formsApi, getForm, updateForm, createForm, deleteForm, listForms } from "../forms";
import { apiClient } from "../axios-client";

// Mock the axios client
jest.mock("../axios-client");

describe("formsApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("list", () => {
    it("fetches forms list with default params", async () => {
      const mockResponse = {
        data: {
          forms: [
            { id: "1", title: "Form 1", description: "Desc 1", pages: [] },
            { id: "2", title: "Form 2", description: "Desc 2", pages: [] },
          ],
          total: 2,
          page: 1,
          limit: 10,
        },
      };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await formsApi.list();

      expect(apiClient.get).toHaveBeenCalledWith("/v1/forms/", { params: undefined });
      expect(result.forms).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.forms[0].id).toBe("1");
      expect(result.forms[0].title).toBe("Form 1");
      expect(result.forms[0].description).toBe("Desc 1");
      expect(result.forms[0]).toHaveProperty("logic");
      expect(result.forms[0]).toHaveProperty("theme");
      expect(result.forms[0]).toHaveProperty("settings");
      expect(result.forms[0]).toHaveProperty("createdAt");
      expect(result.forms[0]).toHaveProperty("updatedAt");
    });

    it("fetches forms with query params", async () => {
      const mockResponse = {
        data: {
          forms: [{ id: "1", title: "Test Form", pages: [] }],
          total: 1,
          page: 2,
          limit: 5,
        },
      };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const params = { page: 2, limit: 5, search: "test", status: "published" };
      const result = await formsApi.list(params);

      expect(apiClient.get).toHaveBeenCalledWith("/v1/forms/", { params });
      expect(result.forms).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.forms[0].id).toBe("1");
      expect(result.forms[0].title).toBe("Test Form");
      expect(result.forms[0]).toHaveProperty("description");
      expect(result.forms[0]).toHaveProperty("logic");
      expect(result.forms[0]).toHaveProperty("theme");
    });

    it("handles empty response", async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: null });

      const result = await formsApi.list();

      expect(result).toEqual({ forms: [], total: 0, page: 1, limit: 10 });
    });

    it("handles missing forms property", async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: {} });

      const result = await formsApi.list();

      expect(result).toEqual({ forms: [], total: 0, page: 1, limit: 10 });
    });

    it("ensures forms have required properties", async () => {
      const mockResponse = {
        data: {
          forms: [
            { id: "1", title: "Form 1" }, // Missing description and pages
            { id: "2", title: "Form 2", description: "Desc" }, // Missing pages
          ],
          total: 2,
          page: 1,
          limit: 10,
        },
      };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await formsApi.list();

      // Check that pages are properly initialized with default structure
      expect(result.forms[0].pages).toHaveLength(1);
      expect(result.forms[0].pages[0]).toMatchObject({
        id: "page-1",
        title: "Page 1",
        blocks: [],
      });
      expect(result.forms[1].pages).toHaveLength(1);
      expect(result.forms[1].pages[0]).toMatchObject({
        id: "page-1",
        title: "Page 1",
        blocks: [],
      });
    });
  });

  describe("get", () => {
    it("fetches single form by id", async () => {
      const mockForm = {
        id: "123",
        title: "Test Form",
        description: "Test Description",
        pages: [{ id: "page-1", title: "Page 1", blocks: [] }],
      };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockForm });

      const result = await formsApi.get("123");

      expect(apiClient.get).toHaveBeenCalledWith("/v1/forms/123/");
      expect(result.id).toBe("123");
      expect(result.title).toBe("Test Form");
      expect(result.description).toBe("Test Description");
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0]).toMatchObject({
        id: "page-1",
        title: "Page 1",
        blocks: [],
      });
      expect(result).toHaveProperty("logic");
      expect(result).toHaveProperty("theme");
      expect(result).toHaveProperty("settings");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
    });

    it("handles empty response", async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: null });

      // Should throw an error when form is not found
      await expect(formsApi.get("123")).rejects.toThrow("Form not found");
    });

    it("handles array response", async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });

      // Should throw an error when form is not found
      await expect(formsApi.get("123")).rejects.toThrow("Form not found");
    });

    it("ensures form has pages array", async () => {
      const mockForm = {
        id: "123",
        title: "Test Form",
        description: "Test Description",
        // Missing pages
      };
      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockForm });

      const result = await formsApi.get("123");

      expect(result.pages).toHaveLength(1);
      expect(result.pages[0]).toMatchObject({
        id: "page-1",
        title: "Page 1",
        blocks: [],
      });
    });
  });

  describe("create", () => {
    it("creates new form", async () => {
      const newForm = { title: "New Form", description: "New Description" };
      const createdForm = { id: "456", ...newForm, pages: [] };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: createdForm });

      const result = await formsApi.create(newForm);

      expect(apiClient.post).toHaveBeenCalledWith("/v1/forms/", newForm);
      expect(result.id).toBe("456");
      expect(result.title).toBe("New Form");
      expect(result.description).toBe("New Description");
      expect(result).toHaveProperty("pages");
      expect(result).toHaveProperty("logic");
      expect(result).toHaveProperty("theme");
      expect(result).toHaveProperty("settings");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
    });
  });

  describe("update", () => {
    it("updates existing form", async () => {
      const updates = { title: "Updated Form" };
      const updatedForm = { id: "123", title: "Updated Form", pages: [] };
      (apiClient.put as jest.Mock).mockResolvedValue({ data: updatedForm });

      const result = await formsApi.update("123", updates);

      expect(apiClient.put).toHaveBeenCalledWith("/v1/forms/123/", updates);
      expect(result.id).toBe("123");
      expect(result.title).toBe("Updated Form");
      expect(result).toHaveProperty("pages");
      expect(result).toHaveProperty("logic");
      expect(result).toHaveProperty("theme");
      expect(result).toHaveProperty("settings");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
    });
  });

  describe("delete", () => {
    it("deletes form", async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({ data: { success: true } });

      const result = await formsApi.delete("123");

      expect(apiClient.delete).toHaveBeenCalledWith("/v1/forms/123/");
      expect(result).toEqual({ success: true });
    });
  });

  describe("duplicate", () => {
    it("duplicates form", async () => {
      const duplicatedForm = { id: "789", title: "Copy of Form", pages: [] };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: duplicatedForm });

      const result = await formsApi.duplicate("123");

      expect(apiClient.post).toHaveBeenCalledWith("/v1/forms/123/duplicate/");
      expect(result).toEqual(duplicatedForm);
    });
  });

  describe("publish", () => {
    it("publishes form without canary", async () => {
      const version = { id: "v1", version: 1, publishedAt: new Date() };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: version });

      const result = await formsApi.publish("123");

      expect(apiClient.post).toHaveBeenCalledWith("/v1/forms/123/publish/", undefined);
      expect(result).toEqual(version);
    });

    it("publishes form with canary percentage", async () => {
      const version = { id: "v2", version: 2, publishedAt: new Date() };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: version });

      const result = await formsApi.publish("123", { canary_percent: 25 });

      expect(apiClient.post).toHaveBeenCalledWith("/v1/forms/123/publish/", { canary_percent: 25 });
      expect(result).toEqual(version);
    });
  });

  describe("versions", () => {
    it("fetches form versions", async () => {
      const versions = [
        { id: "v1", version: 1, publishedAt: new Date() },
        { id: "v2", version: 2, publishedAt: new Date() },
      ];
      (apiClient.get as jest.Mock).mockResolvedValue({ data: versions });

      const result = await formsApi.versions("123");

      expect(apiClient.get).toHaveBeenCalledWith("/v1/forms/123/versions/");
      expect(result).toEqual(versions);
    });

    it("handles non-array response", async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: {} });

      const result = await formsApi.versions("123");

      expect(result).toEqual([]);
    });

    it("handles null response", async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: null });

      const result = await formsApi.versions("123");

      expect(result).toEqual([]);
    });
  });

  describe("rollback", () => {
    it("rolls back to specific version", async () => {
      const rolledBackForm = { id: "123", title: "Form at v1", pages: [] };
      (apiClient.post as jest.Mock).mockResolvedValue({ data: rolledBackForm });

      const result = await formsApi.rollback("123", "v1");

      expect(apiClient.post).toHaveBeenCalledWith("/v1/forms/123/rollback/", { version_id: "v1" });
      expect(result).toEqual(rolledBackForm);
    });
  });

  describe("import functions", () => {
    describe("validateImport", () => {
      it("validates typeform import", async () => {
        const response = { valid: true };
        (apiClient.post as jest.Mock).mockResolvedValue({ data: response });

        const result = await formsApi.validateImport({
          type: "typeform",
          source: "https://typeform.com/form/123",
        });

        expect(apiClient.post).toHaveBeenCalledWith("/v1/forms/import/validate/", {
          type: "typeform",
          source: "https://typeform.com/form/123",
        });
        expect(result).toEqual(response);
      });

      it("handles validation errors", async () => {
        const response = { valid: false, error: "Invalid URL" };
        (apiClient.post as jest.Mock).mockResolvedValue({ data: response });

        const result = await formsApi.validateImport({
          type: "google_forms",
          source: "invalid-url",
        });

        expect(result).toEqual(response);
      });
    });

    describe("previewImport", () => {
      it("previews import with credentials", async () => {
        const preview = { title: "Imported Form", questions: 10 };
        (apiClient.post as jest.Mock).mockResolvedValue({ data: { preview } });

        const result = await formsApi.previewImport({
          type: "typeform",
          source: "form-id",
          credentials: { apiKey: "key" },
        });

        expect(apiClient.post).toHaveBeenCalledWith("/v1/forms/import/preview/", {
          type: "typeform",
          source: "form-id",
          credentials: { apiKey: "key" },
        });
        expect(result).toEqual({ preview });
      });
    });

    describe("importForm", () => {
      it("imports form successfully", async () => {
        const response = { success: true, form_id: "new-123", message: "Import successful" };
        (apiClient.post as jest.Mock).mockResolvedValue({ data: response });

        const result = await formsApi.importForm({
          type: "google_forms",
          source: "form-url",
        });

        expect(apiClient.post).toHaveBeenCalledWith("/v1/forms/import/", {
          type: "google_forms",
          source: "form-url",
        });
        expect(result).toEqual(response);
      });

      it("handles import failure", async () => {
        const response = { success: false, message: "Import failed" };
        (apiClient.post as jest.Mock).mockResolvedValue({ data: response });

        const result = await formsApi.importForm({
          type: "typeform",
          source: "invalid",
        });

        expect(result).toEqual(response);
      });
    });

    describe("getImportRequirements", () => {
      it("gets typeform import requirements", async () => {
        const requirements = { needsApiKey: true, fields: ["apiKey"] };
        (apiClient.get as jest.Mock).mockResolvedValue({ data: requirements });

        const result = await formsApi.getImportRequirements("typeform");

        expect(apiClient.get).toHaveBeenCalledWith("/v1/forms/import/requirements/typeform/");
        expect(result).toEqual(requirements);
      });

      it("gets google forms import requirements", async () => {
        const requirements = { needsAuth: true, scopes: ["forms.read"] };
        (apiClient.get as jest.Mock).mockResolvedValue({ data: requirements });

        const result = await formsApi.getImportRequirements("google_forms");

        expect(apiClient.get).toHaveBeenCalledWith("/v1/forms/import/requirements/google_forms/");
        expect(result).toEqual(requirements);
      });
    });
  });

  describe("exported functions", () => {
    it("exports individual functions", () => {
      expect(getForm).toBe(formsApi.get);
      expect(updateForm).toBe(formsApi.update);
      expect(createForm).toBe(formsApi.create);
      expect(deleteForm).toBe(formsApi.delete);
      expect(listForms).toBe(formsApi.list);
    });
  });
});
