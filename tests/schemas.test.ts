/**
 * Contract tests for lesson/chat/voice schemas and auth redirect safety.
 */
import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/redirects";
import { DEMO_LESSON } from "@/lib/lesson/demo";
import {
  chatRequestSchema,
  lessonRequestSchema,
  lessonSchema,
  speakRequestSchema,
} from "@/lib/lesson/schema";

describe("lesson schema", () => {
  it("accepts the demo lesson", () => {
    const result = lessonSchema.safeParse(DEMO_LESSON);
    expect(result.success).toBe(true);
  });

  it("rejects elements outside the canvas", () => {
    const invalid = structuredClone(DEMO_LESSON);
    invalid.steps[0].board.elements[0] = {
      kind: "text",
      x: 1200,
      y: 40,
      text: "Off canvas",
      size: "md",
      tone: "ink",
    };
    expect(lessonSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects unsupported path syntax", () => {
    const invalid = structuredClone(DEMO_LESSON);
    invalid.steps[0].board.elements = [{ kind: "path", d: "M 0 0 <script>", tone: "ink" }];
    expect(lessonSchema.safeParse(invalid).success).toBe(false);
  });

  it("requires three to six steps", () => {
    const short = { ...DEMO_LESSON, steps: DEMO_LESSON.steps.slice(0, 2) };
    expect(lessonSchema.safeParse(short).success).toBe(false);
  });
});

describe("request schemas", () => {
  it("normalises a lesson request with the default level", () => {
    const parsed = lessonRequestSchema.parse({ topic: "  Quadratic equations  " });
    expect(parsed).toEqual({ topic: "Quadratic equations", level: "beginner" });
  });

  it("rejects a too-short topic", () => {
    expect(lessonRequestSchema.safeParse({ topic: "ab" }).success).toBe(false);
  });

  it("limits chat history to twelve turns", () => {
    const messages = Array.from({ length: 13 }, () => ({ role: "user" as const, content: "hello" }));
    expect(chatRequestSchema.safeParse({ messages }).success).toBe(false);
  });

  it("caps speech text at 600 characters", () => {
    expect(speakRequestSchema.safeParse({ text: "a".repeat(601) }).success).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("keeps internal paths", () => {
    expect(safeNextPath("/tutor?step=2")).toBe("/tutor?step=2");
  });

  it("falls back for external and protocol-relative URLs", () => {
    expect(safeNextPath("https://evil.example")).toBe("/tutor");
    expect(safeNextPath("//evil.example")).toBe("/tutor");
    expect(safeNextPath("/\\evil.example")).toBe("/tutor");
    expect(safeNextPath(null)).toBe("/tutor");
  });
});
