import { Page, expect } from "@playwright/test";

export interface FormField {
  type: "text" | "email" | "file" | "signature" | "dropdown" | "number";
  title: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
}

export class FormHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Create a new form
   */
  async createForm(title: string, description?: string): Promise<string> {
    // Navigate to forms page
    await this.page.goto("/forms");

    // Click create form button
    await this.page.click('button:has-text("Create Form")');

    // Wait for modal/dialog
    await this.page.waitForSelector('[role="dialog"], .modal, .create-form-dialog', {
      timeout: 5000,
    });

    // Fill form details
    await this.page.fill('input[name="title"]', title);
    if (description) {
      await this.page.fill('textarea[name="description"], input[name="description"]', description);
    }

    // Submit form creation
    await this.page.click(
      'button[type="submit"]:has-text("Create"), button:has-text("Create Form"):not(:disabled)'
    );

    // Wait for redirect to editor
    await this.page.waitForURL(/\/forms\/.*\/edit/);

    // Extract form ID from URL
    const url = this.page.url();
    const match = url.match(/\/forms\/([^/]+)\/edit/);

    if (!match) {
      throw new Error("Failed to extract form ID from URL");
    }

    return match[1];
  }

  /**
   * Add a field to the form
   */
  async addField(field: FormField): Promise<void> {
    // Click add field button
    await this.page.click('button:has-text("Add Field"), button:has-text("Add Block")');

    // Select field type from library
    const fieldSelector = `[data-field-type="${field.type}"], [data-block-type="${field.type}"]`;
    await this.page.click(fieldSelector);

    // Wait for field to be added to canvas
    await this.page.waitForSelector(".field-item:last-child, .block-item:last-child", {
      timeout: 5000,
    });

    // Configure field
    await this.page.fill(
      'input[placeholder*="Question"], input[placeholder*="Title"], input[name="title"]:visible',
      field.title
    );

    if (field.description) {
      await this.page.fill(
        'textarea[placeholder*="Description"], input[placeholder*="Description"], input[name="description"]:visible',
        field.description
      );
    }

    if (field.placeholder) {
      await this.page.fill(
        'input[placeholder*="Placeholder"], input[name="placeholder"]:visible',
        field.placeholder
      );
    }

    // Set required if needed
    if (field.required !== undefined) {
      const requiredSwitch = await this.page
        .locator('input[type="checkbox"][name="required"], [role="switch"][aria-label*="Required"]')
        .first();
      const isChecked = await requiredSwitch.isChecked();

      if (isChecked !== field.required) {
        await requiredSwitch.click();
      }
    }

    // Save field configuration
    const saveButton = await this.page
      .locator('button:has-text("Save"):visible, button:has-text("Done"):visible')
      .first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
    }
  }

  /**
   * Publish the form
   */
  async publishForm(): Promise<string> {
    // Click publish button
    await this.page.click('button:has-text("Publish")');

    // Wait for confirmation dialog
    await this.page.waitForSelector('[role="dialog"], .publish-dialog', { timeout: 5000 });

    // Confirm publish
    await this.page.click('button:has-text("Confirm"), button:has-text("Publish Now")');

    // Wait for success message
    await expect(this.page.locator("text=published successfully, text=Form published")).toBeVisible(
      { timeout: 10000 }
    );

    // Get public URL
    const publicUrlElement = await this.page
      .locator('[data-testid="public-url"], .public-url, input[readonly][value*="/f/"]')
      .first();
    const publicUrl = await publicUrlElement
      .inputValue()
      .catch(() => publicUrlElement.textContent());

    if (!publicUrl) {
      // Try to construct URL from form ID
      const url = this.page.url();
      const match = url.match(/\/forms\/([^/]+)/);
      if (match) {
        return `http://localhost:3000/f/${match[1]}`;
      }
      throw new Error("Failed to get public URL");
    }

    return publicUrl;
  }

  /**
   * Fill and submit a form
   */
  async fillAndSubmitForm(formUrl: string, data: Record<string, any>): Promise<void> {
    // Navigate to form
    await this.page.goto(formUrl);

    // Wait for form to load
    await this.page.waitForSelector('form, [data-testid="form-container"]', { timeout: 10000 });

    // Fill text fields
    for (const [fieldName, value] of Object.entries(data)) {
      if (fieldName === "file") {
        // Handle file upload
        const fileInput = await this.page.locator('input[type="file"]').first();
        await fileInput.setInputFiles(value);
      } else if (fieldName === "signature") {
        // Handle signature
        const canvas = await this.page
          .locator("canvas[data-signature], .signature-pad canvas")
          .first();
        await this.drawSignature(canvas);
      } else {
        // Handle text inputs
        const input = await this.page
          .locator(
            `input[name="${fieldName}"], textarea[name="${fieldName}"], [aria-label*="${fieldName}" i]`
          )
          .first();
        await input.fill(value);
      }
    }

    // Submit form
    await this.page.click('button[type="submit"]:has-text("Submit"), button:has-text("Send")');

    // Wait for success message
    await expect(
      this.page.locator("text=Thank you, text=Success, text=Submission received")
    ).toBeVisible({ timeout: 10000 });
  }

  /**
   * Draw a signature on canvas
   */
  private async drawSignature(canvas: any): Promise<void> {
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas not found");

    // Draw a simple signature
    await this.page.mouse.move(box.x + 50, box.y + box.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + 100, box.y + box.height / 3, { steps: 5 });
    await this.page.mouse.move(box.x + 150, box.y + (box.height * 2) / 3, { steps: 5 });
    await this.page.mouse.move(box.x + 200, box.y + box.height / 2, { steps: 5 });
    await this.page.mouse.up();
  }

  /**
   * Configure webhook for the form
   */
  async configureWebhook(formId: string, webhookUrl: string): Promise<void> {
    // Navigate to form settings
    await this.page.goto(`/forms/${formId}/settings`);

    // Go to integrations tab
    await this.page.click('[data-tab="integrations"], button:has-text("Integrations")');

    // Add webhook
    await this.page.click('button:has-text("Add Webhook")');

    // Fill webhook URL
    await this.page.fill('input[name="url"], input[placeholder*="URL"]', webhookUrl);

    // Enable for all events
    const allEventsCheckbox = await this.page
      .locator(
        'input[type="checkbox"][name="all_events"], [role="checkbox"][aria-label*="All events"]'
      )
      .first();
    await allEventsCheckbox.check();

    // Save webhook
    await this.page.click('button:has-text("Save Webhook"), button:has-text("Add"):not(:disabled)');

    // Wait for success
    await expect(this.page.locator("text=Webhook added, text=Webhook created")).toBeVisible({
      timeout: 5000,
    });
  }
}
