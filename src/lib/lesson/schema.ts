/**
 * Lesson contract shared by the AI service, API routes, UI and tests.
 * Everything the model returns is validated here before rendering.
 */
import { z } from "zod";

/** Visual ink colours available to whiteboard elements. */
export const boardToneSchema = z.enum(["ink", "violet", "muted", "green", "red"]).default("ink");

const coordX = z.number().min(0).max(1000);
const coordY = z.number().min(0).max(600);

const textElement = z.object({
  kind: z.literal("text"),
  x: coordX,
  y: coordY,
  text: z.string().min(1).max(220),
  size: z.enum(["sm", "md", "lg", "xl"]).default("md"),
  tone: boardToneSchema,
  highlight: z.boolean().optional(),
  width: z.number().min(120).max(920).optional(),
});

const lineElement = z.object({
  kind: z.enum(["line", "arrow"]),
  x1: coordX,
  y1: coordY,
  x2: coordX,
  y2: coordY,
  dashed: z.boolean().optional(),
  label: z.string().max(60).optional(),
  tone: boardToneSchema,
});

const circleElement = z.object({
  kind: z.literal("circle"),
  cx: coordX,
  cy: coordY,
  r: z.number().min(4).max(400),
  tone: boardToneSchema,
});

const rectElement = z.object({
  kind: z.literal("rect"),
  x: coordX,
  y: coordY,
  w: z.number().min(10).max(960),
  h: z.number().min(10).max(560),
  tone: boardToneSchema,
});

const dotElement = z.object({
  kind: z.literal("dot"),
  cx: coordX,
  cy: coordY,
  r: z.number().min(2).max(24).default(6),
  tone: boardToneSchema,
});

const pathElement = z.object({
  kind: z.literal("path"),
  d: z
    .string()
    .min(4)
    .max(600)
    .regex(/^[MmLlHhVvCcSsQqTtAaZz0-9\s.,-]+$/, "Path contains unsupported characters"),
  tone: boardToneSchema,
});

/** A single drawable element on the 1000x600 whiteboard. */
export const boardElementSchema = z.union([
  textElement,
  lineElement,
  circleElement,
  rectElement,
  dotElement,
  pathElement,
]);

/** One concept explained on the board, optionally followed by a check. */
export const lessonStepSchema = z.object({
  title: z.string().min(2).max(90),
  narration: z.string().min(10).max(900),
  board: z.object({
    elements: z.array(boardElementSchema).min(1).max(24),
  }),
  check: z
    .object({
      question: z.string().min(4).max(200),
      options: z.array(z.string().min(1).max(120)).length(3),
      answer: z.number().int().min(0).max(2),
      why: z.string().min(4).max(400),
    })
    .optional(),
});

/** A complete validated lesson. */
export const lessonSchema = z.object({
  title: z.string().min(2).max(90),
  subject: z.enum(["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Other"]),
  summary: z.string().min(10).max(300),
  steps: z.array(lessonStepSchema).min(3).max(6),
});

/** Input accepted by POST /api/lesson. */
export const lessonRequestSchema = z.object({
  topic: z.string().trim().min(3).max(140),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
});

/** Chat history accepted by POST /api/chat. */
export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(12),
  stepIndex: z.number().int().min(0).max(10).default(0),
  context: z
    .object({
      lessonTitle: z.string().max(90),
      subject: z.string().max(40),
      summary: z.string().max(300),
      stepTitle: z.string().max(90),
      narration: z.string().max(900),
    })
    .optional(),
});

/** Input accepted by POST /api/voice/speak. */
export const speakRequestSchema = z.object({
  text: z.string().trim().min(1).max(600),
});

export type BoardTone = z.infer<typeof boardToneSchema>;
export type BoardElement = z.infer<typeof boardElementSchema>;
export type LessonStep = z.infer<typeof lessonStepSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type LessonRequest = z.infer<typeof lessonRequestSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type TutorMessage = ChatRequest["messages"][number];
