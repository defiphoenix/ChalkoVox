/**
 * Deepgram client tests: MIME validation, transcript parsing and speech.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DeepgramError,
  isSupportedAudioType,
  synthesiseSpeech,
  transcribeAudio,
} from "@/lib/deepgram/client";

const audioBlob = () => new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm;codecs=opus" });

describe("isSupportedAudioType", () => {
  it("accepts codec suffixes and common containers", () => {
    expect(isSupportedAudioType("audio/webm;codecs=opus")).toBe(true);
    expect(isSupportedAudioType("audio/wav")).toBe(true);
    expect(isSupportedAudioType("audio/mp4")).toBe(true);
  });

  it("rejects non-audio uploads", () => {
    expect(isSupportedAudioType("text/plain")).toBe(false);
    expect(isSupportedAudioType("application/octet-stream")).toBe(false);
  });
});

describe("transcribeAudio", () => {
  beforeEach(() => {
    vi.stubEnv("DEEPGRAM_API_KEY", "dg-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends Nova and returns the transcript", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: { channels: [{ alternatives: [{ transcript: "What is half of the base?" }] }] },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const transcript = await transcribeAudio(audioBlob());
    expect(transcript).toBe("What is half of the base?");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("model=nova-3");
    expect((init.headers as Record<string, string>).Authorization).toBe("Token dg-key");
  });

  it("rejects empty speech with a 422 error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ results: { channels: [{ alternatives: [{ transcript: "" }] }] } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(transcribeAudio(audioBlob())).rejects.toMatchObject({ status: 422 });
  });

  it("maps provider failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad key", { status: 401 })));

    await expect(transcribeAudio(audioBlob())).rejects.toBeInstanceOf(DeepgramError);
  });
});

describe("synthesiseSpeech", () => {
  beforeEach(() => {
    vi.stubEnv("DEEPGRAM_API_KEY", "dg-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("requests Aura audio and returns the bytes", async () => {
    const bytes = new Uint8Array([9, 8, 7]);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(bytes, { status: 200, headers: { "Content-Type": "audio/mpeg" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await synthesiseSpeech("Listen to this step.");
    expect(result.byteLength).toBe(3);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({ text: "Listen to this step." });
  });
});
