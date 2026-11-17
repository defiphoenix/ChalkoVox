/**
 * Route-handler wrapper that logs method, path, status, duration and the
 * application error code for every API request. It never logs headers,
 * cookies, query strings or bodies.
 */
import { flushLogs, getRequestId, logRequest, logger } from "@/lib/logging/logger";

type RouteHandler<Context> = (request: Request, context?: Context) => Response | Promise<Response>;

/** Safely extracts only the pathname, dropping query strings and fragments. */
function requestPath(request: Request): string {
  try {
    return new URL(request.url).pathname;
  } catch {
    return request.url.split(/[?#]/)[0] ?? "/";
  }
}

/** Reads the `{ error: { code } }` envelope from a failed response. */
async function errorCodeFrom(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.clone().json()) as { error?: { code?: unknown } };
    return typeof body.error?.code === "string" ? body.error.code : undefined;
  } catch {
    return undefined;
  }
}

/** Adds the request id to a response when its headers are still mutable. */
function tagResponse(response: Response, requestId: string) {
  try {
    response.headers.set("x-request-id", requestId);
  } catch {
    // Some responses (for example proxied ones) expose immutable headers.
  }
}

/**
 * Wraps a route handler with structured request logging.
 *
 * - Success and error responses are logged after the handler returns.
 * - Thrown errors are logged with a stack and returned as a safe JSON 500.
 * - The request id is echoed on the response for client/server correlation.
 */
export function withRequestLogging<Context = unknown>(
  route: string,
  handler: RouteHandler<Context>,
): RouteHandler<Context> {
  return async (request, context) => {
    const started = performance.now();
    const requestId = getRequestId(request);
    const method = request.method;
    const path = requestPath(request);

    try {
      const response = await handler(request, context);
      const errorCode = response.ok ? undefined : await errorCodeFrom(response);

      tagResponse(response, requestId);
      logRequest({
        requestId,
        kind: "api",
        method,
        path,
        route,
        status: response.status,
        durationMs: Math.round(performance.now() - started),
        errorCode,
      });

      return response;
    } catch (error) {
      logger.error("request.unhandled", {
        requestId,
        route,
        method,
        path,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.split("\n").slice(0, 6).join("\n") : undefined,
      });
      logRequest({
        requestId,
        kind: "api",
        method,
        path,
        route,
        status: 500,
        durationMs: Math.round(performance.now() - started),
        errorCode: "INTERNAL_ERROR",
      });

      return Response.json(
        { error: { code: "INTERNAL_ERROR", message: "Unexpected server error." } },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }
  };
}

/** Waits for pending log writes; used by tests and graceful shutdown. */
export { flushLogs };
