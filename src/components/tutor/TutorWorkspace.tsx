/**
 * Tutor workspace orchestrator.
 * Owns lesson lifecycle, step progress, board narration playback and the
 * chat connection; individual panels remain presentational where possible.
 */
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/tutor/AppHeader";
import { CompletionCard } from "@/components/tutor/CompletionCard";
import { LessonBoard } from "@/components/tutor/LessonBoard";
import { LessonSidebar } from "@/components/tutor/LessonSidebar";
import { TopicStart } from "@/components/tutor/TopicStart";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useTutorChat } from "@/components/chat/useTutorChat";
import { useSpeech } from "@/components/voice/useSpeech";
import type { Lesson, LessonRequest } from "@/lib/lesson/schema";

export function TutorWorkspace({ email }: { email: string }) {
  const router = useRouter();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [finished, setFinished] = useState(false);
  const [topicOpen, setTopicOpen] = useState(true);
  const [draftSubject, setDraftSubject] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContext = useCallback(() => {
    if (!lesson) throw new Error("No active lesson.");
    return { lesson, stepIndex };
  }, [lesson, stepIndex]);

  const chat = useTutorChat({ getContext });
  const speech = useSpeech();

  const step = lesson?.steps[stepIndex];
  const total = lesson?.steps.length ?? 0;
  const listening = speech.speakingId === `step-${stepIndex}`;

  /** Adds a step to the completed set without duplicates. */
  function markDone(index: number) {
    setCompleted((previous) =>
      previous.includes(index) ? previous : [...previous, index].sort((a, b) => a - b),
    );
  }

  /** Opens the topic form, optionally pre-selecting a subject. */
  function openNewLesson(subject?: string) {
    setTopicOpen(true);
    setDraftSubject(subject ?? "");
    setError(null);
    setFinished(false);
    setPracticeOpen(false);
    speech.stop();
  }

  /** Generates a lesson and resets all session state on success. */
  async function handleGenerate(topic: string, level: LessonRequest["level"]) {
    setGenerating(true);
    setError(null);
    setTopicOpen(false);

    try {
      const response = await fetch("/api/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, level }),
      });

      if (response.status === 401) {
        router.replace("/login?next=/tutor");
        router.refresh();
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { lesson?: Lesson; error?: { message?: string } }
        | null;

      if (!response.ok || !payload?.lesson) {
        throw new Error(payload?.error?.message || "The lesson could not be generated.");
      }

      chat.reset();
      speech.stop();
      setLesson(payload.lesson);
      setStepIndex(0);
      setCompleted([]);
      setPracticeOpen(false);
      setFinished(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The lesson could not be generated.");
      setTopicOpen(true);
    } finally {
      setGenerating(false);
    }
  }

  /** Sends a chat message only when a lesson is active. */
  function sendChat(text: string) {
    if (!lesson) return;
    void chat.send(text);
  }

  /** Opens a check for the current step, or asks the tutor for one. */
  function handlePractice() {
    if (!step) {
      openNewLesson();
      return;
    }
    if (step.check) {
      setPracticeOpen(true);
      return;
    }
    void chat.send(`Give me one short practice question about "${step.title}", then wait for my answer.`);
  }

  /** Advances, or finishes the lesson on the last step. */
  function handleNext() {
    if (!lesson) return;
    markDone(stepIndex);
    speech.stop();
    setPracticeOpen(false);

    if (stepIndex >= lesson.steps.length - 1) {
      setCompleted(lesson.steps.map((_, index) => index));
      setFinished(true);
      return;
    }
    setStepIndex(stepIndex + 1);
  }

  /** Moves to an earlier step without changing completion. */
  function handlePrev() {
    if (stepIndex === 0) return;
    speech.stop();
    setPracticeOpen(false);
    setFinished(false);
    setStepIndex(stepIndex - 1);
  }

  /** Jumps from the lesson map. */
  function handleStep(index: number) {
    speech.stop();
    setPracticeOpen(false);
    setFinished(false);
    setStepIndex(index);
  }

  function handleListen() {
    if (!step) return;
    void speech.speak(`${step.title}. ${step.narration}`, `step-${stepIndex}`);
  }

  const activeTab = topicOpen ? "explore" : practiceOpen && !finished ? "practice" : "learn";

  return (
    <div className="app-shell">
      <AppHeader
        active={activeTab}
        email={email}
        onLearn={() => {
          if (!lesson) return;
          setTopicOpen(false);
          setFinished(false);
        }}
        onPractice={handlePractice}
        onExplore={() => openNewLesson()}
      />

      <main className="app-main">
        <div className="workspace">
          <LessonSidebar
            lesson={lesson}
            stepIndex={stepIndex}
            completed={completed}
            activeSubject={topicOpen ? draftSubject || null : lesson?.subject ?? null}
            finished={finished}
            onStep={handleStep}
            onSubject={openNewLesson}
            onNew={() => openNewLesson()}
          />

          {generating ? (
            <section className="board-card" aria-label="Generating lesson">
              <div className="board-loading">
                <div className="loader-line" />
                <p>Sketching the boards, narration and checks for your topic…</p>
              </div>
            </section>
          ) : topicOpen || !lesson ? (
            <TopicStart
              key={draftSubject}
              loading={generating}
              error={error}
              subject={draftSubject}
              canCancel={Boolean(lesson)}
              onGenerate={handleGenerate}
              onCancel={() => {
                setTopicOpen(false);
                setError(null);
              }}
            />
          ) : finished ? (
            <CompletionCard
              lesson={lesson}
              reviewed={completed.length}
              onReview={() => {
                setFinished(false);
                setStepIndex(0);
                setPracticeOpen(false);
              }}
              onNew={() => openNewLesson()}
            />
          ) : step ? (
            <LessonBoard
              lesson={lesson}
              step={step}
              stepIndex={stepIndex}
              completed={completed}
              practiceOpen={practiceOpen}
              listening={listening}
              onPrev={handlePrev}
              onNext={handleNext}
              onNew={() => openNewLesson()}
              onPractice={handlePractice}
              onListen={handleListen}
              onStopSpeech={speech.stop}
              onQuizAnswered={() => markDone(stepIndex)}
            />
          ) : null}

          <ChatPanel
            active={Boolean(lesson) && !topicOpen && !generating}
            messages={chat.messages}
            streaming={chat.streaming}
            error={chat.error}
            speechError={speech.error}
            speakingId={speech.speakingId}
            onSend={sendChat}
            onStop={chat.stop}
            onSpeak={speech.speak}
            onStopSpeech={speech.stop}
          />
        </div>
      </main>
    </div>
  );
}
