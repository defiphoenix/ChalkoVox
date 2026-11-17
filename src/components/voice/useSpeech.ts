/**
 * Deepgram text-to-speech player.
 * One shared instance per workspace prevents overlapping narration.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SpeechController {
  speakingId: string | null;
  error: string | null;
  speak: (text: string, id: string) => Promise<void>;
  stop: () => void;
}

export function useSpeech(): SpeechController {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  /** Stops playback and revokes the temporary object URL. */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setSpeakingId(null);
  }, []);

  useEffect(() => stop, [stop]);

  /** Requests audio for the text and plays it. */
  const speak = useCallback(
    async (text: string, id: string) => {
      stop();
      setError(null);
      setSpeakingId(id);

      try {
        const response = await fetch("/api/voice/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.slice(0, 600) }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
          throw new Error(payload?.error?.message || "Could not create audio.");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        urlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          urlRef.current = null;
          audioRef.current = null;
          setSpeakingId(null);
        };
        await audio.play();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Audio playback failed.");
        stop();
      }
    },
    [stop],
  );

  return { speakingId, error, speak, stop };
}
