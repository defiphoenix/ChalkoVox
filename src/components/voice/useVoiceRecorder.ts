/**
 * Browser microphone recorder.
 * Records a short clip, uploads it to the authenticated transcription route,
 * and hands the transcript back to the caller.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_RECORDING_MS = 45_000;

export function useVoiceRecorder(onTranscript: (text: string) => void) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef(onTranscript);

  useEffect(() => {
    transcriptRef.current = onTranscript;
  }, [onTranscript]);

  /** Releases the microphone and timers. */
  const release = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => release, [release]);

  /** Uploads the finished clip and reports the transcript. */
  const upload = useCallback(async (blob: Blob) => {
    setTranscribing(true);
    try {
      const form = new FormData();
      form.append("audio", blob, "question");

      const response = await fetch("/api/voice/transcribe", { method: "POST", body: form });
      const payload = (await response.json().catch(() => null)) as
        | { transcript?: string; error?: { message?: string } }
        | null;

      if (!response.ok || !payload?.transcript) {
        throw new Error(payload?.error?.message || "Could not transcribe your question.");
      }

      transcriptRef.current(payload.transcript);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Voice input failed.");
    } finally {
      setTranscribing(false);
    }
  }, []);

  /** Starts recording from the default microphone. */
  const start = useCallback(async () => {
    setError(null);
    if (recording || transcribing) return;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const preferred = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4"].find(
        (type) => typeof MediaRecorder.isTypeSupported !== "function" || MediaRecorder.isTypeSupported(type),
      );
      const recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        release();
        setRecording(false);
        const recordedType = recorder.mimeType.split(";")[0] || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: recordedType });
        chunksRef.current = [];
        if (blob.size === 0) {
          setError("No audio was captured. Try again.");
          return;
        }
        void upload(blob);
      };

      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      timerRef.current = setTimeout(() => recorder.state !== "inactive" && recorder.stop(), MAX_RECORDING_MS);
    } catch {
      setError("Microphone access was blocked. Allow it in your browser and try again.");
      release();
    }
  }, [recording, transcribing, release, upload]);

  /** Stops recording; the upload begins automatically. */
  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  return { recording, transcribing, error, start, stop };
}
