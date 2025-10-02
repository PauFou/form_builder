/**
 * Queue workers for processing form events and webhooks
 */

import { Worker, Queue, QueueEvents } from "bullmq";
import Redis from "ioredis";
import { logger } from "./logger";
import { EventWorker } from "./workers/event-worker";
import { SubmissionWorker } from "./workers/submission-worker";
import { WebhookWorker } from "./workers/webhook-worker";
import { PartialWorker } from "./workers/partial-worker";
import { config } from "./config";

// Redis connection
const connection = new Redis(config.redis.url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Create workers
const workers = [
  new EventWorker(connection),
  new SubmissionWorker(connection),
  new WebhookWorker(connection),
  new PartialWorker(connection),
];

// Start all workers
async function start() {
  logger.info("Starting queue workers...");

  // Health check
  try {
    await connection.ping();
    logger.info("Redis connection successful");
  } catch (error) {
    logger.error({ error }, "Failed to connect to Redis");
    process.exit(1);
  }

  // Start workers
  for (const worker of workers) {
    await worker.start();
    logger.info(`Started ${worker.name} worker`);
  }

  // Monitor queue events
  const queueNames = ["events", "submissions", "webhooks", "partials"];
  for (const queueName of queueNames) {
    const queueEvents = new QueueEvents(queueName, { connection });

    queueEvents.on("completed", ({ jobId, returnvalue }) => {
      logger.debug({ jobId, queueName }, "Job completed");
    });

    queueEvents.on("failed", ({ jobId, failedReason }) => {
      logger.error({ jobId, queueName, reason: failedReason }, "Job failed");
    });

    queueEvents.on("stalled", ({ jobId }) => {
      logger.warn({ jobId, queueName }, "Job stalled");
    });
  }

  logger.info("All workers started successfully");
}

// Graceful shutdown
async function shutdown() {
  logger.info("Shutting down workers...");

  for (const worker of workers) {
    await worker.stop();
    logger.info(`Stopped ${worker.name} worker`);
  }

  await connection.quit();
  logger.info("Shutdown complete");
  process.exit(0);
}

// Handle signals
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught exception");
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  logger.fatal({ error }, "Unhandled rejection");
  process.exit(1);
});

// Start workers
start().catch((error) => {
  logger.fatal({ error }, "Failed to start workers");
  process.exit(1);
});
