/**
 * Multiple-choice check attached to a whiteboard step.
 * Shows immediate correctness and a short explanation.
 */
"use client";

import { useState } from "react";
import type { LessonStep } from "@/lib/lesson/schema";

interface StepQuizProps {
  check: NonNullable<LessonStep["check"]>;
  onAnswered?: () => void;
}

export function StepQuiz({ check, onAnswered }: StepQuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const locked = selected !== null;

  /** Locks in the answer and reports the attempt. */
  function choose(index: number) {
    if (locked) return;
    setSelected(index);
    onAnswered?.();
  }

  return (
    <div className="quiz">
      <div className="quiz-head">
        <span>Quick check</span>
        <span>{locked ? (selected === check.answer ? "Correct" : "Review") : "Try it"}</span>
      </div>
      <h4>{check.question}</h4>
      <div className="quiz-options">
        {check.options.map((option, index) => {
          const state = locked
            ? index === check.answer
              ? "correct"
              : index === selected
                ? "wrong"
                : ""
            : "";
          return (
            <button
              key={option}
              type="button"
              className={`quiz-option ${state}`}
              onClick={() => choose(index)}
              disabled={locked}
              aria-pressed={selected === index}
            >
              <span className="quiz-letter">{String.fromCharCode(65 + index)}</span>
              {option}
            </button>
          );
        })}
      </div>
      {locked ? (
        <p className="quiz-feedback">
          <strong>{selected === check.answer ? "That's right. " : "Not quite. "}</strong>
          {check.why}
        </p>
      ) : null}
    </div>
  );
}
