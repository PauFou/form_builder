/**
 * CORS middleware for edge functions
 */

import type { Env } from "../index";

export async function corsMiddleware(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  next: () => Promise<Response>
): Promise<Response> {
  const origin = request.headers.get("Origin");
  const allowedOrigins = env.ALLOWED_ORIGINS.split(",");

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: getCORSHeaders(origin, allowedOrigins),
    });
  }

  // Add CORS headers to response
  const response = await next();
  const corsHeaders = getCORSHeaders(origin, allowedOrigins);

  // Clone response and add headers
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    newHeaders.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

function getCORSHeaders(origin: string | null, allowedOrigins: string[]): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-ID",
    "Access-Control-Max-Age": "86400",
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  } else if (allowedOrigins.includes("*")) {
    headers["Access-Control-Allow-Origin"] = "*";
  }

  return headers;
}
