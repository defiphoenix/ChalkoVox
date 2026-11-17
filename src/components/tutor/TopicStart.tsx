/**
 * Topic entry form shown at the start of a lesson or when exploring a new one.
 * Generation is delegated to the workspace; this component only collects input.
 */
"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { LessonRequest } from "@/lib/lesson/schema";

const IDEAS = [
  "Why does a derivative measure slope?",
  "How does photosynthesis store energy?",
  "Big-O notation, drawn simply",
  "Newton's third law with examples",
];

interface TopicStartProps {
  loading: boolean;
  error: string | null;
  subject?: string;
  canCancel: boolean;
  onGenerate: (topic: string, level: LessonRequest["level"]) => void;
  onCancel: () => void;
}

export function TopicStart({ loading, error, subject, canCancel, onGenerate, onCancel }: TopicStartProps) {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<LessonRequest["level"]>("beginner");

  /** Validates the short topic text and starts generation. */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = topic.trim();
    if (value.length < 3) return;
    onGenerate(value, level);
  }

  return (
    <div className="topic-wrap">
      <div className="topic-card">
        {canCancel ? (
          <button type="button" className="link-btn" onClick={onCancel} style={{ marginBottom: 14 }}>
            <ArrowLeft size={12} style={{ verticalAlign: "-1px", marginRight: 4 }} />
            Back to lesson
          </button>
        ) : null}

        <span className="eyebrow">{subject ? `New ${subject.toLowerCase()} lesson` : "New lesson"}</span>
        <h1>What do you want to understand?</h1>
        <p>
          Name a topic and the tutor will build a short visual lesson: three to five boards, explanations, checks,
          and a chat that knows what is on the board.
        </p>

        <form className="topic-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="topic">Topic</label>
            <input
              id="topic"
              name="topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder={subject ? `A ${subject.toLowerCase()} idea, e.g. ${IDEAS[0].toLowerCase()}` : IDEAS[0]}
              maxLength={140}
              required
              autoFocus
              disabled={loading}
            />
          </div>

          {error ? (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          ) : null}

          <div className="topic-row">
            <div className="field">
              <label htmlFor="level">Level</label>
              <select
                id="level"
                value={level}
                onChange={(event) => setLevel(event.target.value as LessonRequest["level"])}
                disabled={loading}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading || topic.trim().length < 3}>
              <Sparkles size={15} />
              {loading ? "Drawing…" : "Draw the lesson"}
            </button>
          </div>

          <div className="topic-suggestions">
            {IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                className="chip"
                onClick={() => setTopic(idea)}
                disabled={loading}
              >
                {idea}
              </button>
            ))}
          </div>
        </form>

        <p className="topic-foot">
          <Sparkles size={12} /> 3–5 boards · quick checks · voice-enabled
        </p>
      </div>
    </div>
  );
}
