/**
 * Worker for processing analytics events
 */

import { Job } from "bullmq";
import axios from "axios";
import { Redis } from "ioredis";
import { z } from "zod";
import { BaseWorker } from "./base-worker";
import { config } from "../config";
import { logger } from "../logger";

// Event schemas
const EventSchema = z.object({
  event_type: z.enum(["view", "interaction", "submission"]),
  form_id: z.string(),
  session_id: z.string(),
  timestamp: z.string(),
  ip_address: z.string().optional(),
  country_code: z.string().optional(),
  user_agent: z.string().optional(),
});

const BatchEventSchema = z.object({
  batch: z.array(EventSchema),
});

type EventData = z.infer<typeof EventSchema>;
type BatchEventData = z.infer<typeof BatchEventSchema>;

export class EventWorker extends BaseWorker<EventData | BatchEventData> {
  constructor(connection: Redis) {
    super("events", connection);
  }

  async process(job: Job<EventData | BatchEventData>): Promise<void> {
    // Check if batch or single event
    const isBatch = "batch" in job.data;
    const events = isBatch ? job.data.batch : [job.data];

    // Group events by type
    const eventsByType: Record<string, EventData[]> = {
      view: [],
      interaction: [],
      submission: [],
    };

    for (const event of events) {
      const validated = EventSchema.parse(event);
      eventsByType[validated.event_type].push(validated);
    }

    // Insert into ClickHouse
    await Promise.all([
      this.insertEvents("form_views", eventsByType.view),
      this.insertEvents("form_interactions", eventsByType.interaction),
      this.insertEvents("form_submissions", eventsByType.submission),
    ]);
  }

  private async insertEvents(table: string, events: EventData[]): Promise<void> {
    if (events.length === 0) return;

    try {
      // Build ClickHouse insert query
      const columns = Object.keys(events[0]).join(", ");
      const values = events
        .map((event) => {
          return `(${Object.values(event)
            .map((v) => (typeof v === "string" ? `'${v.replace(/'/g, "\\'")}'` : v))
            .join(", ")})`;
        })
        .join(", ");

      const query = `INSERT INTO ${config.clickhouse.database}.${table} (${columns}) VALUES ${values}`;

      // Execute query
      const response = await axios.post(config.clickhouse.url, query, {
        headers: {
          "X-ClickHouse-User": config.clickhouse.username,
          "X-ClickHouse-Key": config.clickhouse.password,
          "X-ClickHouse-Database": config.clickhouse.database,
        },
        timeout: 10000,
      });

      if (response.status !== 200) {
        throw new Error(`ClickHouse error: ${response.status}`);
      }

      logger.debug(
        {
          table,
          count: events.length,
        },
        "Inserted events into ClickHouse"
      );
    } catch (error) {
      logger.error(
        {
          error,
          table,
          count: events.length,
        },
        "Failed to insert events"
      );
      throw error;
    }
  }
}
