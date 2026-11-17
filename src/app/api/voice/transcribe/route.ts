/**
 * POST /api/voice/transcribe
 * Authenticated speech-to-text for short recorded questions.
 */
import { errorResponse } from "@/lib/api/http";
import { ConfigError } from "@/lib/env/server";
import { DeepgramError, isSupportedAudioType, MAX_AUDIO_BYTES, transcribeAudio } from "@/lib/deepgram/client";
import { withRequestLogging } from "@/lib/logging/request";
import { getServerUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function transcribeRoute(request: Request) {
  const user = await getServerUser();
  if (!user) return errorResponse(401, "UNAUTHENTICATED", "Sign in to use voice.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse(400, "INVALID_BODY", "Expected multipart form data.");
  }

  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return errorResponse(400, "MISSING_AUDIO", "Attach an audio recording.");
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return errorResponse(413, "AUDIO_TOO_LARGE", "Keep recordings under 12 MB (about 45 seconds).");
  }
  if (!isSupportedAudioType(audio.type)) {
    return errorResponse(415, "UNSUPPORTED_AUDIO", "Use a webm, ogg, wav or mp3 recording.");
  }

  try {
    const transcript = await transcribeAudio(audio);
    return Response.json({ transcript });
  } catch (error) {
    if (error instanceof ConfigError) {
      return errorResponse(503, "VOICE_NOT_CONFIGURED", "Voice is not configured on the server.");
    }
    if (error instanceof DeepgramError) {
      return errorResponse(error.status, "TRANSCRIPTION_FAILED", error.message);
    }
    return errorResponse(502, "TRANSCRIPTION_FAILED", "Could not transcribe audio. Try again.");
  }
}

export const POST = withRequestLogging("/api/voice/transcribe", transcribeRoute);
