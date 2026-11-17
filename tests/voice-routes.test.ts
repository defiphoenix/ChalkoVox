/**
 * Route-level tests for the Deepgram voice endpoints: auth, upload guards,
 * transcription success and MP3 speech responses.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";

vi.mock("@/lib/supabase/server", () => ({ getServerUser: vi.fn() }));
vi.mock("@/lib/deepgram/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/deepgram/client")>();
  return { ...actual, transcribeAudio: vi.fn(), synthesiseSpeech: vi.fn() };
});

import { POST as transcribePost } from "@/app/api/voice/transcribe/route";
import { POST as speakPost } from "@/app/api/voice/speak/route";
import { DeepgramError, synthesiseSpeech, transcribeAudio } from "@/lib/deepgram/client";
import { getServerUser } from "@/lib/supabase/server";

const USER = {
  id: "user-1",
  email: "learner@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2026-01-01T00:00:00Z",
} as User;

const audioForm = (type = "audio/webm") => {
  const form = new FormData();
  form.append("audio", new Blob([new Uint8Array([1, 2, 3])], { type }), "question.webm");
  return form;
};

const formRequest = (form: FormData) =>
  new Request("http://localhost/api/voice/transcribe", { method: "POST", body: form });

const speakRequest = (body: unknown) =>
  new Request("http://localhost/api/voice/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/voice/transcribe", () => {
  beforeEach(() => {
    vi.mocked(getServerUser).mockResolvedValue(USER);
    vi.mocked(transcribeAudio).mockResolvedValue("Why is the area halved?");
  });

  it("returns 401 without a session", async () => {
    vi.mocked(getServerUser).mockResolvedValue(null);
    const response = await transcribePost(formRequest(audioForm()));
    expect(response.status).toBe(401);
  });

  it("requires an audio file", async () => {
    const response = await transcribePost(formRequest(new FormData()));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("MISSING_AUDIO");
  });

  it("rejects unsupported upload types", async () => {
    const response = await transcribePost(formRequest(audioForm("text/plain")));
    expect(response.status).toBe(415);
  });

  it("returns the transcript", async () => {
    const response = await transcribePost(formRequest(audioForm()));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ transcript: "Why is the area halved?" });
  });

  it("maps empty speech to 422", async () => {
    vi.mocked(transcribeAudio).mockRejectedValue(new DeepgramError("No speech detected.", 422));
    const response = await transcribePost(formRequest(audioForm()));
    expect(response.status).toBe(422);
  });
});

describe("POST /api/voice/speak", () => {
  beforeEach(() => {
    vi.mocked(getServerUser).mockResolvedValue(USER);
    vi.mocked(synthesiseSpeech).mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
  });

  it("returns 401 without a session", async () => {
    vi.mocked(getServerUser).mockResolvedValue(null);
    const response = await speakPost(speakRequest({ text: "Hello" }));
    expect(response.status).toBe(401);
  });

  it("rejects empty text", async () => {
    const response = await speakPost(speakRequest({ text: "   " }));
    expect(response.status).toBe(400);
  });

  it("returns MP3 audio", async () => {
    const response = await speakPost(speakRequest({ text: "Listen to the board." }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("audio/mpeg");
    expect((await response.arrayBuffer()).byteLength).toBe(3);
    expect(synthesiseSpeech).toHaveBeenCalledWith("Listen to the board.");
  });

  it("maps provider failures", async () => {
    vi.mocked(synthesiseSpeech).mockRejectedValue(new DeepgramError("failed", 502));
    const response = await speakPost(speakRequest({ text: "Hello" }));
    expect(response.status).toBe(502);
  });
});
