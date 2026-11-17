/**
 * Next.js middleware entry point.
 *
 * Runs on the Node.js runtime (stable in Next 15.5) so page requests can be
 * written to the same file log as API routes. Route handlers under /api and
 * /auth log themselves through `withRequestLogging`; this file logs pages.
 */
import type { NextRequest } from "next/server";
import { getRequestId, logRequest } from "@/lib/logging/logger";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const started = performance.now();
  const requestId = getRequestId(request);

  // Forward the id so route handlers, server components and upstream logs can
  // correlate with this request. Remember: never forward secrets this way.
  request.headers.set("x-request-id", requestId);

  try {
    const response = await updateSession(request);
    response.headers.set("x-request-id", requestId);

    logRequest({
      requestId,
      kind: "page",
      method: request.method,
      path: request.nextUrl.pathname,
      status: response.status,
      durationMs: Math.round(performance.now() - started),
    });

    return response;
  } catch (error) {
    logRequest({
      requestId,
      kind: "page",
      method: request.method,
      path: request.nextUrl.pathname,
      status: 500,
      durationMs: Math.round(performance.now() - started),
      errorCode: "MIDDLEWARE_ERROR",
    });
    throw error;
  }
}

export const config = {
  // Page navigations only. Static assets and route handlers are excluded.
  matcher: [
    "/((?!api|auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml|woff2?|ttf|otf)$).*)",
  ],
  runtime: "nodejs",
};
