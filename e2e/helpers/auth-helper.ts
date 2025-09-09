import { Page } from '@playwright/test';

export class AuthHelper {
  private page: Page;
  private apiUrl: string;

  constructor(page: Page, apiUrl = 'http://localhost:8000') {
    this.page = page;
    this.apiUrl = apiUrl;
  }

  /**
   * Login to the application
   */
  async login(email = 'test@example.com', password = 'testpassword123'): Promise<void> {
    // Navigate to login page
    await this.page.goto('/login');
    
    // Fill login form
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    
    // Submit form
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect to forms page
    await this.page.waitForURL('/forms', { timeout: 10000 });
    
    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Setup authentication context (for API calls)
   */
  async setupApiAuth(): Promise<string> {
    // Get auth token from localStorage or cookies
    const token = await this.page.evaluate(() => {
      return localStorage.getItem('auth_token') || '';
    });
    
    return token;
  }

  /**
   * Create a test user if needed
   */
  async ensureTestUser(): Promise<void> {
    try {
      // Try to login first
      await this.login();
    } catch (error) {
      // If login fails, create user via API
      const response = await fetch(`${this.apiUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword123',
          name: 'Test User',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create test user');
      }
      
      // Now login
      await this.login();
    }
  }

  /**
   * Logout from the application
   */
  async logout(): Promise<void> {
    // Click on user menu
    await this.page.click('[data-testid="user-menu"]');
    
    // Click logout
    await this.page.click('[data-testid="logout-button"]');
    
    // Wait for redirect to login
    await this.page.waitForURL('/login');
  }
}