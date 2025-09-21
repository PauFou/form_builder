import { test, expect } from "@playwright/test";

test.describe("Form Builder Complete Flow", () => {
  let formId: string;
  const formTitle = `E2E Test Form ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/auth/login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "TestPass123!");
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("text=Your Forms")).toBeVisible();
  });

  test("should create, configure, and publish a form", async ({ page }) => {
    // Create new form
    await page.click('button:has-text("Create Form")');
    await page.fill('input[name="title"]', formTitle);
    await page.fill('textarea[name="description"]', "E2E test form description");
    await page.click('button:has-text("Create")');

    // Wait for form builder
    await expect(page).toHaveURL(/\/forms\/.*\/edit/);
    formId = page.url().match(/forms\/([^/]+)\/edit/)?.[1] || "";

    // Add fields using drag and drop
    const canvas = page.locator('[data-testid="form-canvas"]');

    // Drag short text field
    const shortTextField = page.locator('[data-block-type="short_text"]').first();
    await shortTextField.dragTo(canvas);

    // Configure field
    await page.click('[data-testid="block-settings"]');
    await page.fill('input[name="question"]', "What is your name?");
    await page.check('input[name="required"]');

    // Add email field
    const emailField = page.locator('[data-block-type="email"]');
    await emailField.dragTo(canvas);
    await page.fill('input[name="question"]', "What is your email?");
    await page.check('input[name="required"]');

    // Add rating field
    const ratingField = page.locator('[data-block-type="rating"]');
    await ratingField.dragTo(canvas);
    await page.fill('input[name="question"]', "How satisfied are you?");

    // Add logic
    await page.click('button:has-text("Logic")');
    await page.click('button:has-text("Add Rule")');

    // Configure logic rule
    await page.selectOption('[name="field"]', "rating");
    await page.selectOption('[name="operator"]', "less_than");
    await page.fill('[name="value"]', "3");
    await page.selectOption('[name="action"]', "show_field");
    await page.selectOption('[name="targetField"]', "comments");

    // Save form
    await page.click('button:has-text("Save")');
    await expect(page.locator(".toast-success")).toHaveText("Form saved");

    // Preview form
    await page.click('button:has-text("Preview")');
    const previewPage = await page.waitForEvent("popup");
    await expect(previewPage).toHaveURL(/\/preview\/.*/);
    await expect(previewPage.locator("text=What is your name?")).toBeVisible();
    await previewPage.close();

    // Publish form
    await page.click('button:has-text("Publish")');
    await page.click('button:has-text("Confirm Publish")');
    await expect(page.locator(".toast-success")).toHaveText("Form published successfully");
  });

  test("should submit form and track analytics", async ({ page, context }) => {
    // Navigate to published form
    await page.goto(`/forms/${formId}/view`);

    // Fill form
    await page.fill('input[name="name"]', "John E2E Tester");
    await page.fill('input[name="email"]', "john.e2e@example.com");

    // Click rating
    await page.click('[data-rating="4"]');

    // Submit form
    await page.click('button:has-text("Submit")');

    // Verify submission success
    await expect(page.locator(".success-message")).toHaveText("Thank you for your submission!");

    // Check analytics were tracked
    const analyticsRequests = await page.evaluate(() => {
      // Get analytics calls from window object (if exposed)
      return window.__analyticsEvents || [];
    });

    expect(analyticsRequests).toContainEqual(
      expect.objectContaining({
        event_type: "form_view",
      })
    );

    expect(analyticsRequests).toContainEqual(
      expect.objectContaining({
        event_type: "form_submit",
      })
    );
  });

  test("should view submissions and export data", async ({ page }) => {
    // Navigate to submissions
    await page.goto(`/forms/${formId}/submissions`);

    // Wait for data to load
    await expect(page.locator('[data-testid="submissions-table"]')).toBeVisible();

    // Verify submission exists
    await expect(page.locator("text=John E2E Tester")).toBeVisible();
    await expect(page.locator("text=john.e2e@example.com")).toBeVisible();

    // Filter submissions
    await page.fill('input[placeholder="Search responses..."]', "john");
    await page.keyboard.press("Enter");

    // Verify filter works
    await expect(page.locator('[data-testid="submissions-table"] tbody tr')).toHaveCount(1);

    // Export CSV
    await page.click('button:has-text("Export CSV")');

    // Wait for download
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click('button:has-text("Confirm Export")'),
    ]);

    // Verify download
    expect(download.suggestedFilename()).toMatch(/submissions.*\.csv/);
  });

  test("should handle partial submissions", async ({ page }) => {
    // Navigate to form
    await page.goto(`/forms/${formId}/view`);

    // Fill partial data
    await page.fill('input[name="name"]', "Partial User");

    // Navigate away (trigger autosave)
    await page.goto("/");

    // Return to form
    await page.goto(`/forms/${formId}/view`);

    // Verify data was saved
    await expect(page.locator('input[name="name"]')).toHaveValue("Partial User");

    // Complete submission
    await page.fill('input[name="email"]', "partial@example.com");
    await page.click('[data-rating="5"]');
    await page.click('button:has-text("Submit")');

    await expect(page.locator(".success-message")).toBeVisible();
  });

  test("should validate form fields", async ({ page }) => {
    await page.goto(`/forms/${formId}/view`);

    // Try to submit without required fields
    await page.click('button:has-text("Submit")');

    // Check validation messages
    await expect(page.locator("text=Name is required")).toBeVisible();
    await expect(page.locator("text=Email is required")).toBeVisible();

    // Test email validation
    await page.fill('input[name="email"]', "invalid-email");
    await page.click('button:has-text("Submit")');

    await expect(page.locator("text=Please enter a valid email")).toBeVisible();
  });

  test("should handle form logic correctly", async ({ page }) => {
    await page.goto(`/forms/${formId}/view`);

    // Fill required fields
    await page.fill('input[name="name"]', "Logic Test User");
    await page.fill('input[name="email"]', "logic@example.com");

    // Select low rating (should trigger logic to show comments)
    await page.click('[data-rating="2"]');

    // Verify comments field appears
    await expect(page.locator('textarea[name="comments"]')).toBeVisible();

    // Change to high rating
    await page.click('[data-rating="5"]');

    // Verify comments field is hidden
    await expect(page.locator('textarea[name="comments"]')).not.toBeVisible();
  });

  test("should track analytics events correctly", async ({ page, context }) => {
    // Intercept analytics calls
    const analyticsRequests: any[] = [];

    await page.route("**/analytics/events", async (route, request) => {
      if (request.method() === "POST") {
        const postData = request.postData();
        if (postData) {
          analyticsRequests.push(JSON.parse(postData));
        }
      }
      await route.continue();
    });

    // Visit form
    await page.goto(`/forms/${formId}/view`);

    // Interact with form
    await page.focus('input[name="name"]');
    await page.fill('input[name="name"]', "Analytics Test");

    await page.focus('input[name="email"]');
    await page.fill('input[name="email"]', "analytics@test.com");

    // Wait for analytics to be sent
    await page.waitForTimeout(1000);

    // Verify analytics events
    const eventTypes = analyticsRequests.map((req) => req.event_type);

    expect(eventTypes).toContain("form_view");
    expect(eventTypes).toContain("field_focus");
    expect(eventTypes).toContain("field_change");
  });

  test("should handle webhook deliveries", async ({ page }) => {
    // Setup webhook
    await page.goto(`/forms/${formId}/settings`);
    await page.click('tab:has-text("Webhooks")');

    await page.click('button:has-text("Add Webhook")');
    await page.fill('input[name="url"]', "https://httpbin.org/post");
    await page.check('input[value="submission.created"]');
    await page.click('button:has-text("Save Webhook")');

    // Submit form
    await page.goto(`/forms/${formId}/view`);
    await page.fill('input[name="name"]', "Webhook Test User");
    await page.fill('input[name="email"]', "webhook@test.com");
    await page.click('[data-rating="5"]');
    await page.click('button:has-text("Submit")');

    // Check webhook delivery status
    await page.goto(`/forms/${formId}/webhooks`);
    await expect(page.locator("text=Delivery History")).toBeVisible();

    // Wait for delivery to appear
    await page.waitForSelector('[data-testid="webhook-delivery"]', { timeout: 10000 });

    // Verify delivery status
    const deliveryStatus = await page
      .locator('[data-testid="delivery-status"]')
      .first()
      .textContent();
    expect(["success", "pending"]).toContain(deliveryStatus);
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete test form
    if (formId) {
      await request.delete(`/api/v1/forms/${formId}`, {
        headers: {
          Authorization: `Bearer ${process.env.TEST_API_TOKEN}`,
        },
      });
    }
  });
});

test.describe("Form Builder Performance", () => {
  test("should handle large forms efficiently", async ({ page }) => {
    await page.goto("/forms/new");

    // Measure performance while adding many fields
    const startTime = Date.now();

    // Add 50 fields
    for (let i = 0; i < 50; i++) {
      const fieldType = ["short_text", "email", "number", "select"][i % 4];
      await page.click(`[data-block-type="${fieldType}"]`);
      await page.fill('input[name="question"]', `Question ${i + 1}`);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Should complete within reasonable time (30 seconds for 50 fields)
    expect(totalTime).toBeLessThan(30000);

    // Verify all fields are rendered
    const fieldCount = await page.locator('[data-testid="form-field"]').count();
    expect(fieldCount).toBe(50);

    // Test scrolling performance
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    // No performance warnings
    const performanceWarnings = await page.evaluate(() => {
      return window.__performanceWarnings || [];
    });

    expect(performanceWarnings).toHaveLength(0);
  });

  test("should handle concurrent submissions", async ({ browser }) => {
    // Create multiple browser contexts for concurrent testing
    const contexts = await Promise.all(
      Array(5)
        .fill(null)
        .map(() => browser.newContext())
    );

    const pages = await Promise.all(contexts.map((context) => context.newPage()));

    // Submit forms concurrently
    const submissions = await Promise.all(
      pages.map(async (page, index) => {
        await page.goto(`/forms/${formId}/view`);

        await page.fill('input[name="name"]', `Concurrent User ${index}`);
        await page.fill('input[name="email"]', `concurrent${index}@test.com`);
        await page.click('[data-rating="5"]');

        const response = await page.waitForResponse(
          (response) => response.url().includes("/submissions") && response.status() === 201
        );

        return response.ok();
      })
    );

    // All submissions should succeed
    expect(submissions.every((success) => success)).toBe(true);

    // Cleanup
    await Promise.all(contexts.map((context) => context.close()));
  });
});
