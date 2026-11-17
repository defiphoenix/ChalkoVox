/**
 * HTTP helpers shared by API routes: consistent JSON errors and Zod messages.
 */
import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/** Standard error envelope used by every route. */
export function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Extracts a concise validation message for a 400 response. */
export function firstIssue(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request.";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
}
