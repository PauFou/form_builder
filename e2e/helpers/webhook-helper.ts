import { expect } from "@playwright/test";
import crypto from "crypto";

export class WebhookHelper {
  private baseUrl: string;
  private secret: string;

  constructor(baseUrl = "http://localhost:9000", secret = "test-webhook-secret") {
    this.baseUrl = baseUrl;
    this.secret = secret;
  }

  /**
   * Clear all received webhooks
   */
  async clearWebhooks(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/webhooks`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to clear webhooks: ${response.statusText}`);
    }
  }

  /**
   * Get all received webhooks
   */
  async getWebhooks(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/webhooks`);

    if (!response.ok) {
      throw new Error(`Failed to get webhooks: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Wait for a webhook to be received
   */
  async waitForWebhook(
    options: {
      timeout?: number;
      predicate?: (webhook: any) => boolean;
    } = {}
  ): Promise<any> {
    const { timeout = 30000, predicate } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const webhooks = await this.getWebhooks();

      if (webhooks.length > 0) {
        const webhook = predicate ? webhooks.find(predicate) : webhooks[webhooks.length - 1];

        if (webhook) {
          return webhook;
        }
      }

      // Wait 500ms before checking again
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error(`Timeout waiting for webhook after ${timeout}ms`);
  }

  /**
   * Verify webhook signature
   */
  verifySignature(webhook: any): boolean {
    const signature = webhook.headers["x-forms-signature"];
    const timestamp = webhook.headers["x-forms-timestamp"];

    if (!signature || !timestamp) {
      return false;
    }

    const signatureHash = signature.replace("sha256=", "");
    const payload = `${timestamp}.${JSON.stringify(webhook.body)}`;
    const expectedHash = crypto.createHmac("sha256", this.secret).update(payload).digest("hex");

    return signatureHash === expectedHash;
  }

  /**
   * Check if webhook receiver is healthy
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return data.status === "ok";
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for webhook receiver to be ready
   */
  async waitForReady(timeout = 10000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await this.checkHealth()) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error("Webhook receiver not ready");
  }
}
