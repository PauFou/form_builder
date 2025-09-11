import { AnalyticsService } from "../src/services/analytics-service";

describe("AnalyticsService", () => {
  let analytics: AnalyticsService;

  beforeEach(() => {
    analytics = new AnalyticsService({
      formId: "test-form",
      apiUrl: "http://localhost:8000",
      apiKey: "test-key",
      batchSize: 2,
      flushInterval: 100,
    });
  });

  afterEach(() => {
    analytics.destroy();
    jest.clearAllMocks();
  });

  describe("event tracking", () => {
    it("should track form view event", () => {
      const trackSpy = jest.spyOn(analytics, "track");

      analytics.trackView();

      expect(trackSpy).toHaveBeenCalledWith("form_view", {
        form_id: "test-form",
        timestamp: expect.any(String),
      });
    });

    it("should track step events", () => {
      const trackSpy = jest.spyOn(analytics, "track");

      analytics.trackStep("block1", 0);

      expect(trackSpy).toHaveBeenCalledWith("step_view", {
        form_id: "test-form",
        block_id: "block1",
        step: 0,
        timestamp: expect.any(String),
      });
    });

    it("should track field change events", () => {
      const trackSpy = jest.spyOn(analytics, "track");

      analytics.trackFieldChange("email", "test@example.com");

      expect(trackSpy).toHaveBeenCalledWith("field_change", {
        form_id: "test-form",
        field: "email",
        has_value: true,
        timestamp: expect.any(String),
      });
    });

    it("should track form completion", () => {
      const trackSpy = jest.spyOn(analytics, "track");

      analytics.trackCompletion("sub123");

      expect(trackSpy).toHaveBeenCalledWith("form_complete", {
        form_id: "test-form",
        submission_id: "sub123",
        timestamp: expect.any(String),
      });
    });
  });

  describe("event batching", () => {
    it("should batch events until flush threshold", () => {
      // Mock fetch to avoid actual API calls
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      analytics.track("test_event", { data: "test1" });
      analytics.track("test_event", { data: "test2" });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should flush events on destroy", () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      analytics.track("test_event", { data: "test" });
      analytics.destroy();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("should handle failed API requests gracefully", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      analytics.track("test_event", { data: "test" });
      analytics.track("test_event", { data: "test2" });

      // Wait for flush
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(consoleSpy).toHaveBeenCalledWith("Failed to send analytics:", expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
