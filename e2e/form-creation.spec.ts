import { test, expect } from "@playwright/test";

import { AuthHelper } from "./helpers/auth-helper";

test.describe("Form Creation", () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    // Create test user and login
    await authHelper.ensureTestUser();
  });

  test("should create a new form", async ({ page }) => {
    // Navigate to dashboard page
    await page.goto("/dashboard");

    // Click create button
    await page.click('button:has-text("Create Form")');

    // Fill form details
    await page.fill('[name="title"]', "E2E Test Form");
    await page.fill('[name="description"]', "This is a test form created by E2E tests");

    // Submit
    await page.click('button:has-text("Create")');

    // Should redirect to form editor
    await expect(page).toHaveURL(/\/forms\/.*\/edit/);

    // Should show the form title
    await expect(page.locator("h1")).toContainText("E2E Test Form");
  });

  test("should add fields to form", async ({ page }) => {
    // Create a form first
    await page.goto("/dashboard");
    await page.click('button:has-text("Create Form")');
    await page.fill('[name="title"]', "Field Test Form");
    await page.click('button:has-text("Create")');

    // Add a text field
    await page.click('button:has-text("Add Field")');
    await page.click('[data-field-type="text"]');
    await page.fill('[placeholder="Question title"]', "What is your name?");

    // Add an email field
    await page.click('button:has-text("Add Field")');
    await page.click('[data-field-type="email"]');
    await page.fill('[placeholder="Question title"]', "What is your email?");

    // Save form
    await page.click('button:has-text("Save")');

    // Verify fields were added
    await expect(page.locator("text=What is your name?")).toBeVisible();
    await expect(page.locator("text=What is your email?")).toBeVisible();
  });

  test("should preview form", async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.click('.card:first-child button:has-text("Edit")');

    // Click preview button
    await page.click('button:has-text("Preview")');

    // Should open preview in new tab
    const [previewPage] = await Promise.all([
      page.waitForEvent("popup"),
      page.click('a[target="_blank"]:has-text("Preview")'),
    ]);

    // Preview should load
    await previewPage.waitForLoadState();
    await expect(previewPage).toHaveURL(/\/preview$/);
  });
});

test.describe("Form Submission", () => {
  test("should submit form successfully", async ({ page }) => {
    // Navigate to a public form
    await page.goto("/f/sample-form");

    // Fill form fields
    await page.fill('[name="name"]', "John Doe");
    await page.fill('[name="email"]', "john@example.com");
    await page.fill('[name="message"]', "This is a test submission");

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator("text=Thank you for your submission")).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    // Navigate to a public form
    await page.goto("/f/sample-form");

    // Try to submit without filling required fields
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator("text=This field is required")).toBeVisible();
  });

  test("should save partial submission", async ({ page }) => {
    // Navigate to a multi-step form
    await page.goto("/f/multi-step-form");

    // Fill first step
    await page.fill('[name="firstName"]', "John");
    await page.fill('[name="lastName"]', "Doe");

    // Go to next step
    await page.click('button:has-text("Next")');

    // Reload page
    await page.reload();

    // Should restore saved data
    await expect(page.locator('[name="firstName"]')).toHaveValue("John");
    await expect(page.locator('[name="lastName"]')).toHaveValue("Doe");
  });
});

test.describe("Accessibility", () => {
  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/f/sample-form");

    // Tab through form
    await page.keyboard.press("Tab");
    await expect(page.locator('[name="name"]')).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator('[name="email"]')).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator('[name="message"]')).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test("should have proper ARIA labels", async ({ page }) => {
    await page.goto("/f/sample-form");

    // Check for ARIA labels
    await expect(page.locator('[aria-label="Name"]')).toBeVisible();
    await expect(page.locator('[aria-label="Email address"]')).toBeVisible();
    await expect(page.locator('[aria-label="Your message"]')).toBeVisible();
  });

  test("should announce errors to screen readers", async ({ page }) => {
    await page.goto("/f/sample-form");

    // Submit without filling required field
    await page.click('button[type="submit"]');

    // Error should have role="alert"
    await expect(page.locator('[role="alert"]')).toContainText("This field is required");
  });
});

test.describe("Performance", () => {
  test("should load form quickly", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/f/sample-form");
    await page.waitForLoadState("domcontentloaded");

    const loadTime = Date.now() - startTime;

    // Form should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test("should handle large forms efficiently", async ({ page }) => {
    // Navigate to a form with many fields
    await page.goto("/f/large-form-100-fields");

    // Measure interaction responsiveness
    const startTime = Date.now();
    await page.fill('[name="field_1"]', "Test value");
    const interactionTime = Date.now() - startTime;

    // Interaction should be responsive (under 100ms)
    expect(interactionTime).toBeLessThan(100);
  });
});
