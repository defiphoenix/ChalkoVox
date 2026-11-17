/**
 * End-of-lesson summary card shown after the final step is finished.
 */
import { CheckCircle2, Plus, RotateCcw } from "lucide-react";
import type { Lesson } from "@/lib/lesson/schema";

interface CompletionCardProps {
  lesson: Lesson;
  reviewed: number;
  onReview: () => void;
  onNew: () => void;
}

export function CompletionCard({ lesson, reviewed, onReview, onNew }: CompletionCardProps) {
  return (
    <div className="completion-wrap">
      <div className="completion-card">
        <div className="completion-icon">
          <CheckCircle2 size={28} />
        </div>
        <h2>Lesson complete</h2>
        <p>{lesson.summary}</p>

        <div className="completion-stats">
          <div>
            <strong>{lesson.steps.length}</strong>
            <span>Boards</span>
          </div>
          <div>
            <strong>{reviewed}</strong>
            <span>Steps done</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>Complete</span>
          </div>
        </div>

        <div className="completion-actions">
          <button type="button" className="btn btn-ghost" onClick={onReview}>
            <RotateCcw size={14} /> Review board
          </button>
          <button type="button" className="btn btn-primary" onClick={onNew}>
            <Plus size={14} /> New topic
          </button>
        </div>
      </div>
    </div>
  );
}
