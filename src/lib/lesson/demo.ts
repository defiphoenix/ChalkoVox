/**
 * Static demo lesson used by the landing-page preview.
 * It also documents the lesson contract for new contributors.
 */
import type { Lesson } from "@/lib/lesson/schema";

export const DEMO_LESSON: Lesson = {
  title: "Area of a Triangle",
  subject: "Mathematics",
  summary: "Understand why a triangle's area is half of its base times its height.",
  steps: [
    {
      title: "Why half a rectangle?",
      narration:
        "A triangle's area is half of a rectangle with the same base and height. The height must meet the base at a right angle, so it can sit inside or outside the shape.",
      board: {
        elements: [
          { kind: "text", x: 50, y: 42, text: "Half the base times the perpendicular height.", size: "sm", tone: "muted", width: 470 },
          { kind: "text", x: 50, y: 96, text: "A = ½ × b × h", size: "lg", tone: "violet", highlight: true, width: 430 },
          { kind: "text", x: 50, y: 230, text: "b = base", size: "md", tone: "ink", width: 220 },
          { kind: "text", x: 50, y: 270, text: "h = height", size: "md", tone: "ink", width: 220 },
          { kind: "text", x: 50, y: 330, text: "Base and height must be perpendicular.", size: "sm", tone: "muted", width: 430 },
          { kind: "text", x: 50, y: 390, text: "The triangle fills exactly half of the rectangle.", size: "sm", tone: "ink", width: 440 },
          { kind: "path", d: "M 600 430 L 890 430 L 735 100 Z", tone: "violet" },
          { kind: "line", x1: 735, y1: 100, x2: 735, y2: 430, dashed: true, tone: "ink" },
          { kind: "line", x1: 590, y1: 468, x2: 900, y2: 468, tone: "violet", label: "b = 10 cm" },
          { kind: "text", x: 748, y: 250, text: "h = 6 cm", size: "sm", tone: "ink", width: 150 },
          { kind: "rect", x: 735, y: 410, w: 20, h: 20, tone: "muted" },
        ],
      },
      check: {
        question: "A triangle has base 10 cm and height 6 cm. What is its area?",
        options: ["60 cm²", "30 cm²", "16 cm²"],
        answer: 1,
        why: "Area = ½ × 10 × 6 = 30 cm². The rectangle would be 60 cm², and the triangle is half of it.",
      },
    },
    {
      title: "Work it through",
      narration:
        "Substitute the values one at a time. Multiply the base by the height, then halve the result. Writing each line makes mistakes easier to spot.",
      board: {
        elements: [
          { kind: "text", x: 50, y: 42, text: "Start from the formula.", size: "sm", tone: "muted", width: 400 },
          { kind: "text", x: 50, y: 85, text: "A = ½ × b × h", size: "md", tone: "ink", width: 400 },
          { kind: "text", x: 50, y: 135, text: "A = ½ × 10 × 6", size: "md", tone: "ink", width: 400 },
          { kind: "text", x: 50, y: 185, text: "A = ½ × 60", size: "md", tone: "ink", width: 400 },
          { kind: "text", x: 50, y: 245, text: "A = 30 cm²", size: "lg", tone: "violet", highlight: true, width: 380 },
          { kind: "path", d: "M 590 440 L 900 440 L 745 110 Z", tone: "violet" },
          { kind: "line", x1: 745, y1: 110, x2: 745, y2: 440, dashed: true, tone: "ink" },
          { kind: "text", x: 680, y: 505, text: "base 10 cm", size: "sm", tone: "muted", width: 240 },
          { kind: "text", x: 760, y: 250, text: "height 6", size: "sm", tone: "muted", width: 180 },
        ],
      },
      check: {
        question: "Which value do you halve?",
        options: ["The height only", "The base only", "The base × height product"],
        answer: 2,
        why: "The formula takes half of the whole base-times-height product.",
      },
    },
    {
      title: "Check the reasoning",
      narration:
        "A rectangle around the triangle contains two identical triangles. That is why the triangle fills exactly one half. This reasoning works for every triangle, including obtuse ones.",
      board: {
        elements: [
          { kind: "text", x: 50, y: 42, text: "A diagonal splits a rectangle into two equal triangles.", size: "sm", tone: "muted", width: 470 },
          { kind: "text", x: 50, y: 190, text: "Both halves are congruent.", size: "md", tone: "ink", width: 360 },
          { kind: "rect", x: 600, y: 130, w: 300, h: 300, tone: "ink" },
          { kind: "path", d: "M 600 130 L 900 430 L 900 130 Z", tone: "violet" },
          { kind: "path", d: "M 600 130 L 600 430 L 900 430 Z", tone: "muted" },
          { kind: "text", x: 50, y: 330, text: "Rectangle area = b × h", size: "md", tone: "ink", width: 420 },
          { kind: "text", x: 50, y: 385, text: "Triangle area = ½ × b × h", size: "md", tone: "violet", highlight: true, width: 450 },
        ],
      },
    },
  ],
};
