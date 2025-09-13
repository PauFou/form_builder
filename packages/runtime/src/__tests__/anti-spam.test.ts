import { renderHook, act } from "@testing-library/react";
import { AntiSpamService } from "../services/anti-spam-service";
import { useAntiSpam } from "../hooks/use-anti-spam";

// Mock timers for testing
jest.useFakeTimers();

describe("AntiSpamService", () => {
  let service: AntiSpamService;

  beforeEach(() => {
    // Create a new instance for each test
    service = new (AntiSpamService as any)();
    // Set up mock time starting at 0
    service.setCurrentTime(0);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Honeypot Protection", () => {
    it("should create a honeypot field with proper attributes", () => {
      const honeypotField = service.createHoneypotField();

      expect(honeypotField.type).toBe("text");
      expect(honeypotField.name).toBe("_website_url");
      expect(honeypotField.tabIndex).toBe(-1);
      expect(honeypotField.getAttribute("aria-hidden")).toBe("true");
      expect(honeypotField.getAttribute("autocomplete")).toBe("off");
      expect(honeypotField.style.position).toBe("absolute");
      expect(honeypotField.style.opacity).toBe("0");
    });

    it("should detect when honeypot is filled", async () => {
      const sessionId = "test-session";
      service.initializeFormSession(sessionId);

      // Simulate bot filling honeypot
      service.updateHoneypotValue(sessionId, "http://spam.com");

      const result = await service.validate(sessionId);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("honeypot_filled");
    });

    it("should pass validation when honeypot is empty", async () => {
      const sessionId = "test-session";

      // Set up time context to avoid time trap issues
      service.setCurrentTime(0);
      service.initializeFormSession(sessionId);
      service.setCurrentTime(5000); // Set time after minimum completion time

      const result = await service.validate(sessionId);
      expect(result.isValid).toBe(true);
    });
  });

  describe("Time Trap Protection", () => {
    it("should detect submissions that are too fast", async () => {
      const sessionId = "test-session";

      // Ensure time trap is enabled
      service.updateConfig({
        timeTrap: {
          enabled: true,
          minCompletionTimeMs: 3000,
        },
      });

      service.setCurrentTime(0);
      service.initializeFormSession(sessionId);

      // Submit immediately - advance time just slightly but still too fast
      service.setCurrentTime(500); // 0.5 seconds, less than 3s minimum

      const result = await service.validate(sessionId);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("too_fast");
    });

    it("should allow submissions after minimum time", async () => {
      const sessionId = "test-session";

      // Ensure time trap is enabled
      service.updateConfig({
        timeTrap: {
          enabled: true,
          minCompletionTimeMs: 3000,
        },
      });

      service.setCurrentTime(0);
      service.initializeFormSession(sessionId);

      // Advance time by 4 seconds (more than default 3s minimum)
      service.setCurrentTime(4000);

      const result = await service.validate(sessionId);
      expect(result.isValid).toBe(true);
    });

    it("should respect custom minimum completion time", async () => {
      const sessionId = "test-session";

      // Update config with custom time
      service.updateConfig({
        timeTrap: {
          enabled: true,
          minCompletionTimeMs: 5000, // 5 seconds
        },
      });

      service.setCurrentTime(0);
      service.initializeFormSession(sessionId);

      // Advance by 4 seconds (less than 5s minimum)
      service.setCurrentTime(4000);

      const result = await service.validate(sessionId);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("too_fast");

      // Advance by another 2 seconds (total 6s)
      service.setCurrentTime(6000);

      const result2 = await service.validate(sessionId);
      expect(result2.isValid).toBe(true);
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce IP-based rate limits", async () => {
      const sessionId = "test-session";
      const testIP = "192.168.1.1";

      // Set up time context to avoid time trap issues
      service.setCurrentTime(0);
      service.initializeFormSession(sessionId);
      service.setCurrentTime(5000); // Set time after minimum completion time

      // Make 10 requests (the default limit)
      for (let i = 0; i < 10; i++) {
        const result = await service.validate(sessionId, { ip: testIP });
        expect(result.isValid).toBe(true);
      }

      // 11th request should be blocked
      const result = await service.validate(sessionId, { ip: testIP });
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("rate_limit_ip");
    });

    it("should enforce form-based rate limits", async () => {
      const sessionId = "test-session";
      const formId = "test-form";

      // Set up time context to avoid time trap issues
      service.setCurrentTime(0);
      service.initializeFormSession(sessionId);
      service.setCurrentTime(5000); // Set time after minimum completion time

      // Update config to use lower limit for testing
      service.updateConfig({
        rateLimit: {
          enabled: true,
          byIP: { maxRequests: 10, windowMs: 60000 },
          byFormId: { maxRequests: 5, windowMs: 60000 }, // Lower limit
        },
      });

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        const result = await service.validate(`session-${i}`, { formId });
        expect(result.isValid).toBe(true);
      }

      // 6th request should be blocked
      const result = await service.validate("session-6", { formId });
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("rate_limit_form");
    });

    it("should reset rate limits after time window", async () => {
      const sessionId = "test-session";
      const testIP = "192.168.1.1";

      // Update config with shorter window for testing
      service.updateConfig({
        rateLimit: {
          enabled: true,
          byIP: { maxRequests: 2, windowMs: 1000 }, // 1 second window
          byFormId: { maxRequests: 50, windowMs: 60000 },
        },
      });

      // Start at time 0
      service.setCurrentTime(0);
      service.initializeFormSession(sessionId);
      service.setCurrentTime(5000); // Set time after minimum completion time to avoid time trap

      // Make 2 requests
      await service.validate(sessionId, { ip: testIP });
      await service.validate("session-2", { ip: testIP });

      // 3rd request should be blocked
      let result = await service.validate("session-3", { ip: testIP });
      expect(result.isValid).toBe(false);

      // Advance time by 1.1 seconds from start of rate limit window
      service.setCurrentTime(5000 + 1100);

      // Should be allowed now
      result = await service.validate("session-4", { ip: testIP });
      expect(result.isValid).toBe(true);
    });

    it("should skip rate limiting when requested", async () => {
      const sessionId = "test-session";
      const testIP = "192.168.1.1";

      service.updateConfig({
        rateLimit: {
          enabled: true,
          byIP: { maxRequests: 1, windowMs: 60000 },
          byFormId: { maxRequests: 50, windowMs: 60000 },
        },
      });

      // Set up time context to avoid time trap issues
      service.setCurrentTime(0);
      service.initializeFormSession(sessionId);
      service.setCurrentTime(5000); // Set time after minimum completion time

      // Make multiple requests with skipRateLimit
      for (let i = 0; i < 5; i++) {
        const result = await service.validate(sessionId, {
          ip: testIP,
          skipRateLimit: true,
        });
        expect(result.isValid).toBe(true);
      }
    });
  });

  describe("Session Management", () => {
    it("should clear session data", () => {
      const sessionId = "test-session";
      service.initializeFormSession(sessionId);
      service.updateHoneypotValue(sessionId, "test");

      service.clearSession(sessionId);

      // Should pass validation after clearing
      const result = service.validate(sessionId);
      expect(result).resolves.toMatchObject({ isValid: true });
    });

    it("should track statistics", async () => {
      const sessionId = "test-session";
      service.initializeFormSession(sessionId);

      // Make some submissions
      await service.validate(sessionId, { ip: "192.168.1.1", formId: "form1" });
      await service.validate("session-2", { ip: "192.168.1.2", formId: "form1" });

      const stats = service.getStatistics();
      expect(stats.totalAttempts).toBeGreaterThan(0);
      expect(Object.keys(stats.recentAttempts).length).toBeGreaterThan(0);
    });
  });

  describe("Multiple Protection Layers", () => {
    it("should check all protections in order", async () => {
      const sessionId = "test-session";

      // Ensure time trap is enabled
      service.updateConfig({
        timeTrap: {
          enabled: true,
          minCompletionTimeMs: 3000,
        },
      });

      service.setCurrentTime(0);
      service.initializeFormSession(sessionId);

      // Fill honeypot
      service.updateHoneypotValue(sessionId, "spam");

      // Should fail on honeypot before checking time trap
      const result = await service.validate(sessionId);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("honeypot_filled");

      // Clear honeypot
      service.updateHoneypotValue(sessionId, "");

      // Advance time slightly but still too fast
      service.setCurrentTime(1000); // 1 second, less than 3s minimum

      // Should now fail on time trap
      const result2 = await service.validate(sessionId);
      expect(result2.isValid).toBe(false);
      expect(result2.reason).toBe("too_fast");
    });
  });
});

