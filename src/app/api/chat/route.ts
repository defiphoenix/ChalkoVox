/**
 * POST /api/chat
 * Authenticated streaming tutor chat. Forwards plain text tokens from
 * OpenRouter so the client can render a live answer.
 */
import { AiError, streamChat } from "@/lib/ai/openrouter";
import { buildChatSystemPrompt, CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { errorResponse, firstIssue } from "@/lib/api/http";
import { ConfigError } from "@/lib/env/server";
import { withRequestLogging } from "@/lib/logging/request";
import { chatRequestSchema } from "@/lib/lesson/schema";
import { getServerUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function chatRoute(request: Request) {
  const user = await getServerUser();
  if (!user) return errorResponse(401, "UNAUTHENTICATED", "Sign in to chat with the tutor.");

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "INVALID_BODY", "Expected a JSON body.");
  }

  const parsed = chatRequestSchema.safeParse(payload);
  if (!parsed.success) return errorResponse(400, "INVALID_REQUEST", firstIssue(parsed.error));

  const { messages, context } = parsed.data;
  const system = context
    ? buildChatSystemPrompt(context.lessonTitle, context.subject, context.summary, context.stepTitle, context.narration)
    : CHAT_SYSTEM_PROMPT;

  try {
    const stream = await streamChat(system, messages);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (error instanceof ConfigError) {
      return errorResponse(503, "AI_NOT_CONFIGURED", "The AI service is not configured on the server.");
    }
    if (error instanceof AiError) {
      return errorResponse(error.status, error.code, error.message);
    }
    return errorResponse(502, "CHAT_FAILED", "The tutor could not answer. Try again.");
  }
}

export const POST = withRequestLogging("/api/chat", chatRoute);
