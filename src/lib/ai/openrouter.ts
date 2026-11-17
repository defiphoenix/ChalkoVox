/**
 * Minimal OpenRouter client.
 * All provider-specific behaviour is isolated here so routes and lesson
 * services can be tested with a mocked service or fetch.
 */
import { getOpenRouterSettings } from "@/lib/env/server";
import type { TutorMessage } from "@/lib/lesson/schema";

/** Normalised AI/provider failure that routes can translate into HTTP codes. */
export class AiError extends Error {
  constructor(
    public code:
      | "AI_UNREACHABLE"
      | "AI_RATE_LIMITED"
      | "AI_PAYMENT_REQUIRED"
      | "AI_BAD_RESPONSE"
      | "AI_INVALID_JSON",
    message: string,
    public status = 502,
  ) {
    super(message);
    this.name = "AiError";
  }
}

/** Extracts JSON from plain or fenced model output, tolerating stray prose. */
export function parseJsonContent(content: string): unknown {
  let text = content.trim();

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) text = fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new AiError("AI_INVALID_JSON", "The model did not return a JSON object.");
  }

  try {
    return JSON.parse(text.slice(start, end + 1)) as unknown;
  } catch {
    throw new AiError("AI_INVALID_JSON", "The model returned malformed JSON.");
  }
}

/** Normalises OpenRouter content, which may be a string or content parts. */
function normaliseContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "object" && part && "text" in part ? String((part as { text?: unknown }).text ?? "") : ""))
      .join("");
  }
  throw new AiError("AI_BAD_RESPONSE", "The model returned an empty response.");
}

/** Shared minimal fetch wrapper with consistent provider error mapping. */
async function callOpenRouter(body: Record<string, unknown>): Promise<Response> {
  const { apiKey, model, baseUrl } = getOpenRouterSettings();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, ...body }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch {
    throw new AiError("AI_UNREACHABLE", "Could not reach the AI provider. Try again.");
  }

  if (response.status === 429) {
    throw new AiError("AI_RATE_LIMITED", "The AI is busy right now. Try again in a moment.", 429);
  }

  if (response.status === 402) {
    throw new AiError(
      "AI_PAYMENT_REQUIRED",
      "The AI provider account has insufficient balance. Add credit to the provider and try again.",
      402,
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new AiError("AI_BAD_RESPONSE", `AI provider error (${response.status}). ${detail.slice(0, 160)}`.trim());
  }

  return response;
}

/** Requests a JSON object completion using the minimal chat-completions body. */
export async function completeJson(system: string, user: string): Promise<unknown> {
  const response = await callOpenRouter({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const data = (await response.json().catch(() => null)) as
    | { choices?: Array<{ message?: { content?: unknown } }> }
    | null;

  const content = data?.choices?.[0]?.message?.content;
  if (content === undefined || content === null) {
    throw new AiError("AI_BAD_RESPONSE", "The model returned no content.");
  }

  return parseJsonContent(normaliseContent(content));
}

/**
 * Converts OpenRouter's SSE byte stream into a plain UTF-8 text stream of
 * assistant tokens, which the chat route forwards to the browser.
 */
export function createContentStream(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  /** Returns the text carried by one SSE line, ignoring keep-alives. */
  const parseLine = (line: string): string => {
    if (!line.startsWith("data:")) return "";
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") return "";
    try {
      const event = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
      return event.choices?.[0]?.delta?.content ?? "";
    } catch {
      return "";
    }
  };

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          const tail = (buffer + decoder.decode()).split("\n");
          buffer = "";
          const text = tail.map(parseLine).join("");
          if (text) controller.enqueue(encoder.encode(text));
          controller.close();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        const text = lines.map(parseLine).join("");
        if (text) {
          controller.enqueue(encoder.encode(text));
          return;
        }
      }
    },
    cancel() {
      void reader.cancel();
    },
  });
}

/** Streams a grounded tutor reply from OpenRouter. */
export async function streamChat(system: string, messages: TutorMessage[]): Promise<ReadableStream<Uint8Array>> {
  const response = await callOpenRouter({
    messages: [{ role: "system", content: system }, ...messages],
    stream: true,
  });

  if (!response.body) {
    throw new AiError("AI_BAD_RESPONSE", "The AI provider returned an empty stream.");
  }

  return createContentStream(response.body);
}
