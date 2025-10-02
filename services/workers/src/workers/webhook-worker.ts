/**
 * Worker for webhook deliveries with retry logic
 */

import { Job } from "bullmq";
import axios, { AxiosError } from "axios";
import crypto from "crypto";
import { Redis } from "ioredis";
import { z } from "zod";
import { BaseWorker } from "./base-worker";
import { config } from "../config";
import { logger } from "../logger";

// Webhook delivery schema
const WebhookDeliverySchema = z.object({
  webhook_id: z.string(),
  url: z.string().url(),
  secret: z.string(),
  headers: z.record(z.string()).optional(),
  event: z.string(),
  data: z.any(),
  attempt: z.number().default(1),
});

type WebhookDeliveryData = z.infer<typeof WebhookDeliverySchema>;

export class WebhookWorker extends BaseWorker<WebhookDeliveryData> {
  constructor(connection: Redis) {
    super("webhooks", connection);
  }

  async process(job: Job<WebhookDeliveryData>): Promise<void> {
    const delivery = WebhookDeliverySchema.parse(job.data);

    try {
      // Generate signature
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.generateSignature(delivery.secret, timestamp, delivery.data);

      // Prepare headers
      const headers = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Timestamp": timestamp.toString(),
        "X-Webhook-Event": delivery.event,
        "X-Webhook-Delivery-ID": job.id!,
        "X-Webhook-Attempt": delivery.attempt.toString(),
        ...delivery.headers,
      };

      // Send webhook
      const response = await axios.post(delivery.url, delivery.data, {
        headers,
        timeout: config.webhooks.timeout,
        validateStatus: null, // Don't throw on any status
      });

      // Log delivery
      await this.logDelivery(delivery, {
        status: "delivered",
        response_code: response.status,
        response_headers: response.headers,
        response_body: this.truncateBody(response.data),
        delivered_at: new Date().toISOString(),
      });

      // Check if successful (2xx status)
      if (response.status >= 200 && response.status < 300) {
        logger.info(
          {
            webhookId: delivery.webhook_id,
            url: delivery.url,
            status: response.status,
          },
          "Webhook delivered successfully"
        );
        return;
      }

      // Non-2xx status - fail the job for retry
      throw new Error(`Webhook returned ${response.status}`);
    } catch (error) {
      const axiosError = error as AxiosError;

      // Log failed delivery
      await this.logDelivery(delivery, {
        status: "failed",
        error: axiosError.message,
        response_code: axiosError.response?.status,
        failed_at: new Date().toISOString(),
      });

      // Determine if we should retry
      if (this.shouldRetry(axiosError)) {
        // Calculate next retry delay
        const retryDelay = this.getRetryDelay(delivery.attempt);

        // Update attempt count and re-queue
        throw new Error(`Webhook delivery failed: ${axiosError.message}`);
      } else {
        // Permanent failure - don't retry
        logger.error(
          {
            webhookId: delivery.webhook_id,
            url: delivery.url,
            error: axiosError.message,
          },
          "Webhook permanently failed"
        );

        // Mark as dead letter
        await this.moveToDeadLetter(delivery, axiosError.message);
      }
    }
  }

  private generateSignature(secret: string, timestamp: number, data: any): string {
    const message = `${timestamp}.${JSON.stringify(data)}`;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(message);
    return `sha256=${hmac.digest("hex")}`;
  }

  private shouldRetry(error: AxiosError): boolean {
    // Don't retry on client errors (4xx) except specific cases
    if (error.response) {
      const status = error.response.status;

      // Retry on rate limiting
      if (status === 429) return true;

      // Don't retry on other 4xx errors
      if (status >= 400 && status < 500) return false;

      // Retry on 5xx errors
      if (status >= 500) return true;
    }

    // Retry on network errors
    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT" || error.code === "ENOTFOUND") {
      return true;
    }

    // Default to retry
    return true;
  }

  private getRetryDelay(attempt: number): number {
    const delays = config.webhooks.retryDelays;
    const index = Math.min(attempt - 1, delays.length - 1);
    return delays[index] * 1000; // Convert to milliseconds
  }

  private truncateBody(data: any): string {
    const str = typeof data === "string" ? data : JSON.stringify(data);
    const maxLength = 1000;

    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + "... (truncated)";
  }

  private async logDelivery(delivery: WebhookDeliveryData, result: any): Promise<void> {
    try {
      await axios.post(
        `${config.api.url}/api/v1/webhook-deliveries`,
        {
          webhook_id: delivery.webhook_id,
          event: delivery.event,
          url: delivery.url,
          attempt: delivery.attempt,
          ...result,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(config.api.token && {
              Authorization: `Bearer ${config.api.token}`,
            }),
          },
          timeout: 5000,
        }
      );
    } catch (error) {
      logger.error({ error }, "Failed to log webhook delivery");
    }
  }

  private async moveToDeadLetter(delivery: WebhookDeliveryData, reason: string): Promise<void> {
    try {
      await axios.post(
        `${config.api.url}/api/v1/webhook-deliveries/dead-letter`,
        {
          webhook_id: delivery.webhook_id,
          event: delivery.event,
          url: delivery.url,
          data: delivery.data,
          reason,
          failed_at: new Date().toISOString(),
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(config.api.token && {
              Authorization: `Bearer ${config.api.token}`,
            }),
          },
          timeout: 5000,
        }
      );
    } catch (error) {
      logger.error({ error }, "Failed to move webhook to dead letter");
    }
  }
}
