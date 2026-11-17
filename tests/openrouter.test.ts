/**
 * OpenRouter client tests: JSON extraction, SSE parsing and error mapping.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiError, completeJson, createContentStream, parseJsonContent } from "@/lib/ai/openrouter";

const encoder = new TextEncoder();

describe("parseJsonContent", () => {
  it("parses plain JSON", () => {
    expect(parseJsonContent('{"ok":true}')).toEqual({ ok: true });
  });

  it("extracts fenced JSON with surrounding prose", () => {
    expect(parseJsonContent('Here you go:\n```json\n{"ok":1}\n```\nDone.')).toEqual({ ok: 1 });
  });

  it("throws an AI_INVALID_JSON error for non-JSON", () => {
    expect(() => parseJsonContent("no object here")).toThrowError(AiError);
    try {
      parseJsonContent("no object here");
    } catch (error) {
      expect((error as AiError).code).toBe("AI_INVALID_JSON");
    }
  });
});

describe("createContentStream", () => {
  it("joins streamed SSE deltas, including a split line", async () => {
    const payload =
      'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n' +
      'data: {"choices":[{"delta":{"content":"lo"}}]}\n\n' +
      "data: [DONE]\n\n";

    const upstream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(payload.slice(0, 30)));
        controller.enqueue(encoder.encode(payload.slice(30)));
        controller.close();
      },
    });

    const text = await new Response(createContentStream(upstream)).text();
    expect(text).toBe("Hello");
  });

  it("ignores malformed and empty events", async () => {
    const upstream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(": keep-alive\ndata: {broken}\n\n"));
        controller.close();
      },
    });

    const text = await new Response(createContentStream(upstream)).text();
    expect(text).toBe("");
  });
});

describe("completeJson", () => {
  beforeEach(() => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubEnv("OPENROUTER_MODEL", "test/model");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns parsed model content with a minimal request body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: '{"title":"Test"}' } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await completeJson("system", "user");
    expect(result).toEqual({ title: "Test" });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toEqual({
      model: "test/model",
      messages: [
        { role: "system", content: "system" },
        { role: "user", content: "user" },
      ],
    });
  });

  it("uses a custom OpenAI-compatible base URL", async () => {
    vi.stubEnv("OPENROUTER_BASE_URL", "https://api.example.test/v1/");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await completeJson("system", "user");
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.test/v1/chat/completions");
  });

  it("maps rate limits to a retryable error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("slow down", { status: 429 })));

    await expect(completeJson("s", "u")).rejects.toMatchObject({
      code: "AI_RATE_LIMITED",
      status: 429,
    });
  });

  it("maps payment-required responses to a clear error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("billing", { status: 402 })));

    await expect(completeJson("s", "u")).rejects.toMatchObject({
      code: "AI_PAYMENT_REQUIRED",
      status: 402,
    });
  });

  it("maps network failures to AI_UNREACHABLE", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(completeJson("s", "u")).rejects.toMatchObject({ code: "AI_UNREACHABLE" });
  });

  it("requires an API key", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    await expect(completeJson("s", "u")).rejects.toThrow(/OPENROUTER_API_KEY/);
  });
});
