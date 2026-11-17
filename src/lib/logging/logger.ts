/**
 * Server-only file logger.
 *
 * Writes one JSON object per line (JSONL) to `<LOG_DIR>/app-YYYY-MM-DD.log`.
 * This module uses Node.js APIs, so it is only safe from route handlers,
 * server components, instrumentation, and Node-runtime middleware.
 *
 * Design rules:
 * - Logging must never break a request: write failures fall back to stderr.
 * - Never log cookies, authorization headers, request bodies, or query
 *   strings. Callers pass only non-sensitive metadata.
 * - Writes are serialised so concurrent requests cannot interleave lines.
 */
import { appendFile, mkdir, readdir, unlink } from "fs/promises";
import path from "path";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFields = Record<string, unknown>;

const LEVEL_VALUE: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/** Serialises appends across concurrent requests. */
let writeQueue: Promise<void> = Promise.resolve();
let lastPrunedDay = "";
let fileWriteDisabled = false;
let warnedAboutFile = false;

/** Reads a boolean-ish env var with a default. */
function envFlag(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  return !["false", "0", "off", "no"].includes(raw);
}

function minLevel(): number {
  const raw = process.env.LOG_LEVEL?.trim().toLowerCase() as LogLevel | undefined;
  return raw && raw in LEVEL_VALUE ? LEVEL_VALUE[raw] : LEVEL_VALUE.info;
}

function logDir(): string {
  return path.resolve(process.env.LOG_DIR?.trim() || "logs");
}

function fileEnabled(): boolean {
  return !fileWriteDisabled && envFlag("LOG_TO_FILE", true);
}

function consoleEnabled(): boolean {
  return envFlag("LOG_CONSOLE", false);
}

function dayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Masks values for keys that commonly hold secrets, as defence in depth. */
const SECRET_KEY = /authorization|cookie|token|secret|password|api[-_]?key/i;

function sanitise(fields: LogFields): LogFields {
  const clean: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (SECRET_KEY.test(key)) {
      clean[key] = "[redacted]";
    } else if (typeof value === "string") {
      clean[key] = value.length > 2000 ? `${value.slice(0, 2000)}…` : value;
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/** Emits one line to stderr when the file sink is unavailable. */
function warnOnce(message: string) {
  if (warnedAboutFile) return;
  warnedAboutFile = true;
  console.error(`[logging] ${message}`);
}

/** Deletes daily files beyond LOG_MAX_FILES (default 14). */
async function prune(dir: string) {
  const keep = Math.max(1, Number.parseInt(process.env.LOG_MAX_FILES ?? "14", 10) || 14);
  try {
    const entries = await readdir(dir);
    const files = entries
      .filter((name) => /^app-\d{4}-\d{2}-\d{2}\.log$/.test(name))
      .sort()
      .reverse();
    await Promise.all(files.slice(keep).map((name) => unlink(path.join(dir, name)).catch(() => undefined)));
  } catch {
    // Retention is best-effort; never fail a request because pruning failed.
  }
}

/** Appends one serialised record to today's file. */
async function appendRecord(line: string) {
  const dir = logDir();
  await mkdir(dir, { recursive: true });

  const day = dayKey();
  const file = path.join(dir, `app-${day}.log`);
  await appendFile(file, line, "utf8");

  if (day !== lastPrunedDay) {
    lastPrunedDay = day;
    await prune(dir);
  }
}

/** Writes a structured record through the configured sinks. */
function writeRecord(level: LogLevel, event: string, fields: LogFields = {}) {
  if (LEVEL_VALUE[level] < minLevel()) return;

  const record = {
    ts: new Date().toISOString(),
    level,
    event,
    ...sanitise(fields),
  };
  const line = `${JSON.stringify(record)}\n`;

  if (consoleEnabled()) {
    console.log(line.trimEnd());
  }

  if (!fileEnabled()) {
    return;
  }

  writeQueue = writeQueue
    .then(() => appendRecord(line))
    .catch((error: unknown) => {
      // Most commonly EACCES/EROFS on read-only serverless filesystems.
      fileWriteDisabled = true;
      warnOnce(
        `Cannot write to ${logDir()}. Request logs will go to stderr instead. ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      process.stderr.write(line);
    });
}

/** Structured logger used by middleware, routes and instrumentation. */
export const logger = {
  debug(event: string, fields?: LogFields) {
    writeRecord("debug", event, fields);
  },
  info(event: string, fields?: LogFields) {
    writeRecord("info", event, fields);
  },
  warn(event: string, fields?: LogFields) {
    writeRecord("warn", event, fields);
  },
  error(event: string, fields?: LogFields) {
    writeRecord("error", event, fields);
  },
};

export type RequestLog = {
  requestId: string;
  kind: "api" | "page";
  method: string;
  path: string;
  status: number;
  durationMs: number;
  route?: string;
  errorCode?: string;
};

/** Logs a completed request at a level derived from its status. */
export function logRequest(entry: RequestLog) {
  const level: LogLevel = entry.status >= 500 ? "error" : entry.status >= 400 ? "warn" : "info";
  writeRecord(level, "request", entry);
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * Returns the upstream request id when it is safe, otherwise a fresh UUID.
 * Accepting arbitrary header values could allow log injection.
 */
export function getRequestId(request: Request): string {
  const incoming = request.headers.get("x-request-id")?.trim();
  if (incoming && REQUEST_ID_PATTERN.test(incoming)) return incoming;
  return crypto.randomUUID();
}

/** Resolves after all queued writes settle. Useful in tests and shutdown. */
export function flushLogs(): Promise<void> {
  return writeQueue;
}
