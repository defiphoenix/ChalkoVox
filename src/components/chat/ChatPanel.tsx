/**
 * AI tutor chat panel: transcript, streaming state, suggestions, voice input
 * and Deepgram playback for individual answers.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Lightbulb,
  Loader2,
  MessageCircleQuestion,
  Mic,
  PenLine,
  Send,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { ChatMessage } from "@/components/chat/useTutorChat";
import { MessageText } from "@/components/chat/MessageText";
import { useVoiceRecorder } from "@/components/voice/useVoiceRecorder";

interface ChatPanelProps {
  active: boolean;
  messages: ChatMessage[];
  streaming: boolean;
  error: string | null;
  speechError: string | null;
  speakingId: string | null;
  onSend: (text: string) => void;
  onStop: () => void;
  onSpeak: (text: string, id: string) => Promise<void>;
  onStopSpeech: () => void;
}

const SUGGESTIONS = [
  { icon: Lightbulb, label: "Explain this step more simply" },
  { icon: PenLine, label: "Give me a worked example" },
  { icon: MessageCircleQuestion, label: "Quiz me on this step" },
];

export function ChatPanel({
  active,
  messages,
  streaming,
  error,
  speechError,
  speakingId,
  onSend,
  onStop,
  onSpeak,
  onStopSpeech,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const voice = useVoiceRecorder((transcript) => {
    setInput(transcript);
    inputRef.current?.focus();
  });

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, streaming]);

  /** Sends the typed message when it is non-empty. */
  function submit() {
    const text = input.trim();
    if (!text || !active || streaming) return;
    onSend(text);
    setInput("");
  }

  const voiceError = voice.error;
  const combinedError = [error, speechError, voiceError].filter(Boolean).join(" ");

  return (
    <aside className="chat-card" aria-label="AI tutor chat">
      <header className="chat-head">
        <div className="chat-id">
          <span className="spark" aria-hidden="true">
            <Sparkles size={17} />
          </span>
          <div>
            <h2>AI Tutor</h2>
            <span className="online">
              <i /> {active ? "Online · beside your board" : "Waiting for a lesson"}
            </span>
          </div>
        </div>
        {speakingId ? (
          <button className="icon-btn" type="button" onClick={onStopSpeech} title="Stop audio" aria-label="Stop audio">
            <VolumeX size={16} />
          </button>
        ) : null}
      </header>

      <div className="chat-scroll" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            <span className="spark" style={{ margin: "0 auto" }} aria-hidden="true">
              <Sparkles size={18} />
            </span>
            <h3>{active ? "Ask about this board" : "Your tutor is ready"}</h3>
            <p>
              {active
                ? "I can see the current step. Ask for a simpler explanation, an example, or a quick check."
                : "Start a lesson and the tutor will meet you at the whiteboard."}
            </p>
            {active ? (
              <div className="chat-suggestions">
                {SUGGESTIONS.map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    className="suggestion"
                    onClick={() => onSend(label)}
                    disabled={streaming}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          messages.map((message) => {
            const isTutor = message.role === "assistant";
            const isSpeaking = speakingId === message.id;
            const isEmpty = isTutor && message.content.length === 0;

            return (
              <div key={message.id} className={`msg ${isTutor ? "msg-tutor" : "msg-user"}`}>
                <span className="msg-role">{isTutor ? "AI Tutor" : "You"}</span>
                <div className="bubble">
                  {isEmpty ? (
                    <span className="typing" aria-label="Tutor is writing">
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : (
                    <MessageText content={message.content} />
                  )}
                </div>
                {isTutor && !isEmpty && !streaming ? (
                  <div className="msg-actions">
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => (isSpeaking ? onStopSpeech() : void onSpeak(message.content, message.id))}
                    >
                      <Volume2 size={11} style={{ verticalAlign: "-1px", marginRight: 3 }} />
                      {isSpeaking ? "Stop" : "Listen"}
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {combinedError ? (
        <div className="alert alert-error chat-error" role="alert">
          {combinedError}
        </div>
      ) : null}

      <div className="chat-compose">
        <div className="compose-box">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value.slice(0, 2000))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            placeholder={active ? "Ask a question…" : "Start a lesson to ask…"}
            disabled={!active || streaming}
            rows={1}
            aria-label="Message the AI tutor"
          />
          <button
            type="button"
            className={`icon-btn ${voice.recording ? "recording" : ""}`}
            onClick={() => (voice.recording ? voice.stop() : void voice.start())}
            disabled={!active || streaming || voice.transcribing}
            title={voice.recording ? "Stop recording" : "Ask by voice"}
            aria-label={voice.recording ? "Stop recording" : "Ask by voice"}
          >
            {voice.transcribing ? (
              <Loader2 size={16} className="spin" />
            ) : voice.recording ? (
              <Square size={13} fill="currentColor" />
            ) : (
              <Mic size={16} />
            )}
          </button>
          {streaming ? (
            <button type="button" className="icon-btn send" onClick={onStop} title="Stop answer" aria-label="Stop answer">
              <Square size={13} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              className="icon-btn send"
              onClick={submit}
              disabled={!active || !input.trim()}
              title="Send"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          )}
        </div>
        <div className="compose-hint">
          <span className={voice.recording ? "recording-label" : undefined}>
            {voice.recording
              ? "Recording — tap stop to transcribe"
              : voice.transcribing
                ? "Transcribing with Deepgram…"
                : "Enter to send · Shift+Enter for a new line"}
          </span>
          <span>{input.length}/2000</span>
        </div>
      </div>
    </aside>
  );
}
