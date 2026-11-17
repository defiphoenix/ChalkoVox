/**
 * POST /api/lesson/export/pptx
 * Authenticated PowerPoint export for a validated lesson.
 */
import { errorResponse, firstIssue } from "@/lib/api/http";
import { lessonExportFilename } from "@/lib/lesson/export";
import { createLessonPptx } from "@/lib/lesson/pptx";
import { lessonSchema } from "@/lib/lesson/schema";
import { withRequestLogging } from "@/lib/logging/request";
import { getServerUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function exportPptxRoute(request: Request) {
  const user = await getServerUser();
  if (!user) return errorResponse(401, "UNAUTHENTICATED", "Sign in to export this lesson.");

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "INVALID_BODY", "Expected a JSON body.");
  }

  const parsed = lessonSchema.safeParse(payload);
  if (!parsed.success) return errorResponse(400, "INVALID_LESSON", firstIssue(parsed.error));

  try {
    const file = await createLessonPptx(parsed.data);
    const body = new Uint8Array(file.byteLength);
    body.set(file);
    return new Response(body.buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${lessonExportFilename(parsed.data.title, "pptx")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return errorResponse(502, "PPTX_EXPORT_FAILED", "Could not create the PowerPoint file.");
  }
}

export const POST = withRequestLogging("/api/lesson/export/pptx", exportPptxRoute);
