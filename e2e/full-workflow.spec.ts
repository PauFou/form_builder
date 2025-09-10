import path from "path";

import { test, expect } from "@playwright/test";

import { WebhookHelper } from "./helpers/webhook-helper";
import { AuthHelper } from "./helpers/auth-helper";
import { FormHelper } from "./helpers/form-helper";

test.describe("Full Form Workflow with Webhook", () => {
  let webhookHelper: WebhookHelper;
  let authHelper: AuthHelper;
  let formHelper: FormHelper;
  let formId: string;
  let publicUrl: string;

  test.beforeAll(async () => {
    // Initialize webhook helper
    webhookHelper = new WebhookHelper();

    // Wait for webhook receiver to be ready
    await webhookHelper.waitForReady();

    // Clear any existing webhooks
    await webhookHelper.clearWebhooks();
  });

  test.beforeEach(async ({ page }) => {
    // Initialize helpers
    authHelper = new AuthHelper(page);
    formHelper = new FormHelper(page);

    // Ensure test user exists and login
    await authHelper.ensureTestUser();
  });

  test("should create, publish, submit form and receive webhook", async ({ page }) => {
    // Step 1: Create a new form
    console.log("📝 Creating new form...");
    formId = await formHelper.createForm(
      "E2E Test Form - Webhook",
      "Testing form creation, submission, and webhook delivery"
    );
    expect(formId).toBeTruthy();
    console.log(`✅ Form created with ID: ${formId}`);

    // Step 2: Add fields to the form
    console.log("🔧 Adding form fields...");

    // Add text field
    await formHelper.addField({
      type: "text",
      title: "Your Name",
      description: "Please enter your full name",
      required: true,
      placeholder: "John Doe",
    });

    // Add file upload field
    await formHelper.addField({
      type: "file",
      title: "Upload Document",
      description: "Please upload a PDF or image file",
      required: true,
    });

    // Add signature field
    await formHelper.addField({
      type: "signature",
      title: "Your Signature",
      description: "Please sign below",
      required: true,
    });

    console.log("✅ Fields added successfully");

    // Step 3: Configure webhook
    console.log("🔗 Configuring webhook...");
    await formHelper.configureWebhook(formId, "http://localhost:9000/webhook");
    console.log("✅ Webhook configured");

    // Step 4: Publish the form
    console.log("🚀 Publishing form...");
    publicUrl = await formHelper.publishForm();
    expect(publicUrl).toContain("/f/");
    console.log(`✅ Form published at: ${publicUrl}`);

    // Step 5: Clear webhooks before submission
    await webhookHelper.clearWebhooks();

    // Step 6: Open form in new context (simulate end user)
    console.log("👤 Opening form as end user...");
    const context = await page.context().browser()?.newContext();
    if (!context) throw new Error("Failed to create new context");

    const userPage = await context.newPage();

    try {
      // Create test file
      const testFilePath = path.join(__dirname, "fixtures", "test-document.pdf");

      // Fill and submit the form
      console.log("✍️ Filling and submitting form...");
      await formHelper.fillAndSubmitForm.call({ page: userPage }, publicUrl, {
        name: "John Doe",
        file: testFilePath,
        signature: true, // Will be drawn automatically
      });
      console.log("✅ Form submitted successfully");

      // Step 7: Wait for webhook
      console.log("⏳ Waiting for webhook...");
      const webhook = await webhookHelper.waitForWebhook({
        timeout: 30000,
        predicate: (w) => w.body?.form_id === formId,
      });

      expect(webhook).toBeTruthy();
      console.log("✅ Webhook received!");

      // Step 8: Verify webhook content
      console.log("🔍 Verifying webhook content...");
      expect(webhook.body).toMatchObject({
        form_id: formId,
        event: "submission.created",
        data: expect.objectContaining({
          answers: expect.objectContaining({
            name: "John Doe",
          }),
        }),
      });

      // Verify signature
      const signatureValid = webhookHelper.verifySignature(webhook);
      expect(signatureValid).toBe(true);
      console.log("✅ Webhook signature valid");

      // Verify file was uploaded
      expect(webhook.body.data.answers).toHaveProperty("file");
      expect(webhook.body.data.answers.file).toBeTruthy();
      console.log("✅ File upload confirmed");

      // Verify signature was captured
      expect(webhook.body.data.answers).toHaveProperty("signature");
      expect(webhook.body.data.answers.signature).toBeTruthy();
      console.log("✅ Signature captured");
    } finally {
      await userPage.close();
      await context.close();
    }
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Delete the form if created
    if (formId) {
      try {
        await page.goto(`/forms/${formId}/settings`);
        await page.click('button:has-text("Delete Form")');
        await page.click('button:has-text("Confirm Delete")');
        console.log("🗑️ Form deleted");
      } catch (error) {
        console.error("Failed to delete form:", error);
      }
    }
  });

  test.afterAll(async () => {
    // Final cleanup
    await webhookHelper.clearWebhooks();
  });
});

// Test for webhook retry mechanism
test.describe("Webhook Retry Mechanism", () => {
  test.skip("should retry failed webhook delivery", async () => {
    // This test would require simulating webhook failures
    // and verifying the retry mechanism works correctly
    // Skipped for now as it requires more complex setup
  });
});

// Test for flakiness handling
test.describe.configure({ retries: 2 });

test("should handle network delays gracefully", async ({ page }) => {
  // Add test for handling slow network conditions
  await page.route("**/*", (route) => {
    setTimeout(() => route.continue(), 100); // Add 100ms delay
  });

  // Run a simplified version of the workflow
  const authHelper = new AuthHelper(page);
  await authHelper.ensureTestUser();

  // Navigate to forms page
  await page.goto("/forms");

  // Verify page loaded despite delays
  await expect(page.locator("h1")).toContainText("Forms");
});
