/**
 * Edge ingest service for form events and submissions
 * Handles validation, rate limiting, and queuing at the edge
 */

import { Router } from "./router";
import { handleAnalyticsEvent, handleAnalyticsBatch } from "./handlers/analytics";
import { handleSubmission, handlePartialSubmission } from "./handlers/submissions";
import { handleWebhookEvent } from "./handlers/webhooks";
import { rateLimitMiddleware } from "./middleware/rateLimit";
import { validateHMACMiddleware } from "./middleware/hmac";
import { corsMiddleware } from "./middleware/cors";

export interface Env {
  // KV namespaces
  RATE_LIMIT: KVNamespace;

  // Queues
  EVENT_QUEUE: Queue;
  SUBMISSION_QUEUE: Queue;

  // Environment variables
  HMAC_SECRET: string;
  API_ENDPOINT: string;
  CLICKHOUSE_ENDPOINT: string;
  ALLOWED_ORIGINS: string;
  MAX_EVENTS_PER_BATCH: string;
  MAX_REQUEST_SIZE: string;
}

const router = new Router<Env>();

// Apply global middleware
router.use(corsMiddleware);

// Analytics routes (public, rate limited)
router.post("/events/track", rateLimitMiddleware, handleAnalyticsEvent);
router.post("/events/batch", rateLimitMiddleware, handleAnalyticsBatch);

// Submission routes (public, rate limited)
router.post("/forms/:formId/submit", rateLimitMiddleware, handleSubmission);
router.post("/forms/:formId/partial", rateLimitMiddleware, handlePartialSubmission);

// Webhook routes (authenticated)
router.post("/webhooks/stripe", validateHMACMiddleware, handleWebhookEvent);

// Health check
router.get("/health", async () => {
  return new Response(
    JSON.stringify({
      status: "healthy",
      region: (globalThis as any).CF?.colo || "unknown",
      timestamp: new Date().toISOString(),
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
});

// 404 handler
router.all("*", async () => {
  return new Response("Not Found", { status: 404 });
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await router.handle(request, env, ctx);
    } catch (error) {
      console.error("Unhandled error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },

  // Handle queued events
  async queue(batch: MessageBatch, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      try {
        // Process based on queue type
        if (message.queue === "form-events") {
          await processAnalyticsEvent(message.body, env);
        } else if (message.queue === "form-submissions") {
          await processSubmission(message.body, env);
        }

        // Acknowledge message
        message.ack();
      } catch (error) {
        console.error("Error processing message:", error);
        // Retry with exponential backoff
        message.retry({ delaySeconds: Math.min(600, Math.pow(2, message.attempts)) });
      }
    }
  },
};

async function processAnalyticsEvent(event: any, env: Env): Promise<void> {
  // Forward to ClickHouse
  const response = await fetch(`${env.CLICKHOUSE_ENDPOINT}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.HMAC_SECRET}`, // Use proper auth
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(`ClickHouse error: ${response.status}`);
  }
}

async function processSubmission(submission: any, env: Env): Promise<void> {
  // Forward to main API
  const response = await fetch(`${env.API_ENDPOINT}/submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.HMAC_SECRET}`, // Use proper auth
    },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
}
