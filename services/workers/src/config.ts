/**
 * Worker configuration
 */

import { z } from "zod";

const configSchema = z.object({
  redis: z.object({
    url: z.string().default("redis://localhost:6379"),
  }),
  api: z.object({
    url: z.string().default("http://localhost:8000"),
    token: z.string().optional(),
  }),
  clickhouse: z.object({
    url: z.string().default("http://localhost:8123"),
    database: z.string().default("forms_analytics"),
    username: z.string().default("forms_user"),
    password: z.string(),
  }),
  webhooks: z.object({
    maxRetries: z.number().default(7),
    retryDelays: z.array(z.number()).default([
      0, // immediate
      30, // 30 seconds
      120, // 2 minutes
      600, // 10 minutes
      3600, // 1 hour
      21600, // 6 hours
      86400, // 24 hours
    ]),
    timeout: z.number().default(30000), // 30 seconds
  }),
  workers: z.object({
    concurrency: z.number().default(10),
    maxStalledCount: z.number().default(3),
    stalledInterval: z.number().default(30000),
    removeOnComplete: z.object({
      age: z.number().default(3600), // 1 hour
      count: z.number().default(1000),
    }),
    removeOnFail: z.object({
      age: z.number().default(86400), // 24 hours
      count: z.number().default(5000),
    }),
  }),
});

// Load config from environment
const rawConfig = {
  redis: {
    url: process.env.REDIS_URL,
  },
  api: {
    url: process.env.API_URL,
    token: process.env.API_TOKEN,
  },
  clickhouse: {
    url: process.env.CLICKHOUSE_URL,
    database: process.env.CLICKHOUSE_DATABASE,
    username: process.env.CLICKHOUSE_USER,
    password: process.env.CLICKHOUSE_PASSWORD || "",
  },
  webhooks: {
    maxRetries: process.env.WEBHOOK_MAX_RETRIES
      ? parseInt(process.env.WEBHOOK_MAX_RETRIES, 10)
      : undefined,
  },
  workers: {
    concurrency: process.env.WORKER_CONCURRENCY
      ? parseInt(process.env.WORKER_CONCURRENCY, 10)
      : undefined,
  },
};

// Validate and export config
export const config = configSchema.parse(rawConfig);
