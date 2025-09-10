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
        .locator('a[href="/login"], button:has-text("Login"), button:has-text("Sign in")')
        .count()) > 0;
    const hasSignupLink =
      (await page
        .locator('a[href="/signup"], button:has-text("Sign up"), button:has-text("Get started")')
        .count()) > 0;

    expect(hasLoginLink || hasSignupLink).toBe(true);
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

    // Create a mock form page if the actual form page requires auth
    await page.goto("/");

    // Use page.evaluate to create a simple form
    await page.evaluate(() => {
      // Create a simple form in the DOM
      const form = document.createElement("form");
      form.id = "test-form";
      form.innerHTML = `
        <h2>Test Form</h2>
        <input type="text" name="name" placeholder="Your name" required>
        <input type="email" name="email" placeholder="Your email" required>
        <textarea name="message" placeholder="Your message"></textarea>
        <button type="submit">Submit</button>
      `;

      // Add submit handler
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Send to webhook receiver
        await fetch("http://localhost:9000/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Forms-Timestamp": Date.now().toString(),
          },
          body: JSON.stringify({
            event: "form.submitted",
            form_id: "test-form",
            data: data,
          }),
        });

        // Show success message
        form.innerHTML = "<h2>Thank you for your submission!</h2>";
      });

      // Replace page content
      document.body.innerHTML = "";
      document.body.appendChild(form);
    });

    // Fill the form
    await page.fill('input[name="name"]', "Test User");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('textarea[name="message"]', "This is a test message");

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator("h2")).toHaveText("Thank you for your submission!");
    console.log("✅ Form submitted successfully");

    // Verify webhook was received
    const webhookHelper = new WebhookHelper();
    const webhook = await webhookHelper.waitForWebhook({
      timeout: 5000,
      predicate: (w) => w.body?.form_id === "test-form",
    });

    expect(webhook.body.data).toMatchObject({
      name: "Test User",
      email: "test@example.com",
      message: "This is a test message",
    });
    console.log("✅ Form data received via webhook");
  });
});
