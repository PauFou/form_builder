/**
 * Rate limiting middleware using KV storage
 */

import type { Env } from "../index";

const RATE_LIMIT_WINDOW = 60; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // per minute

export async function rateLimitMiddleware(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  next: () => Promise<Response>
): Promise<Response> {
  // Get client identifier (IP or session)
  const clientId = getClientIdentifier(request);
  const key = `rate_limit:${clientId}`;

  try {
    // Get current count
    const current = await env.RATE_LIMIT.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= RATE_LIMIT_MAX_REQUESTS) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          retryAfter: RATE_LIMIT_WINDOW,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": RATE_LIMIT_WINDOW.toString(),
            "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": (Date.now() + RATE_LIMIT_WINDOW * 1000).toString(),
          },
        }
      );
    }

    // Increment counter
    await env.RATE_LIMIT.put(key, (count + 1).toString(), {
      expirationTtl: RATE_LIMIT_WINDOW,
    });

    // Add rate limit headers to response
    const response = await next();
    const newHeaders = new Headers(response.headers);
    newHeaders.set("X-RateLimit-Limit", RATE_LIMIT_MAX_REQUESTS.toString());
    newHeaders.set("X-RateLimit-Remaining", (RATE_LIMIT_MAX_REQUESTS - count - 1).toString());
    newHeaders.set("X-RateLimit-Reset", (Date.now() + RATE_LIMIT_WINDOW * 1000).toString());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    console.error("Rate limit error:", error);
    // Fail open - allow request if rate limiting fails
    return await next();
  }
}

function getClientIdentifier(request: Request): string {
  // Try to get real IP from CF headers
  const cfConnectingIP = request.headers.get("CF-Connecting-IP");
  if (cfConnectingIP) return cfConnectingIP;

  // Fallback to X-Forwarded-For
  const xForwardedFor = request.headers.get("X-Forwarded-For");
  if (xForwardedFor) return xForwardedFor.split(",")[0].trim();

  // Last resort - use a hash of headers
  const userAgent = request.headers.get("User-Agent") || "";
  const acceptLanguage = request.headers.get("Accept-Language") || "";
  return btoa(`${userAgent}:${acceptLanguage}`).substring(0, 16);
}
