/**
 * Worker for processing form submissions
 */

import { Job } from "bullmq";
import axios from "axios";
import { Redis } from "ioredis";
import { z } from "zod";
import { BaseWorker } from "./base-worker";
import { config } from "../config";
import { logger } from "../logger";

// Submission schema
const SubmissionSchema = z.object({
  id: z.string(),
  form_id: z.string(),
  session_id: z.string(),
  respondent_key: z.string().optional(),
  data: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
  ip_address: z.string().optional(),
  country_code: z.string().optional(),
  created_at: z.string(),
});

const PaymentUpdateSchema = z.object({
  type: z.literal("payment_update"),
  submission_id: z.string(),
  payment: z.object({
    status: z.enum(["succeeded", "failed"]),
    payment_intent_id: z.string(),
    amount: z.number().optional(),
    currency: z.string().optional(),
    error: z.string().optional(),
    processed_at: z.string().optional(),
    failed_at: z.string().optional(),
  }),
});

type SubmissionData = z.infer<typeof SubmissionSchema>;
type PaymentUpdateData = z.infer<typeof PaymentUpdateSchema>;

export class SubmissionWorker extends BaseWorker<SubmissionData | PaymentUpdateData> {
  constructor(connection: Redis) {
    super("submissions", connection);
  }

  async process(job: Job<SubmissionData | PaymentUpdateData>): Promise<void> {
    // Check if payment update
    if ("type" in job.data && job.data.type === "payment_update") {
      await this.processPaymentUpdate(job.data);
    } else {
      await this.processSubmission(job.data as SubmissionData);
    }
  }

  private async processSubmission(data: SubmissionData): Promise<void> {
    const submission = SubmissionSchema.parse(data);

    // Send to main API
    const response = await axios.post(`${config.api.url}/api/v1/submissions`, submission, {
      headers: {
        "Content-Type": "application/json",
        ...(config.api.token && {
          Authorization: `Bearer ${config.api.token}`,
        }),
      },
      timeout: 30000,
    });

    if (response.status !== 201 && response.status !== 202) {
      throw new Error(`API error: ${response.status}`);
    }

    logger.info(
      {
        submissionId: submission.id,
        formId: submission.form_id,
      },
      "Submission processed"
    );

    // Trigger webhooks for this submission
    await this.triggerWebhooks(submission);
  }

  private async processPaymentUpdate(data: PaymentUpdateData): Promise<void> {
    const update = PaymentUpdateSchema.parse(data);

    // Update submission with payment status
    const response = await axios.patch(
      `${config.api.url}/api/v1/submissions/${update.submission_id}/payment`,
      update.payment,
      {
        headers: {
          "Content-Type": "application/json",
          ...(config.api.token && {
            Authorization: `Bearer ${config.api.token}`,
          }),
        },
        timeout: 10000,
      }
    );

    if (response.status !== 200) {
      throw new Error(`API error: ${response.status}`);
    }

    logger.info(
      {
        submissionId: update.submission_id,
        status: update.payment.status,
      },
      "Payment status updated"
    );
  }

  private async triggerWebhooks(submission: SubmissionData): Promise<void> {
    try {
      // Get webhooks for this form
      const response = await axios.get(
        `${config.api.url}/api/v1/forms/${submission.form_id}/webhooks`,
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
      for (const webhook of webhooks) {
        if (webhook.active && webhook.events?.includes("submission.completed")) {
          await this.queueWebhookDelivery(webhook, submission);
        }
      }
    } catch (error) {
      logger.error(
        {
          error,
          submissionId: submission.id,
        },
        "Failed to trigger webhooks"
      );
      // Don't fail the job for webhook errors
    }
  }

  private async queueWebhookDelivery(webhook: any, submission: SubmissionData): Promise<void> {
    const { Queue } = await import("bullmq");
    const webhookQueue = new Queue("webhooks", {
      connection: this.connection,
    });

    await webhookQueue.add(
      "delivery",
      {
        webhook_id: webhook.id,
        url: webhook.url,
        secret: webhook.secret,
        headers: webhook.headers || {},
        event: "submission.completed",
        data: {
          id: submission.id,
          form_id: submission.form_id,
          submitted_at: submission.created_at,
          data: submission.data,
          metadata: submission.metadata,
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
        submissionId: submission.id,
      },
      "Queued webhook delivery"
    );
  }
}
