/**
 * Form submission handlers
 */

import { z } from "zod";
import type { Env } from "../index";

// Submission schemas
const SubmissionSchema = z.object({
  form_id: z.string().uuid(),
  session_id: z.string(),
  respondent_key: z.string().optional(),
  data: z.record(z.any()),
  metadata: z
    .object({
      started_at: z.string().datetime(),
      completed_at: z.string().datetime(),
      user_agent: z.string().optional(),
      referrer: z.string().optional(),
      utm_source: z.string().optional(),
      utm_medium: z.string().optional(),
      utm_campaign: z.string().optional(),
    })
    .optional(),
});

const PartialSubmissionSchema = z.object({
  form_id: z.string().uuid(),
  session_id: z.string(),
  respondent_key: z.string().optional(),
  current_step: z.number().min(0),
  data: z.record(z.any()),
  metadata: z
    .object({
      last_updated: z.string().datetime(),
      user_agent: z.string().optional(),
    })
    .optional(),
});

export async function handleSubmission(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  params: Record<string, string>
): Promise<Response> {
  try {
    const body = await request.json();
    const { formId } = params;

    // Validate submission
    const submission = SubmissionSchema.parse({
      ...body,
      form_id: formId,
    });

    // Generate submission ID
    const submissionId = crypto.randomUUID();

    // Enrich submission
    const enrichedSubmission = {
      id: submissionId,
      ...submission,
      ip_address: request.headers.get("CF-Connecting-IP") || "",
      country_code: request.headers.get("CF-IPCountry") || "",
      created_at: new Date().toISOString(),
    };

    // Queue for processing
    await env.SUBMISSION_QUEUE.send(enrichedSubmission);

    // Also track as analytics event
    await env.EVENT_QUEUE.send({
      event_type: "submission",
      form_id: formId,
      submission_id: submissionId,
      session_id: submission.session_id,
      respondent_key: submission.respondent_key,
      is_complete: true,
      is_partial: false,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        id: submissionId,
        status: "accepted",
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

    console.error("Submission error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handlePartialSubmission(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  params: Record<string, string>
): Promise<Response> {
  try {
    const body = await request.json();
    const { formId } = params;

    // Validate partial submission
    const partial = PartialSubmissionSchema.parse({
      ...body,
      form_id: formId,
    });

    // Create key for deduplication
    const partialKey = `${formId}:${partial.session_id}`;

    // Queue for processing with idempotency key
    await env.SUBMISSION_QUEUE.send({
      type: "partial",
      key: partialKey,
      ...partial,
      updated_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        status: "saved",
        session_id: partial.session_id,
      }),
      {
        status: 200,
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

    console.error("Partial submission error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
