/**
 * Webhook event handlers (Stripe, etc.)
 */

import { z } from "zod";
import type { Env } from "../index";

// Stripe webhook event schema
const StripeEventSchema = z.object({
  id: z.string(),
  object: z.literal("event"),
  api_version: z.string(),
  created: z.number(),
  type: z.string(),
  data: z.object({
    object: z.record(z.any()),
  }),
  livemode: z.boolean(),
  pending_webhooks: z.number(),
  request: z
    .object({
      id: z.string().nullable(),
      idempotency_key: z.string().nullable(),
    })
    .optional(),
});

export async function handleWebhookEvent(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  params: Record<string, string>
): Promise<Response> {
  try {
    const body = await request.json();

    // Validate Stripe event
    const event = StripeEventSchema.parse(body);

    // Process based on event type
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event, env);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event, env);
        break;

      case "charge.dispute.created":
        await handleDisputeCreated(event, env);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Always return 200 to acknowledge receipt
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Invalid webhook payload:", error.errors);
      return new Response(
        JSON.stringify({
          error: "Invalid payload",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handlePaymentSucceeded(event: any, env: Env): Promise<void> {
  const paymentIntent = event.data.object;
  const metadata = paymentIntent.metadata || {};

  // Extract form and submission info from metadata
  const formId = metadata.form_id;
  const submissionId = metadata.submission_id;
  const sessionId = metadata.session_id;

  if (!formId || !submissionId) {
    console.error("Missing form or submission ID in payment metadata");
    return;
  }

  // Update submission with payment status
  await env.SUBMISSION_QUEUE.send({
    type: "payment_update",
    submission_id: submissionId,
    payment: {
      status: "succeeded",
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      processed_at: new Date().toISOString(),
    },
  });

  // Track analytics event
  await env.EVENT_QUEUE.send({
    event_type: "payment",
    form_id: formId,
    submission_id: submissionId,
    session_id: sessionId,
    payment_status: "succeeded",
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    timestamp: new Date().toISOString(),
  });
}

async function handlePaymentFailed(event: any, env: Env): Promise<void> {
  const paymentIntent = event.data.object;
  const metadata = paymentIntent.metadata || {};

  const formId = metadata.form_id;
  const submissionId = metadata.submission_id;
  const sessionId = metadata.session_id;

  if (!formId || !submissionId) {
    console.error("Missing form or submission ID in payment metadata");
    return;
  }

  // Update submission with failure
  await env.SUBMISSION_QUEUE.send({
    type: "payment_update",
    submission_id: submissionId,
    payment: {
      status: "failed",
      payment_intent_id: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message || "Payment failed",
      failed_at: new Date().toISOString(),
    },
  });

  // Track analytics event
  await env.EVENT_QUEUE.send({
    event_type: "payment",
    form_id: formId,
    submission_id: submissionId,
    session_id: sessionId,
    payment_status: "failed",
    error_code: paymentIntent.last_payment_error?.code,
    timestamp: new Date().toISOString(),
  });
}

async function handleDisputeCreated(event: any, env: Env): Promise<void> {
  const dispute = event.data.object;
  const paymentIntentId = dispute.payment_intent;

  // Log for monitoring
  console.warn("Payment dispute created:", {
    dispute_id: dispute.id,
    payment_intent: paymentIntentId,
    amount: dispute.amount,
    reason: dispute.reason,
  });

  // Could trigger alerts or update submission status
  // This would require looking up the submission by payment intent ID
}
