/**
 * Route-level tests for POST /api/lesson: auth, validation, success and
 * provider error translation.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

vi.mock("@/lib/supabase/server", () => ({ getServerUser: vi.fn() }));
vi.mock("@/lib/lesson/service", () => ({ generateLesson: vi.fn() }));

import { POST } from "@/app/api/lesson/route";
import { AiError } from "@/lib/ai/openrouter";
import { DEMO_LESSON } from "@/lib/lesson/demo";
import { generateLesson } from "@/lib/lesson/service";
import { getServerUser } from "@/lib/supabase/server";

const USER = {
  id: "user-1",
  email: "learner@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-01-01T00:00:00Z",
} as User;

const request = (body: unknown) =>
  new Request("http://localhost/api/lesson", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("POST /api/lesson", () => {
  beforeEach(() => {
    vi.mocked(getServerUser).mockResolvedValue(USER);
    vi.mocked(generateLesson).mockResolvedValue(DEMO_LESSON);
  });

  it("returns 401 without a session", async () => {
    vi.mocked(getServerUser).mockResolvedValue(null);
    const response = await POST(request({ topic: "Fractions", level: "beginner" }));
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("UNAUTHENTICATED");
  });

  it("rejects an invalid topic before calling the model", async () => {
    const response = await POST(request({ topic: "ab" }));
    expect(response.status).toBe(400);
    expect(generateLesson).not.toHaveBeenCalled();
  });

  it("rejects a malformed JSON body", async () => {
    const response = await POST(request("not json"));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("INVALID_BODY");
  });

  it("returns the generated lesson", async () => {
    const response = await POST(request({ topic: "Area of a triangle", level: "beginner" }));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.lesson.title).toBe("Area of a Triangle");
    expect(generateLesson).toHaveBeenCalledWith({ topic: "Area of a triangle", level: "beginner" });
  });

  it("maps provider rate limits to 429", async () => {
    vi.mocked(generateLesson).mockRejectedValue(new AiError("AI_RATE_LIMITED", "The AI is busy.", 429));
    const response = await POST(request({ topic: "Fractions", level: "beginner" }));
    expect(response.status).toBe(429);
    expect((await response.json()).error.code).toBe("AI_RATE_LIMITED");
  });

  it("maps service failures to 502", async () => {
    vi.mocked(generateLesson).mockRejectedValue(new Error("invalid lesson"));
    const response = await POST(request({ topic: "Fractions", level: "beginner" }));
    expect(response.status).toBe(502);
    expect((await response.json()).error.code).toBe("LESSON_FAILED");
  });
});