describe("useAntiSpam Hook", () => {
  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  it("should initialize anti-spam protection", () => {
    const { result } = renderHook(() =>
      useAntiSpam({
        enabled: true,
        formId: "test-form",
      })
    );

    expect(result.current.validateAntiSpam).toBeDefined();
    expect(result.current.getCompletionTime).toBeDefined();
    expect(result.current.getStatistics).toBeDefined();
    expect(result.current.sessionId).toBeDefined();
  });

  it("should add honeypot field to form", async () => {
    // Create a form element
    const form = document.createElement("form");
    form.className = "fr-form";
    document.body.appendChild(form);

    renderHook(() =>
      useAntiSpam({
        enabled: true,
        honeypotField: "_test_honeypot",
      })
    );

    // Wait for honeypot to be added
    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    const honeypotField = form.querySelector("#_test_honeypot");
    expect(honeypotField).toBeTruthy();
    expect(honeypotField?.getAttribute("aria-hidden")).toBe("true");
  });

  it("should validate anti-spam measures", async () => {
    const { result } = renderHook(() =>
      useAntiSpam({
        enabled: true,
        minCompletionTime: 2000,
      })
    );

    // Initial validation should fail (too fast)
    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateAntiSpam();
    });

    expect(validationResult).toMatchObject({
      isValid: false,
      reason: "too_fast",
    });

    // Advance time
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Should pass now
    await act(async () => {
      validationResult = await result.current.validateAntiSpam();
    });

    expect(validationResult).toMatchObject({
      isValid: true,
    });
  });

  it("should return completion time", () => {
    const { result } = renderHook(() => useAntiSpam({ enabled: true }));

    // Initially should be 0 or very small
    expect(result.current.getCompletionTime()).toBeLessThan(100);

    // Advance time
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should reflect elapsed time
    expect(result.current.getCompletionTime()).toBeGreaterThanOrEqual(5000);
  });

  it("should skip validation when disabled", async () => {
    const { result } = renderHook(() => useAntiSpam({ enabled: false }));

    const validationResult = await result.current.validateAntiSpam();
    expect(validationResult).toEqual({ isValid: true });
  });

  it("should clean up on unmount", () => {
    const form = document.createElement("form");
    form.className = "fr-form";
    document.body.appendChild(form);

    const { unmount } = renderHook(() =>
      useAntiSpam({
        enabled: true,
        honeypotField: "_cleanup_test",
      })
    );

    // Wait for honeypot to be added
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(form.querySelector("#_cleanup_test")).toBeTruthy();

    // Unmount
    unmount();

    // Honeypot should be removed
    expect(form.querySelector("#_cleanup_test")).toBeFalsy();
  });
});
