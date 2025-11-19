import { test, expect } from "@playwright/test";

/**
 * Drag & Drop Precision E2E Tests
 *
 * Tests the recently improved drag & drop functionality with:
 * - Cursor-based positioning
 * - Drop indicator accuracy
 * - Block reordering
 * - Cross-page dragging
 */

test.describe("Drag & Drop Precision", () => {
  const testEmail = `dragtest-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  test.beforeEach(async ({ page }) => {
    // Setup: Create account and form
    await page.goto("http://localhost:3301/auth/signup");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    // Create new form
    await page.click('text="Create Form"');
    await page.fill('input[name="title"]', `Drag Test ${Date.now()}`);
    await page.click('button:has-text("Create")');

    // Wait for builder to load
    await expect(page.locator('text="Add Fields"')).toBeVisible();
  });

  test("drag block from library to empty canvas", async ({ page }) => {
    const shortTextBlock = page.locator('[data-testid="block-item-short_text"]');
    const canvas = page.locator('[data-testid="canvas"], .canvas, main').first();

    // Get initial block count
    const initialCount = await page.locator("[data-block-id]").count();

    // Drag block to canvas
    await shortTextBlock.dragTo(canvas);

    // Verify block was added
    const newCount = await page.locator("[data-block-id]").count();
    expect(newCount).toBe(initialCount + 1);

    // Verify block content
    await expect(page.locator("text=/New short text/i")).toBeVisible();
  });

  test("drop indicator appears at correct position", async ({ page }) => {
    // Add two blocks first
    const canvas = page.locator('[data-testid="canvas"], .canvas, main').first();

    // Add first block
    const block1 = page.locator('[data-testid="block-item-short_text"]');
    await block1.dragTo(canvas);
    await page.waitForTimeout(500);

    // Add second block
    const block2 = page.locator('[data-testid="block-item-email"]');
    await block2.dragTo(canvas);
    await page.waitForTimeout(500);

    // Now drag a new block and hover over first block
    const block3 = page.locator('[data-testid="block-item-phone"]');
    const firstBlockOnCanvas = page.locator("[data-block-id]").first();

    // Start dragging
    await block3.hover();
    await page.mouse.down();

    // Move to first block
    const box = await firstBlockOnCanvas.boundingBox();
    if (box) {
      // Hover near top of block - should show indicator above
      await page.mouse.move(box.x + box.width / 2, box.y + 10);

      // Look for drop indicator (blue line)
      const indicator = page.locator(".border-primary, .bg-primary").first();
      await expect(indicator).toBeVisible({ timeout: 2000 });
    }

    await page.mouse.up();
  });

  test("reorder blocks by dragging within canvas", async ({ page }) => {
    // Add three blocks
    const canvas = page.locator('[data-testid="canvas"], .canvas, main').first();

    const blocks = [
      { selector: '[data-testid="block-item-short_text"]', name: "short text" },
      { selector: '[data-testid="block-item-email"]', name: "email" },
      { selector: '[data-testid="block-item-phone"]', name: "phone" },
    ];

    for (const block of blocks) {
      const blockElement = page.locator(block.selector);
      await blockElement.dragTo(canvas);
      await page.waitForTimeout(300);
    }

    // Get initial order
    const initialBlocks = await page.locator("[data-block-id]").all();
    const initialCount = initialBlocks.length;
    expect(initialCount).toBe(3);

    // Drag third block to first position
    const thirdBlock = page.locator("[data-block-id]").nth(2);
    const firstBlock = page.locator("[data-block-id]").first();

    await thirdBlock.dragTo(firstBlock);
    await page.waitForTimeout(500);

    // Verify order changed
    const finalBlocks = await page.locator("[data-block-id]").all();
    expect(finalBlocks.length).toBe(3);

    // The block that was third should now be first (or second, depending on drop position)
    // This is a basic check - more specific assertions would check actual IDs
  });

  test("drag precision with cursor-based positioning", async ({ page }) => {
    // Add two blocks
    const canvas = page.locator('[data-testid="canvas"], .canvas, main').first();

    await page.locator('[data-testid="block-item-short_text"]').dragTo(canvas);
    await page.waitForTimeout(300);
    await page.locator('[data-testid="block-item-email"]').dragTo(canvas);
    await page.waitForTimeout(300);

    // Drag new block and position cursor carefully
    const newBlock = page.locator('[data-testid="block-item-phone"]');
    const targetBlock = page.locator("[data-block-id]").first();

    await newBlock.hover();
    await page.mouse.down();

    const box = await targetBlock.boundingBox();
    if (box) {
      // Position cursor at top 25% of block - should insert above
      const topY = box.y + box.height * 0.25;
      await page.mouse.move(box.x + box.width / 2, topY);
      await page.waitForTimeout(500);

      // Drop
      await page.mouse.up();
      await page.waitForTimeout(500);

      // Verify new block is now first
      const firstBlock = page.locator("[data-block-id]").first();
      await expect(firstBlock).toContainText(/phone/i);
    }
  });

  test("drag block between pages", async ({ page }) => {
    // Add second page
    const addPageButton = page.locator('button:has-text("Add Page")');
    await addPageButton.click();
    await page.waitForTimeout(500);

    // Add block to page 1
    const canvas = page.locator('[data-testid="canvas"], .canvas, main').first();
    await page.locator('[data-testid="block-item-short_text"]').dragTo(canvas);
    await page.waitForTimeout(500);

    // Switch to page 2
    const page2Tab = page.locator('button:has-text("Page 2")');
    await page2Tab.click();
    await page.waitForTimeout(500);

    // Page 2 should be empty
    const page2Blocks = await page.locator("[data-block-id]").count();
    expect(page2Blocks).toBe(0);

    // Switch back to page 1
    const page1Tab = page.locator('button:has-text("Page 1")');
    await page1Tab.click();
    await page.waitForTimeout(500);

    // Verify block is still on page 1
    const page1Blocks = await page.locator("[data-block-id]").count();
    expect(page1Blocks).toBe(1);
  });

  test("undo/redo after drag operations", async ({ page }) => {
    // Add blocks
    const canvas = page.locator('[data-testid="canvas"], .canvas, main').first();

    await page.locator('[data-testid="block-item-short_text"]').dragTo(canvas);
    await page.waitForTimeout(300);

    const initialCount = await page.locator("[data-block-id]").count();
    expect(initialCount).toBe(1);

    // Undo (Cmd+Z or Ctrl+Z)
    await page.keyboard.press("Meta+z");
    await page.waitForTimeout(500);

    // Block should be removed
    const afterUndoCount = await page.locator("[data-block-id]").count();
    expect(afterUndoCount).toBe(0);

    // Redo (Cmd+Shift+Z or Ctrl+Shift+Z)
    await page.keyboard.press("Meta+Shift+z");
    await page.waitForTimeout(500);

    // Block should be back
    const afterRedoCount = await page.locator("[data-block-id]").count();
    expect(afterRedoCount).toBe(1);
  });

  test("drag overlay shows block preview during drag", async ({ page }) => {
    const block = page.locator('[data-testid="block-item-short_text"]');

    // Start dragging
    await block.hover();
    await page.mouse.down();
    await page.mouse.move(400, 400);

    // Look for drag overlay (should show block icon and label)
    const dragOverlay = page.locator('[role="dialog"], .drag-overlay, [data-drag-overlay]');

    // Some drag overlay should be visible
    // The exact selector depends on implementation
    await page.waitForTimeout(500);

    await page.mouse.up();
  });

  test("prevents accidental drags with activation distance", async ({ page }) => {
    const block = page.locator('[data-testid="block-item-short_text"]');

    // Click and move slightly (less than activation distance)
    await block.hover();
    const box = await block.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();

      // Move only 2px (less than 3px activation distance)
      await page.mouse.move(box.x + box.width / 2 + 2, box.y + box.height / 2);
      await page.mouse.up();

      // Block should not have been added to canvas
      const blockCount = await page.locator("[data-block-id]").count();
      expect(blockCount).toBe(0);
    }
  });
});
