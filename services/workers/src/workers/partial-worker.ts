/**
 * Worker for processing partial submissions
 */

import { Job } from "bullmq";
import axios from "axios";
import { Redis } from "ioredis";
import { z } from "zod";
import { BaseWorker } from "./base-worker";
import { config } from "../config";
import { logger } from "../logger";

// Partial submission schema
const PartialSubmissionSchema = z.object({
  type: z.literal("partial"),
  key: z.string(), // Idempotency key
  form_id: z.string(),
  session_id: z.string(),
  respondent_key: z.string().optional(),
  current_step: z.number(),
  data: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
  updated_at: z.string(),
});

type PartialSubmissionData = z.infer<typeof PartialSubmissionSchema>;

export class PartialWorker extends BaseWorker<PartialSubmissionData> {
  constructor(connection: Redis) {
    super("partials", connection);
  }

  async process(job: Job<PartialSubmissionData>): Promise<void> {
    const partial = PartialSubmissionSchema.parse(job.data);

    try {
      // Save partial submission with idempotency
      const response = await axios.put(
        `${config.api.url}/api/v1/forms/${partial.form_id}/partials/${partial.session_id}`,
        {
          current_step: partial.current_step,
          data: partial.data,
          metadata: partial.metadata,
          respondent_key: partial.respondent_key,
          updated_at: partial.updated_at,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": partial.key,
            ...(config.api.token && {
              Authorization: `Bearer ${config.api.token}`,
            }),
          },
          timeout: 10000,
        }
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`API error: ${response.status}`);
      }

      logger.info(
        {
          formId: partial.form_id,
          sessionId: partial.session_id,
          step: partial.current_step,
        },
        "Partial submission saved"
      );

      // Track analytics event
      await this.trackPartialEvent(partial);

      // Check if webhooks want partial events
      await this.triggerPartialWebhooks(partial);
    } catch (error: any) {
      // Don't retry on duplicate key errors
      if (error.response?.status === 409) {
        logger.info(
          {
            key: partial.key,
          },
          "Partial already processed (idempotent)"
        );
        return;
      }

      throw error;
    }
  }

  private async trackPartialEvent(partial: PartialSubmissionData): Promise<void> {
    try {
      // Queue analytics event
      const { Queue } = await import("bullmq");
      const eventQueue = new Queue("events", {
        connection: this.connection,
      });

      await eventQueue.add("track", {
        event_type: "submission",
        form_id: partial.form_id,
        session_id: partial.session_id,
        respondent_key: partial.respondent_key,
        is_complete: false,
        is_partial: true,
        current_step: partial.current_step,
        fields_completed: Object.keys(partial.data).length,
        timestamp: partial.updated_at,
      });
    } catch (error) {
      logger.error({ error }, "Failed to track partial event");
      // Don't fail the job for analytics errors
    }
  }

  private async triggerPartialWebhooks(partial: PartialSubmissionData): Promise<void> {
    try {
      // Get webhooks that want partial events
      const response = await axios.get(
        `${config.api.url}/api/v1/forms/${partial.form_id}/webhooks?events=submission.partial`,
        {
          headers: {
            ...(config.api.token && {
              Authorization: `Bearer ${config.api.token}`,
            }),
          },
          timeout: 5000,
        }
      );

      const webhooks = response.data.webhooks || [];

      // Queue webhook deliveries
      const { Queue } = await import("bullmq");
      const webhookQueue = new Queue("webhooks", {
        connection: this.connection,
      });

      for (const webhook of webhooks) {
        if (webhook.active) {
          await webhookQueue.add(
            "delivery",
            {
              webhook_id: webhook.id,
              url: webhook.url,
              secret: webhook.secret,
              headers: webhook.headers || {},
              event: "submission.partial",
              data: {
                form_id: partial.form_id,
                session_id: partial.session_id,
                current_step: partial.current_step,
                updated_at: partial.updated_at,
                data: partial.data,
                metadata: partial.metadata,
              },
            },
            {
              attempts: config.webhooks.maxRetries,
              backoff: {
                type: "custom",
              },
            }
          );

          logger.debug(
            {
              webhookId: webhook.id,
              sessionId: partial.session_id,
            },
            "Queued partial webhook delivery"
          );
        }
      }
    } catch (error) {
      logger.error(
        {
          error,
          sessionId: partial.session_id,
        },
        "Failed to trigger partial webhooks"
      );
      // Don't fail the job for webhook errors
    }
  }
}
