/**
 * Analytics event handlers
 */

import { z } from "zod";
import type { Env } from "../index";

// Event schemas
const BaseEventSchema = z.object({
  form_id: z.string().uuid(),
  session_id: z.string(),
  respondent_key: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  user_agent: z.string().optional(),
  referrer_url: z.string().url().optional(),
});

const ViewEventSchema = BaseEventSchema.extend({
  event_type: z.literal("view"),
  page_load_time_ms: z.number().min(0),
  device_info: z
    .object({
      device_type: z.string().optional(),
      browser: z.string().optional(),
      os: z.string().optional(),
      screen_resolution: z.string().optional(),
    })
    .optional(),
});

const InteractionEventSchema = BaseEventSchema.extend({
  event_type: z.literal("interaction"),
  interaction_type: z.enum([
    "field_focus",
    "field_blur",
    "field_change",
    "step_view",
    "step_complete",
    "validation_error",
    "submit_attempt",
  ]),
  field_id: z.string().optional(),
  field_type: z.string().optional(),
  page_number: z.number().min(1).optional(),
  time_on_field_ms: z.number().min(0).optional(),
  error_info: z
    .object({
      error_type: z.string(),
      error_message: z.string(),
    })
    .optional(),
});

const SubmissionEventSchema = BaseEventSchema.extend({
  event_type: z.literal("submission"),
  is_complete: z.boolean(),
  is_partial: z.boolean(),
  total_time_ms: z.number().min(0).optional(),
  fields_completed: z.number().min(0).optional(),
  fields_total: z.number().min(0).optional(),
});

const EventSchema = z.discriminatedUnion("event_type", [
  ViewEventSchema,
  InteractionEventSchema,
  SubmissionEventSchema,
]);

const BatchEventSchema = z.object({
  events: z.array(EventSchema).min(1).max(1000),
});

export async function handleAnalyticsEvent(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  params: Record<string, string>
): Promise<Response> {
  try {
    const body = await request.json();

    // Validate event
    const event = EventSchema.parse(body);

    // Enrich event with request data
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      ip_address: request.headers.get("CF-Connecting-IP") || "",
      country_code: request.headers.get("CF-IPCountry") || "",
      user_agent: event.user_agent || request.headers.get("User-Agent") || "",
    };

    // Queue for processing
    await env.EVENT_QUEUE.send(enrichedEvent);

    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.error("Analytics error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleAnalyticsBatch(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  params: Record<string, string>
): Promise<Response> {
  try {
    const body = await request.json();

    // Validate batch
    const batch = BatchEventSchema.parse(body);

    // Enrich and queue events
    const timestamp = new Date().toISOString();
    const ipAddress = request.headers.get("CF-Connecting-IP") || "";
    const countryCode = request.headers.get("CF-IPCountry") || "";
    const userAgent = request.headers.get("User-Agent") || "";

    const enrichedEvents = batch.events.map((event) => ({
      ...event,
      timestamp: event.timestamp || timestamp,
      ip_address: ipAddress,
      country_code: countryCode,
      user_agent: event.user_agent || userAgent,
    }));

    // Send to queue in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < enrichedEvents.length; i += BATCH_SIZE) {
      const chunk = enrichedEvents.slice(i, i + BATCH_SIZE);
      await env.EVENT_QUEUE.send({ batch: chunk });
    }

    return new Response(
      JSON.stringify({
        accepted: enrichedEvents.length,
      }),
      {
        status: 202,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.error("Batch analytics error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
