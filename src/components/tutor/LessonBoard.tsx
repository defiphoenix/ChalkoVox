/**
 * Center whiteboard card: breadcrumb, step navigation, SVG board, narration,
 * optional quick check and step controls.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  PencilRuler,
  Square,
  Volume2,
} from "lucide-react";
import { StepQuiz } from "@/components/quiz/StepQuiz";
import { LessonExports } from "@/components/tutor/LessonExports";
import { Whiteboard } from "@/components/whiteboard/Whiteboard";
import type { Lesson, LessonStep } from "@/lib/lesson/schema";

interface LessonBoardProps {
  lesson: Lesson;
  step: LessonStep;
  stepIndex: number;
  completed: number[];
  practiceOpen: boolean;
  listening: boolean;
  onPrev: () => void;
  onNext: () => void;
  onNew: () => void;
  onPractice: () => void;
  onListen: () => void;
  onStopSpeech: () => void;
  onQuizAnswered: () => void;
}

export function LessonBoard({
  lesson,
  step,
  stepIndex,
  completed,
  practiceOpen,
  listening,
  onPrev,
  onNext,
  onNew,
  onPractice,
  onListen,
  onStopSpeech,
  onQuizAnswered,
}: LessonBoardProps) {
  const [expanded, setExpanded] = useState(false);
  const quizRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (practiceOpen) quizRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [practiceOpen]);
  const total = lesson.steps.length;
  const isLast = stepIndex === total - 1;
  const doneCount = completed.filter((index) => index < total).length;

  return (
    <section className={`board-card ${expanded ? "expanded" : ""}`} aria-label="Lesson whiteboard">
      <header className="board-head">
        <div className="board-head-left">
          <button className="icon-btn" type="button" onClick={onNew} title="New lesson" aria-label="New lesson">
            <ArrowLeft size={16} />
          </button>
          <div className="breadcrumb">
            <span>{lesson.subject}</span>
            <ChevronRight size={12} />
            <strong>{lesson.title}</strong>
          </div>
        </div>

        <div className="board-tools">
          <LessonExports lesson={lesson} />
          <button
            className="icon-btn"
            type="button"
            onClick={onPrev}
            disabled={stepIndex === 0}
            title="Previous step"
            aria-label="Previous step"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="icon-btn"
            type="button"
            onClick={onNext}
            disabled={isLast}
            title="Next step"
            aria-label="Next step"
          >
            <ChevronRight size={16} />
          </button>
          <button
            className="icon-btn"
            type="button"
            onClick={() => setExpanded((value) => !value)}
            title={expanded ? "Exit full screen" : "Full screen board"}
            aria-label={expanded ? "Exit full screen" : "Full screen board"}
            aria-pressed={expanded}
          >
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      <div className="board-body">
        <div className="board-inner">
          <div className="board-kicker">
            <span className="kdot" />
            Step {stepIndex + 1} of {total} · {step.check ? "Teach + check" : "Concept"}
          </div>
          <h1 className="board-title">{step.title}</h1>

          <div className="board-stage">
            <Whiteboard
              key={stepIndex}
              elements={step.board.elements}
              label={`Whiteboard for step ${stepIndex + 1}: ${step.title}`}
            />
          </div>

          <div className="board-narration">
            <div className="narration-head">
              <span>Explanation</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={listening ? onStopSpeech : onListen}
              >
                {listening ? <Square size={12} fill="currentColor" /> : <Volume2 size={13} />}
                {listening ? "Stop" : "Listen"}
              </button>
            </div>
            <div className="narration-text">
              <p>{step.narration}</p>
            </div>
          </div>

          {practiceOpen && step.check ? (
            <div className="board-quiz" ref={quizRef}>
              <StepQuiz key={stepIndex} check={step.check} onAnswered={onQuizAnswered} />
            </div>
          ) : null}
        </div>
      </div>

      <footer className="board-foot">
        <div className="board-foot-left">
          <div className="step-dots" aria-hidden="true">
            {lesson.steps.map((_, index) => (
              <span
                key={index}
                className={`step-dot ${completed.includes(index) ? "done" : ""} ${
                  index === stepIndex ? "active" : ""
                }`}
              />
            ))}
          </div>
          <span className="board-foot-note">
            {doneCount} of {total} complete
          </span>
        </div>

        <div className="board-nav">
          <button type="button" className="btn btn-soft btn-sm" onClick={onPractice}>
            <PencilRuler size={13} /> Practice
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onNext}
          >
            {isLast ? "Finish" : "Next step"}
            {isLast ? null : <ChevronRight size={13} />}
          </button>
        </div>
      </footer>
    </section>
  );
}
