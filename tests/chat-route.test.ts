/**
 * Route-level tests for POST /api/chat: auth, validation, context grounding
 * and streamed plain-text output.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

vi.mock("@/lib/supabase/server", () => ({ getServerUser: vi.fn() }));
vi.mock("@/lib/ai/openrouter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/openrouter")>();
  return { ...actual, streamChat: vi.fn() };
});

import { POST } from "@/app/api/chat/route";
import { AiError, streamChat } from "@/lib/ai/openrouter";
import { getServerUser } from "@/lib/supabase/server";

const USER = {
  id: "user-1",
  email: "learner@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-01-01T00:00:00Z",
} as User;

const chatBody = {
  messages: [{ role: "user", content: "Why is the area halved?" }],
  stepIndex: 0,
  context: {
    lessonTitle: "Area of a Triangle",
    subject: "Mathematics",
    summary: "Area is half base times height.",
    stepTitle: "Why half a rectangle?",
    narration: "A triangle fills half of a rectangle.",
  },
};

const request = (body: unknown) =>
  new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const replyStream = () =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("Because the rectangle holds two equal triangles."));
      controller.close();
    },
  });

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.mocked(getServerUser).mockResolvedValue(USER);
    vi.mocked(streamChat).mockResolvedValue(replyStream());
  });

  it("returns 401 without a session", async () => {
    vi.mocked(getServerUser).mockResolvedValue(null);
    const response = await POST(request(chatBody));
    expect(response.status).toBe(401);
  });

  it("rejects empty message lists", async () => {
    const response = await POST(request({ messages: [] }));
    expect(response.status).toBe(400);
    expect(streamChat).not.toHaveBeenCalled();
  });

  it("streams the tutor answer as plain text", async () => {
    const response = await POST(request(chatBody));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/plain");
    expect(await response.text()).toContain("two equal triangles");
  });

  it("grounds the system prompt in the supplied step context", async () => {
    await POST(request(chatBody));
    const [system, messages] = vi.mocked(streamChat).mock.calls[0];
    expect(system).toContain("Area of a Triangle");
    expect(system).toContain("Why half a rectangle?");
    expect(messages[0]).toEqual({ role: "user", content: "Why is the area halved?" });
  });

  it("maps upstream rate limits", async () => {
    vi.mocked(streamChat).mockRejectedValue(new AiError("AI_RATE_LIMITED", "Busy.", 429));
    const response = await POST(request(chatBody));
    expect(response.status).toBe(429);
  });
});
