import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

vi.mock("@/lib/supabase/server", () => ({ getServerUser: vi.fn() }));
vi.mock("@/lib/lesson/pptx", () => ({ createLessonPptx: vi.fn() }));

import { POST } from "@/app/api/lesson/export/pptx/route";
import { DEMO_LESSON } from "@/lib/lesson/demo";
import { createLessonPptx } from "@/lib/lesson/pptx";
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
  new Request("http://localhost/api/lesson/export/pptx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("POST /api/lesson/export/pptx", () => {
  beforeEach(() => {
    vi.mocked(getServerUser).mockResolvedValue(USER);
    vi.mocked(createLessonPptx).mockResolvedValue(new Uint8Array([0x50, 0x4b, 0x03, 0x04]));
  });

  it("requires an authenticated user", async () => {
    vi.mocked(getServerUser).mockResolvedValue(null);
    const response = await POST(request(DEMO_LESSON));

    expect(response.status).toBe(401);
  });

  it("rejects lessons that do not match the export schema", async () => {
    const response = await POST(request({ ...DEMO_LESSON, steps: [] }));

    expect(response.status).toBe(400);
    expect(createLessonPptx).not.toHaveBeenCalled();
  });

  it("returns a PowerPoint download for a valid lesson", async () => {
    const response = await POST(request(DEMO_LESSON));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("presentationml");
    expect(response.headers.get("content-disposition")).toContain(".pptx");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([0x50, 0x4b, 0x03, 0x04]));
  });
});
