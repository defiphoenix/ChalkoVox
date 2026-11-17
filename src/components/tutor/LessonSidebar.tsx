/**
 * Left navigation: subjects, generated lesson map and progress.
 */
import Link from "next/link";
import type { CSSProperties } from "react";
import { Atom, Code2, FlaskConical, House, Leaf, Plus, Sigma } from "lucide-react";
import type { Lesson } from "@/lib/lesson/schema";

const SUBJECTS = [
  { name: "Mathematics", icon: Sigma },
  { name: "Physics", icon: Atom },
  { name: "Chemistry", icon: FlaskConical },
  { name: "Biology", icon: Leaf },
  { name: "Computer Science", icon: Code2 },
] as const;

interface LessonSidebarProps {
  lesson: Lesson | null;
  stepIndex: number;
  completed: number[];
  activeSubject: string | null;
  finished: boolean;
  onStep: (index: number) => void;
  onSubject: (subject: string) => void;
  onNew: () => void;
}

export function LessonSidebar({
  lesson,
  stepIndex,
  completed,
  activeSubject,
  finished,
  onStep,
  onSubject,
  onNew,
}: LessonSidebarProps) {
  const total = lesson?.steps.length ?? 0;
  const done = completed.filter((index) => index < total).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <nav className="sidebar" aria-label="Lesson navigation">
      <div className="side-nav">
        <Link className="side-link" href="/">
          <span className="side-icon">
            <House size={16} />
          </span>
          Home
        </Link>
        {SUBJECTS.map(({ name, icon: Icon }) => (
          <button
            key={name}
            type="button"
            className={`side-link ${activeSubject === name ? "active" : ""}`}
            onClick={() => onSubject(name)}
            aria-current={activeSubject === name ? "true" : undefined}
          >
            <span className="side-icon">
              <Icon size={16} />
            </span>
            {name}
          </button>
        ))}
      </div>

      <div className="side-heading">Lesson map</div>
      {lesson ? (
        <div className="lesson-map">
          {lesson.steps.map((step, index) => (
            <button
              key={`${step.title}-${index}`}
              type="button"
              className={`map-item ${completed.includes(index) ? "done" : ""}`}
              aria-current={!finished && index === stepIndex ? "step" : undefined}
              onClick={() => onStep(index)}
            >
              <span className="map-dot" aria-hidden="true">
                {completed.includes(index) ? "✓" : index + 1}
              </span>
              <span>{step.title}</span>
            </button>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 11.5, lineHeight: 1.55, color: "var(--muted)", padding: "0 11px" }}>
          Generated steps will appear here once you start a topic.
        </p>
      )}

      {lesson ? (
        <>
          <div className="progress-card">
            <div className="progress-top">
              <div className="progress-ring" style={{ "--pct": percent } as CSSProperties}>
                <span>{percent}%</span>
              </div>
              <div className="progress-copy">
                <strong>{lesson.title}</strong>
                <span>
                  {done} of {total} steps complete
                </span>
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-soft btn-sm" style={{ marginTop: 10 }} onClick={onNew}>
            <Plus size={14} /> New lesson
          </button>
        </>
      ) : null}

      <div className="sidebar-foot">
        <p>Chat and voice stay grounded in the step you are viewing.</p>
      </div>
    </nav>
  );
}
