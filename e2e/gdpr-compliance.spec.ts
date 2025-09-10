import { test, expect } from "@playwright/test";

test.describe("GDPR Compliance", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("http://localhost:3001/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");
  });

  test("should display GDPR compliance dashboard", async ({ page }) => {
    await page.goto("http://localhost:3001/gdpr");

    // Check main elements
    await expect(page.locator("h1")).toContainText("GDPR Compliance");
    await expect(page.locator("text=Data Residency")).toBeVisible();
    await expect(page.locator("text=Retention Policy")).toBeVisible();
    await expect(page.locator("text=PII Encryption")).toBeVisible();
  });

  test("should configure data residency", async ({ page }) => {
    await page.goto("http://localhost:3001/gdpr");
    await page.click("text=Data Residency");

    // Check EU regions
    await expect(page.locator("text=EU-WEST-1")).toBeVisible();
    await expect(page.locator("text=All data is stored exclusively in EU regions")).toBeVisible();
  });

  test("should manage retention policies", async ({ page }) => {
    await page.goto("http://localhost:3001/gdpr");
    await page.click("text=Retention");

    // Check retention periods
    await expect(page.locator("text=Submissions")).toBeVisible();
    await expect(page.locator("text=365 days")).toBeVisible();
    await expect(page.locator("text=Partial Submissions")).toBeVisible();
    await expect(page.locator("text=30 days")).toBeVisible();
  });

  test("should display PII field management", async ({ page }) => {
    await page.goto("http://localhost:3001/gdpr");
    await page.click("text=PII Management");

    // Check PII fields table
    await expect(page.locator("text=All PII fields are automatically encrypted")).toBeVisible();
    await expect(page.locator("th:has-text('Field')")).toBeVisible();
    await expect(page.locator("th:has-text('Encryption')")).toBeVisible();
    await expect(page.locator("th:has-text('Masking')")).toBeVisible();
  });

  test("should show data request statistics", async ({ page }) => {
    await page.goto("http://localhost:3001/gdpr");
    await page.click("text=Data Requests");

    // Check deletion requests
    await expect(page.locator("text=Deletion Requests")).toBeVisible();
    await expect(page.locator("text=Export Requests")).toBeVisible();
    await expect(page.locator("text=All data requests are processed within 30 days")).toBeVisible();
  });

  test("should display consent management", async ({ page }) => {
    await page.goto("http://localhost:3001/gdpr");
    await page.click("text=Consent");

    // Check consent statistics
    await expect(page.locator("text=Total Consents")).toBeVisible();
    await expect(page.locator("text=Active Rate")).toBeVisible();
    await expect(page.locator("text=Data Processing")).toBeVisible();
    await expect(page.locator("text=Marketing")).toBeVisible();
  });

  test("should show DPA status", async ({ page }) => {
    await page.goto("http://localhost:3001/gdpr");
    await page.click("text=DPA");

    // Check DPA information
    await expect(page.locator("text=Data Processing Agreement")).toBeVisible();
    await expect(page.locator("text=Download DPA")).toBeVisible();
  });
});

test.describe("GDPR Data Subject Rights", () => {
  test("should submit deletion request", async ({ page }) => {
    // Navigate to public deletion request form
    await page.goto("http://localhost:3000/privacy/delete-data");

    // Fill deletion request
    await page.fill('input[name="email"]', "user@example.com");
    await page.fill('textarea[name="reason"]', "I no longer use your service");
    await page.click("text=Submit Request");

    // Check confirmation
    await expect(page.locator("text=Verification email sent")).toBeVisible();
  });

  test("should submit data export request", async ({ page }) => {
    // Navigate to public export request form
    await page.goto("http://localhost:3000/privacy/export-data");

    // Fill export request
    await page.fill('input[name="email"]', "user@example.com");
    await page.selectOption('select[name="format"]', "json");
    await page.click("text=Request Export");

    // Check confirmation
    await expect(page.locator("text=Export request submitted")).toBeVisible();
  });

  test("should manage consent preferences", async ({ page }) => {
    // Navigate to consent management
    await page.goto("http://localhost:3000/privacy/consent");

    // Check consent options
    await expect(page.locator("text=Marketing Communications")).toBeVisible();
    await expect(page.locator("text=Analytics Tracking")).toBeVisible();

    // Toggle consent
    await page.click('input[name="marketing_consent"]');
    await page.click("text=Save Preferences");

    await expect(page.locator("text=Preferences updated")).toBeVisible();
  });
});

test.describe("GDPR Form Builder Integration", () => {
  test("should mark PII fields in form builder", async ({ page }) => {
    // Create new form
    await page.goto("http://localhost:3001/forms/new");

    // Add email field
    await page.click("text=Email");
    await page.fill('input[name="label"]', "Your Email");

    // Check PII indicator
    await expect(page.locator("text=PII Field")).toBeVisible();
    await expect(page.locator("text=This field will be encrypted")).toBeVisible();
  });

  test("should configure form retention policy", async ({ page }) => {
    // Open form settings
    await page.goto("http://localhost:3001/forms/123/settings");
    await page.click("text=Privacy & GDPR");

    // Set retention
    await page.fill('input[name="retention_days"]', "90");
    await page.click("text=Save Settings");

    await expect(page.locator("text=Retention policy updated")).toBeVisible();
  });
});
