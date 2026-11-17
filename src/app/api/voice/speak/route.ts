/**
 * POST /api/voice/speak
 * Authenticated text-to-speech for step narration and tutor replies.
 */
import { errorResponse, firstIssue } from "@/lib/api/http";
import { ConfigError } from "@/lib/env/server";
import { DeepgramError, synthesiseSpeech } from "@/lib/deepgram/client";
import { withRequestLogging } from "@/lib/logging/request";
import { speakRequestSchema } from "@/lib/lesson/schema";
import { getServerUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function speakRoute(request: Request) {
  const user = await getServerUser();
  if (!user) return errorResponse(401, "UNAUTHENTICATED", "Sign in to use voice.");

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "INVALID_BODY", "Expected a JSON body.");
  }

  const parsed = speakRequestSchema.safeParse(payload);
  if (!parsed.success) return errorResponse(400, "INVALID_REQUEST", firstIssue(parsed.error));

  try {
    const audio = await synthesiseSpeech(parsed.data.text);
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof ConfigError) {
      return errorResponse(503, "VOICE_NOT_CONFIGURED", "Voice is not configured on the server.");
    }
    if (error instanceof DeepgramError) {
      return errorResponse(error.status, "SPEECH_FAILED", error.message);
    }
    return errorResponse(502, "SPEECH_FAILED", "Could not create audio. Try again.");
  }
}

export const POST = withRequestLogging("/api/voice/speak", speakRoute);
