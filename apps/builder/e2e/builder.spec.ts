import { test, expect } from '@playwright/test';

test.describe('Form Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('should display builder layout with correct dimensions', async ({ page }) => {
    // Check topbar
    const topbar = page.locator('.fixed.top-0');
    await expect(topbar).toBeVisible();
    await expect(topbar).toHaveCSS('height', '56px');

    // Check left rail (320px)
    const leftRail = page.locator('.w-80');
    await expect(leftRail).toBeVisible();
    await expect(leftRail).toHaveCSS('width', '320px');

    // Check right inspector (360px)
    const inspector = page.locator('.w-\\[360px\\]');
    await expect(inspector).toBeVisible();
    await expect(inspector).toHaveCSS('width', '360px');

    // Check canvas area
    const canvas = page.locator('.flex-1.overflow-auto.bg-muted\\/30');
    await expect(canvas).toBeVisible();
  });

  test('should create and add fields to form', async ({ page }) => {
    // Search for a block
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('email');

    // Verify email block is visible
    const emailBlock = page.getByText('Email').first();
    await expect(emailBlock).toBeVisible();

    // TODO: Implement drag and drop when DnD is fully set up
    // For now, we verify the block library loads correctly
  });

  test('should toggle preview with keyboard shortcut', async ({ page }) => {
    // Initially preview should not be visible
    const preview = page.locator('.fixed.inset-y-0.right-0');
    await expect(preview).not.toBeVisible();

    // Press Cmd+P (or Ctrl+P)
    await page.keyboard.press('Control+p');

    // Preview should now be visible
    await expect(preview).toBeVisible();

    // Close preview
    await page.getByRole('button', { name: 'X' }).click();
    await expect(preview).not.toBeVisible();
  });

  test('should show block inspector when selecting a block', async ({ page }) => {
    // Initially should show "Select a block to configure"
    await expect(page.getByText('Select a block to configure')).toBeVisible();

    // TODO: Add a block and select it to test inspector
  });

  test('should display all 4 inspector tabs', async ({ page }) => {
    // Check all tabs are present
    await expect(page.getByRole('tab', { name: 'Field' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Logic' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Design' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Data' })).toBeVisible();

    // Click through tabs
    await page.getByRole('tab', { name: 'Logic' }).click();
    await page.getByRole('tab', { name: 'Design' }).click();
    await page.getByRole('tab', { name: 'Data' }).click();
  });

  test('should show autosave timestamp', async ({ page }) => {
    // Check for last saved text
    const lastSaved = page.locator('text=/Last saved/');
    await expect(lastSaved).toBeVisible();
  });

  test('should filter blocks in library', async ({ page }) => {
    const searchInput = page.locator('input[type="search"]');
    
    // Initially all 6 blocks should be visible
    const allBlocks = page.locator('.grid.grid-cols-2.gap-2 button');
    await expect(allBlocks).toHaveCount(6);

    // Search for "text"
    await searchInput.fill('text');
    
    // Should show only short text and long text
    await expect(allBlocks).toHaveCount(2);
    await expect(page.getByText('Short text')).toBeVisible();
    await expect(page.getByText('Long text')).toBeVisible();

    // Clear search
    await searchInput.clear();
    await expect(allBlocks).toHaveCount(6);
  });

  test('should have responsive preview modes', async ({ page }) => {
    // Open preview
    await page.getByRole('button', { name: 'Preview' }).click();

    // Check device mode buttons
    await expect(page.getByRole('button', { name: 'Monitor' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tablet' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Smartphone' })).toBeVisible();

    // Switch to tablet mode
    await page.getByRole('button', { name: 'Tablet' }).click();
    await expect(page.getByText('768×1024')).toBeVisible();

    // Switch to mobile mode
    await page.getByRole('button', { name: 'Smartphone' }).click();
    await expect(page.getByText('375×667')).toBeVisible();
  });
});