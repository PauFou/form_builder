import { test, expect } from "@playwright/test";

import { WebhookHelper } from "./helpers/webhook-helper";

test.describe("Simple Form Test (No Backend)", () => {
  let webhookHelper: WebhookHelper;

  test.beforeAll(async () => {
    // Initialize webhook helper
    webhookHelper = new WebhookHelper();

    // Wait for webhook receiver to be ready
    await webhookHelper.waitForReady();

    // Clear any existing webhooks
    await webhookHelper.clearWebhooks();
  });

  test("should verify frontend is running and webhook receiver works", async ({ page }) => {
    console.log("🌐 Testing frontend availability...");

    // Navigate to the app
    await page.goto("/");

    // Check if the page loads
    await expect(page).toHaveTitle(/Forms Platform|Form Builder/);
    console.log("✅ Frontend is running");

    // Test webhook receiver health
    console.log("🎣 Testing webhook receiver...");
    const isHealthy = await webhookHelper.checkHealth();
    expect(isHealthy).toBe(true);
    console.log("✅ Webhook receiver is healthy");

    // Send a test webhook directly
    console.log("📤 Sending test webhook...");
    const testPayload = {
      event: "test.webhook",
      timestamp: new Date().toISOString(),
      data: {
        message: "This is a test webhook from Playwright",
      },
    };

    const response = await fetch("http://localhost:9000/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forms-Timestamp": Date.now().toString(),
      },
      body: JSON.stringify(testPayload),
    });

    expect(response.ok).toBe(true);
    console.log("✅ Test webhook sent successfully");

    // Verify webhook was received
    const webhooks = await webhookHelper.getWebhooks();
    expect(webhooks.length).toBeGreaterThan(0);

    const lastWebhook = webhooks[webhooks.length - 1];
    expect(lastWebhook.body).toMatchObject(testPayload);
    console.log("✅ Webhook was received and stored correctly");
  });

  test("should navigate through the app pages", async ({ page }) => {
    // Test navigation without authentication
    console.log("🧭 Testing navigation...");

    // Go to home
    await page.goto("/");

    // Check for main navigation elements or landing page content
    const hasLoginLink =
      (await page
        .locator(
          'a[href="/login"], a[href="/auth/login"], button:has-text("Login"), button:has-text("Sign in")'
        )
        .count()) > 0;
    const hasSignupLink =
      (await page
        .locator(
          'a[href="/signup"], a[href="/auth/signup"], button:has-text("Sign up"), button:has-text("Get started"), button:has-text("Signup")'
        )
        .count()) > 0;
    const hasTestFormLink = (await page.locator('a[href="/test-form"]').count()) > 0;

    expect(hasLoginLink || hasSignupLink || hasTestFormLink).toBe(true);
    console.log("✅ Navigation elements found");

    // If there's a forms page accessible without auth, test it
    const response = await page.goto("/forms", { waitUntil: "domcontentloaded" });

    if (response?.status() === 200) {
      console.log("✅ Forms page accessible");
    } else {
      console.log("ℹ️  Forms page requires authentication (expected)");
    }
  });

  test("should have proper meta tags and accessibility", async ({ page }) => {
    console.log("♿ Testing accessibility basics...");

    await page.goto("/");

    // Check for viewport meta tag
    const viewport = await page.getAttribute('meta[name="viewport"]', "content");
    expect(viewport).toContain("width=device-width");

    // Check for lang attribute
    const lang = await page.getAttribute("html", "lang");
    expect(lang).toBeTruthy();

    // Check for main landmarks
    const main = await page.locator('main, [role="main"]').count();
    expect(main).toBeGreaterThan(0);

    console.log("✅ Basic accessibility checks passed");
  });

  test.afterAll(async () => {
    // Cleanup
    await webhookHelper.clearWebhooks();
  });
});

test.describe("Mock Form Submission (Frontend Only)", () => {
  test("should simulate form submission flow", async ({ page }) => {
    console.log("📝 Simulating form submission flow...");

    // Navigate to the test form page
    await page.goto("/test-form");

    // Wait for the form to load
    await expect(page.locator("h1")).toHaveText("Test Form");

    // Wait for React to hydrate and be ready
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000); // Give React time to hydrate

    // Listen to console messages for debugging
    page.on("console", (msg) => console.log(`Browser console: ${msg.text()}`));

    // Fill the form
    await page.fill('input[name="name"]', "Test User");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('textarea[name="message"]', "This is a test message");

    // Ensure the form data is set by checking the React state via page evaluation
    await page.waitForFunction(() => {
      const form = document.querySelector("form");
      return form !== null;
    });

    // Submit the form normally - button click should trigger React handler
    console.log("🔄 Clicking submit button...");
    await page.click('button[type="submit"]');

    // Wait for either success message or error, with increased timeout
    try {
      await expect(page.locator("h2")).toHaveText("Thank you for your submission!", {
        timeout: 15000,
      });
      console.log("✅ Form submitted successfully");
    } catch (error) {
      console.log("❌ Success message not found, checking page content...");
      const pageContent = await page.textContent("body");
      console.log("Page content preview:", pageContent?.substring(0, 500));
      throw error;
    }

    // Test completed successfully - form submission flow works
    console.log("✅ E2E Form submission test completed successfully");
  });
});
