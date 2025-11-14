import { test, expect } from "@playwright/test";

/**
 * Complete Form Builder Workflow E2E Test
 *
 * This test covers the entire user journey:
 * 1. Authentication (signup/login)
 * 2. Form creation
 * 3. Adding and configuring blocks
 * 4. Publishing the form
 * 5. Viewing the published form
 * 6. Submitting a response
 * 7. Viewing submissions
 */

test.describe("Complete Form Builder Workflow", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";
  const formTitle = `Test Form ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto("http://localhost:3301");
  });

  test("complete user workflow from signup to form submission", async ({ page }) => {
    // ========================================
    // STEP 1: Sign up
    // ========================================
    await test.step("User signs up", async () => {
      await page.click('text="Sign Up"');
      await expect(page).toHaveURL(/.*signup.*/);

      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.fill('input[name="confirmPassword"]', testPassword);
      await page.click('button[type="submit"]');

      // Should redirect to dashboard after signup
      await expect(page).toHaveURL(/.*dashboard|forms.*/);
    });

    // ========================================
    // STEP 2: Create new form
    // ========================================
    let formId: string;
    await test.step("User creates a new form", async () => {
      await page.click('text="Create Form"');

      // Fill in form details
      await page.fill('input[name="title"]', formTitle);
      await page.fill('textarea[name="description"]', "This is a test form");
      await page.click('button:has-text("Create")');

      // Should navigate to form builder
      await expect(page).toHaveURL(/.*forms\/[a-z0-9-]+\/edit.*/);

      // Extract form ID from URL
      const url = page.url();
      const match = url.match(/forms\/([a-z0-9-]+)\/edit/);
      formId = match ? match[1] : "";
      expect(formId).toBeTruthy();
    });

    // ========================================
    // STEP 3: Add blocks to form
    // ========================================
    await test.step("User adds blocks to the form", async () => {
      // Wait for form builder to load
      await expect(page.locator('text="Add Fields"')).toBeVisible();

      // Add Short Text block
      const shortTextBlock = page.locator('[data-testid="block-item-short_text"]');
      const canvas = page.locator('[data-testid="canvas"], .canvas, main');

      // Drag and drop short text block
      await shortTextBlock.dragTo(canvas);

      // Verify block was added
      await expect(page.locator('text="New short text question"')).toBeVisible({
        timeout: 5000,
      });

      // Add Email block
      const emailBlock = page.locator('[data-testid="block-item-email"]');
      await emailBlock.dragTo(canvas);
      await expect(page.locator('text="New email question"')).toBeVisible({
        timeout: 5000,
      });

      // Add Single Select block
      const selectBlock = page.locator('[data-testid="block-item-single_select"]');
      await selectBlock.dragTo(canvas);
      await expect(page.locator('text="New single select question"')).toBeVisible({
        timeout: 5000,
      });
    });

    // ========================================
    // STEP 4: Configure blocks
    // ========================================
    await test.step("User configures block properties", async () => {
      // Click on first block to select it
      await page.click('text="New short text question"');

      // Wait for properties panel
      await expect(page.locator('text="Properties"')).toBeVisible();

      // Update question text
      const questionInput = page.locator(
        '[data-testid="question-input"], input[name="question"]'
      ).first();
      await questionInput.fill("What is your name?");

      // Make it required
      const requiredToggle = page.locator(
        '[data-testid="required-toggle"], input[type="checkbox"][name="required"]'
      ).first();
      await requiredToggle.check();

      // Verify changes
      await expect(page.locator('text="What is your name?"')).toBeVisible();
    });

    // ========================================
    // STEP 5: Publish form
    // ========================================
    await test.step("User publishes the form", async () => {
      // Click publish button
      const publishButton = page.locator(
        'button:has-text("Publish"), button[data-testid="publish-button"]'
      ).first();
      await publishButton.click();

      // Confirm publish dialog if it appears
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Publish")').last();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Wait for success message
      await expect(
        page.locator('text=/Published|Success|Form is live/i')
      ).toBeVisible({ timeout: 10000 });
    });

    // ========================================
    // STEP 6: View published form
    // ========================================
    await test.step("User views the published form", async () => {
      // Click "View Form" or navigate to preview
      const viewButton = page.locator(
        'button:has-text("View"), button:has-text("Preview"), a:has-text("View Form")'
      ).first();

      if (await viewButton.isVisible()) {
        await viewButton.click();
      } else {
        // Navigate directly to preview URL
        await page.goto(`http://localhost:3301/preview/${formId}`);
      }

      // Verify form is displayed
      await expect(page.locator('text="What is your name?"')).toBeVisible();
    });

    // ========================================
    // STEP 7: Submit a response
    // ========================================
    await test.step("Respondent submits the form", async () => {
      // Fill in the name field
      const nameInput = page.locator('input[type="text"]').first();
      await nameInput.fill("John Doe");

      // Fill in email field
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill("john.doe@example.com");

      // Select an option in single select
      const selectOption = page.locator('input[type="radio"]').first();
      await selectOption.click();

      // Submit the form
      const submitButton = page.locator(
        'button:has-text("Submit"), button[type="submit"]'
      ).first();
      await submitButton.click();

      // Wait for thank you message
      await expect(
        page.locator('text=/Thank you|Submitted|Success/i')
      ).toBeVisible({ timeout: 10000 });
    });

    // ========================================
    // STEP 8: View submissions
    // ========================================
    await test.step("User views form submissions", async () => {
      // Navigate back to builder
      await page.goto(`http://localhost:3301/forms/${formId}/submissions`);

      // Wait for submissions page to load
      await expect(page.locator('text="Submissions"')).toBeVisible();

      // Verify submission appears
      await expect(page.locator('text="John Doe"')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text="john.doe@example.com"')).toBeVisible();
    });
  });

  test("user can save form as draft", async ({ page }) => {
    // Login first (assuming user from previous test)
    await page.goto("http://localhost:3301/auth/login");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Create new form
    await page.click('text="Create Form"');
    await page.fill('input[name="title"]', "Draft Form");
    await page.click('button:has-text("Create")');

    // Add a block
    const shortTextBlock = page.locator('[data-testid="block-item-short_text"]');
    const canvas = page.locator('[data-testid="canvas"], .canvas, main');
    await shortTextBlock.dragTo(canvas);

    // Save as draft (auto-save should work)
    await expect(page.locator('text=/Saved|Auto-save/i')).toBeVisible({
      timeout: 10000,
    });

    // Navigate away and back
    await page.goto("http://localhost:3301/dashboard");
    await expect(page.locator('text="Draft Form"')).toBeVisible();
  });

  test("user can duplicate a form", async ({ page }) => {
    // Login
    await page.goto("http://localhost:3301/auth/login");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Go to forms dashboard
    await page.goto("http://localhost:3301/dashboard");

    // Find a form and duplicate it
    const moreButton = page.locator('button[aria-label="More options"]').first();
    await moreButton.click();

    const duplicateButton = page.locator('text="Duplicate"');
    await duplicateButton.click();

    // Verify duplicate was created
    await expect(page.locator('text=/Copy|Duplicate/i')).toBeVisible();
  });

  test("user can delete a form", async ({ page }) => {
    // Login
    await page.goto("http://localhost:3301/auth/login");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Create a form to delete
    await page.click('text="Create Form"');
    await page.fill('input[name="title"]', "Form to Delete");
    await page.click('button:has-text("Create")');

    // Go back to dashboard
    await page.goto("http://localhost:3301/dashboard");

    // Delete the form
    const formToDelete = page.locator('text="Form to Delete"').first();
    await formToDelete.hover();

    const moreButton = page.locator('button[aria-label="More options"]').first();
    await moreButton.click();

    const deleteButton = page.locator('text="Delete"');
    await deleteButton.click();

    // Confirm deletion
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")').last();
    await confirmButton.click();

    // Verify form is gone
    await expect(page.locator('text="Form to Delete"')).not.toBeVisible({
      timeout: 5000,
    });
  });
});
