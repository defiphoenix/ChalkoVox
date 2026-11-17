/**
 * POST /api/lesson
 * Authenticated endpoint that generates one validated visual lesson.
 */
import { NextResponse } from "next/server";
import { AiError } from "@/lib/ai/openrouter";
import { errorResponse, firstIssue } from "@/lib/api/http";
import { ConfigError } from "@/lib/env/server";
import { withRequestLogging } from "@/lib/logging/request";
import { generateLesson } from "@/lib/lesson/service";
import { lessonRequestSchema } from "@/lib/lesson/schema";
import { getServerUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function generateLessonRoute(request: Request) {
  const user = await getServerUser();
  if (!user) return errorResponse(401, "UNAUTHENTICATED", "Sign in to generate a lesson.");

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "INVALID_BODY", "Expected a JSON body.");
  }

  const parsed = lessonRequestSchema.safeParse(payload);
  if (!parsed.success) return errorResponse(400, "INVALID_REQUEST", firstIssue(parsed.error));

  try {
    const lesson = await generateLesson(parsed.data);
    return NextResponse.json({ lesson });
  } catch (error) {
    if (error instanceof ConfigError) {
      return errorResponse(503, "AI_NOT_CONFIGURED", "The AI service is not configured on the server.");
    }
    if (error instanceof AiError) {
      return errorResponse(error.status, error.code, error.message);
    }
    const message = error instanceof Error ? error.message : "Lesson generation failed.";
    return errorResponse(502, "LESSON_FAILED", message);
  }
}

export const POST = withRequestLogging("/api/lesson", generateLessonRoute);
