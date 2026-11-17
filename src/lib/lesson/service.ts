/**
 * Lesson generation service.
 * Calls OpenRouter once, validates against the Zod contract, and retries once
 * with a repair instruction when the model output is structurally invalid.
 */
import { completeJson } from "@/lib/ai/openrouter";
import { buildLessonPrompt, LESSON_REPAIR_PROMPT, LESSON_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { lessonSchema, type Lesson, type LessonRequest } from "@/lib/lesson/schema";

/** Generates and validates a visual lesson for the requested topic. */
export async function generateLesson(input: LessonRequest): Promise<Lesson> {
  const prompt = buildLessonPrompt(input);

  const first = await completeJson(LESSON_SYSTEM_PROMPT, prompt);
  const firstResult = lessonSchema.safeParse(first);
  if (firstResult.success) return firstResult.data;

  const repaired = await completeJson(
    LESSON_SYSTEM_PROMPT,
    `${prompt}\n\n${LESSON_REPAIR_PROMPT}\n${firstResult.error.issues[0]?.message ?? ""}`,
  );
  const secondResult = lessonSchema.safeParse(repaired);
  if (secondResult.success) return secondResult.data;

  throw new Error("The lesson could not be validated. Try a slightly narrower topic.");
}
