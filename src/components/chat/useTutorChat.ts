/**
 * Streaming tutor chat state.
 * Keeps the visible transcript, sends the last 12 turns with lesson context,
 * and appends streamed tokens to the pending assistant message.
 */
"use client";

import { useCallback, useRef, useState } from "react";
import type { Lesson, TutorMessage } from "@/lib/lesson/schema";

export interface ChatMessage extends TutorMessage {
  id: string;
}

interface UseTutorChatArgs {
  getContext: () => { lesson: Lesson; stepIndex: number };
}

let messageSequence = 0;
const nextId = () => `m${Date.now()}-${messageSequence++}`;

export function useTutorChat({ getContext }: UseTutorChatArgs) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamingRef = useRef(false);

  /** Clears the conversation and cancels any in-flight answer. */
  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    streamingRef.current = false;
    setMessages([]);
    setStreaming(false);
    setError(null);
  }, []);

  /** Stops the active stream without clearing the transcript. */
  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    streamingRef.current = false;
    setStreaming(false);
  }, []);

  /** Sends a learner message and streams the tutor's reply. */
  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || streamingRef.current) return;

      const { lesson, stepIndex } = getContext();
      const step = lesson.steps[stepIndex];
      const userMessage: ChatMessage = { id: nextId(), role: "user", content: text };
      const assistantId = nextId();

      const history = [...messages, userMessage].slice(-12).map(({ role, content }) => ({ role, content }));

      setMessages((previous) => [...previous, userMessage, { id: assistantId, role: "assistant", content: "" }]);
      setStreaming(true);
      streamingRef.current = true;
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;
      let received = "";

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: history,
            stepIndex,
            context: {
              lessonTitle: lesson.title,
              subject: lesson.subject,
              summary: lesson.summary,
              stepTitle: step?.title ?? "",
              narration: step?.narration ?? "",
            },
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
          throw new Error(payload?.error?.message || "The tutor could not answer right now.");
        }
        if (!response.body) throw new Error("The tutor returned an empty answer.");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          received += decoder.decode(value, { stream: true });
          setMessages((previous) =>
            previous.map((message) => (message.id === assistantId ? { ...message, content: received } : message)),
          );
        }
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "The tutor could not answer right now.");
        if (!received) {
          setMessages((previous) => previous.filter((message) => message.id !== assistantId));
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          streamingRef.current = false;
          setStreaming(false);
        }
      }
    },
    [getContext, messages],
  );

  return { messages, streaming, error, send, stop, reset };
}
