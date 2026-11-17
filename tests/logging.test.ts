/**
 * Request logging tests: JSONL output, status levels, error codes, thrown
 * errors, request-id handling and secret/path redaction.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { flushLogs, getRequestId } from "@/lib/logging/logger";
import { withRequestLogging } from "@/lib/logging/request";

let logDir: string;

beforeEach(async () => {
  logDir = await mkdtemp(path.join(tmpdir(), "chalkline-logs-"));
  vi.stubEnv("LOG_DIR", logDir);
  vi.stubEnv("LOG_TO_FILE", "true");
  vi.stubEnv("LOG_CONSOLE", "false");
  vi.stubEnv("LOG_LEVEL", "debug");
});

afterEach(async () => {
  await flushLogs();
  vi.unstubAllEnvs();
  await rm(logDir, { recursive: true, force: true });
});

/** Reads every JSONL record written by the current test. */
async function readRecords(): Promise<Array<Record<string, unknown>>> {
  await flushLogs();
  const files = (await readdir(logDir)).filter((name) => name.endsWith(".log"));
  const lines = await Promise.all(files.map((name) => readFile(path.join(logDir, name), "utf8")));
  return lines
    .join("")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe("withRequestLogging", () => {
  it("logs method, path, status and duration without the query string or headers", async () => {
    const handler = withRequestLogging("/api/test", async () => Response.json({ ok: true }));
    const response = await handler(
      new Request("http://localhost/api/test?token=top-secret", {
        method: "POST",
        headers: {
          authorization: "Bearer super-secret",
          "x-request-id": "req_12345678",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBe("req_12345678");

    const [record] = await readRecords();
    expect(record).toMatchObject({
      level: "info",
      event: "request",
      kind: "api",
      route: "/api/test",
      method: "POST",
      path: "/api/test",
      status: 200,
      requestId: "req_12345678",
    });
    expect(typeof record.durationMs).toBe("number");

    const raw = JSON.stringify(record);
    expect(raw).not.toContain("top-secret");
    expect(raw).not.toContain("super-secret");
  });

  it("captures the application error code and logs 4xx at warn level", async () => {
    const handler = withRequestLogging("/api/test", () =>
      Response.json({ error: { code: "INVALID_REQUEST", message: "nope" } }, { status: 400 }),
    );

    const response = await handler(new Request("http://localhost/api/test", { method: "POST" }));

    expect(response.status).toBe(400);
    const [record] = await readRecords();
    expect(record).toMatchObject({
      level: "warn",
      status: 400,
      errorCode: "INVALID_REQUEST",
    });
  });

  it("logs thrown errors and returns a safe 500 envelope", async () => {
    const handler = withRequestLogging("/api/test", () => {
      throw new Error("database exploded");
    });

    const response = await handler(new Request("http://localhost/api/test"));
    expect(response.status).toBe(500);
    expect((await response.json()).error.code).toBe("INTERNAL_ERROR");

    const records = await readRecords();
    const unhandled = records.find((record) => record.event === "request.unhandled");
    const request = records.find((record) => record.event === "request");

    expect(unhandled).toMatchObject({ level: "error", route: "/api/test", message: "database exploded" });
    expect(request).toMatchObject({ level: "error", status: 500, errorCode: "INTERNAL_ERROR" });
  });
});

describe("getRequestId", () => {
  it("keeps a safe upstream id", () => {
    const request = new Request("http://localhost/", { headers: { "x-request-id": "abc_DEF-123456" } });
    expect(getRequestId(request)).toBe("abc_DEF-123456");
  });

  it("replaces unsafe ids to prevent log injection", () => {
    const request = new Request("http://localhost/", { headers: { "x-request-id": "bad id with spaces" } });
    expect(getRequestId(request)).toMatch(/^[0-9a-f-]{36}$/);
  });
});
