import { test, expect } from '@playwright/test';

test.describe('Basic Webhook Test', () => {
  test('webhook receiver should be running', async ({ page }) => {
    // Test webhook receiver directly
    console.log('🎣 Testing webhook receiver...');
    
    const healthResponse = await fetch('http://localhost:9000/health');
    const health = await healthResponse.json();
    
    expect(health.status).toBe('ok');
    console.log('✅ Webhook receiver is healthy');
    
    // Send test webhook
    console.log('📤 Sending test webhook...');
    const webhookResponse = await fetch('http://localhost:9000/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forms-Timestamp': Date.now().toString(),
      },
      body: JSON.stringify({
        event: 'test',
        message: 'Basic webhook test from Playwright',
      }),
    });
    
    expect(webhookResponse.ok).toBe(true);
    console.log('✅ Webhook sent successfully');
    
    // Verify webhook was stored
    const webhooksResponse = await fetch('http://localhost:9000/webhooks');
    const webhooks = await webhooksResponse.json();
    
    expect(webhooks.length).toBeGreaterThan(0);
    expect(webhooks[webhooks.length - 1].body.event).toBe('test');
    console.log('✅ Webhook was stored correctly');
    
    // Test frontend is accessible
    console.log('🌐 Testing frontend...');
    await page.goto('http://localhost:3001');
    
    // Just check that something loaded
    const pageContent = await page.content();
    expect(pageContent).toBeTruthy();
    expect(pageContent.length).toBeGreaterThan(100);
    console.log('✅ Frontend responded with content');
  });
});