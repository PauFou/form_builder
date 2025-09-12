import { Page } from "@playwright/test";

export class AuthHelper {
  private page: Page;
  private apiUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(page: Page, apiUrl = "http://localhost:8000") {
    this.page = page;
    this.apiUrl = apiUrl;
  }

  /**
   * Login to the application
   */
  async login(email = "test@example.com", password = "TestPass123!"): Promise<void> {
    // Navigate to login page
    await this.page.goto("/auth/login");

    // Fill login form
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);

    // Submit form
    await this.page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await this.page.waitForURL("/dashboard", { timeout: 10000 });

    // Wait for network to be idle
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Setup authentication context (for API calls)
   */
  async setupApiAuth(): Promise<string> {
    // Get auth token from localStorage
    const token = await this.page.evaluate(() => {
      return localStorage.getItem("access_token") || "";
    });

    this.accessToken = token;
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
      const timestamp = Date.now();
      const response = await fetch(`${this.apiUrl}/v1/auth/signup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: `testuser_${timestamp}`,
          email: "test@example.com",
          password: "TestPass123!",
          password2: "TestPass123!",
          organization_name: "Test Organization",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to create test user:", errorData);
        throw new Error("Failed to create test user");
      }

      const data = await response.json();
      this.accessToken = data.tokens.access;
      this.refreshToken = data.tokens.refresh;

      // Set tokens in page context
      await this.page.evaluate((tokens) => {
        localStorage.setItem("access_token", tokens.access);
        localStorage.setItem("refresh_token", tokens.refresh);
        document.cookie = `auth-token=${tokens.access}; path=/; max-age=3600; SameSite=Strict`;
      }, data.tokens);

      // Navigate to dashboard
      await this.page.goto("/dashboard");
    }
  }

  /**
   * Logout from the application
   */
  async logout(): Promise<void> {
    // Click on user menu (using the icon button)
    await this.page.click("button:has(svg.lucide-user)");

    // Click logout in dropdown
    await this.page.click('text="Logout"');

    // Wait for redirect to login
    await this.page.waitForURL("/auth/login");
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Make authenticated API request
   */
  async apiRequest(method: string, endpoint: string, data?: any): Promise<Response> {
    const token = await this.setupApiAuth();

    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return response;
  }
}
