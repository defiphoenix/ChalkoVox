/**
 * Deepgram speech services: prerecorded transcription and Aura speech.
 * Both functions throw DeepgramError with a safe user-facing message.
 */
import { getDeepgramKey } from "@/lib/env/server";

const LISTEN_URL = "https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true&language=en";
const SPEAK_URL = "https://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=mp3";

/** Provider failure with a message safe to return to the learner. */
export class DeepgramError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
    this.name = "DeepgramError";
  }
}

/** Supported audio containers for the browser recorder upload. */
export const SUPPORTED_AUDIO_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/m4a",
] as const;

/** Max upload size for a short spoken question. */
export const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

/** Checks the MIME type without the codec suffix (audio/webm;codecs=opus). */
export function isSupportedAudioType(mime: string): boolean {
  const base = mime.split(";")[0].trim().toLowerCase();
  return (SUPPORTED_AUDIO_TYPES as readonly string[]).includes(base);
}

/** Transcribes a short audio clip using Deepgram Nova. */
export async function transcribeAudio(audio: Blob): Promise<string> {
  const response = await fetch(LISTEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Token ${getDeepgramKey()}`,
      "Content-Type": audio.type || "audio/webm",
    },
    body: await audio.arrayBuffer(),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new DeepgramError(`Transcription failed (${response.status}). ${detail.slice(0, 120)}`.trim());
  }

  const data = (await response.json().catch(() => null)) as
    | { results?: { channels?: Array<{ alternatives?: Array<{ transcript?: string }> }> } }
    | null;

  const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim();
  if (!transcript) {
    throw new DeepgramError("No speech was detected. Try again a little closer to the mic.", 422);
  }
  return transcript;
}

/** Synthesises narration with a Deepgram Aura voice. */
export async function synthesiseSpeech(text: string): Promise<ArrayBuffer> {
  const response = await fetch(SPEAK_URL, {
    method: "POST",
    headers: {
      Authorization: `Token ${getDeepgramKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new DeepgramError(`Speech synthesis failed (${response.status}). ${detail.slice(0, 120)}`.trim());
  }

  return response.arrayBuffer();
}
