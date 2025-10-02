/**
 * HMAC validation middleware for webhooks
 */

import type { Env } from "../index";

export async function validateHMACMiddleware(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  next: () => Promise<Response>
): Promise<Response> {
  const signature = request.headers.get("X-Webhook-Signature");
  const timestamp = request.headers.get("X-Webhook-Timestamp");

  if (!signature || !timestamp) {
    return new Response(JSON.stringify({ error: "Missing signature headers" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check timestamp to prevent replay attacks (5 minute window)
  const now = Date.now();
  const webhookTime = parseInt(timestamp, 10) * 1000;
  if (Math.abs(now - webhookTime) > 5 * 60 * 1000) {
    return new Response(JSON.stringify({ error: "Request timestamp too old" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get request body
    const body = await request.text();

    // Calculate expected signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(env.HMAC_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureData = encoder.encode(`${timestamp}.${body}`);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, signatureData);
    const expectedSignature =
      "sha256=" + btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    // Compare signatures
    if (!timingSafeEqual(signature, expectedSignature)) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Reconstruct request with body
    const newRequest = new Request(request, { body });
    return await next();
  } catch (error) {
    console.error("HMAC validation error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
