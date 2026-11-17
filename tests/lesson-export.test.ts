import { describe, expect, it } from "vitest";
import { renderBoardSvg, splitNarration } from "@/lib/lesson/export";

describe("lesson exports", () => {
  it("splits narration into chunks within the voice API limit", () => {
    const text = `${"one ".repeat(120)}${"two ".repeat(60)}`.trim();
    const chunks = splitNarration(text);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 600)).toBe(true);
    expect(chunks.join(" ")).toBe(text);
  });

  it("renders board text safely and includes vector elements", () => {
    const svg = renderBoardSvg([
      {
        kind: "text",
        x: 20,
        y: 30,
        text: "<hello & goodbye>",
        size: "md",
        tone: "ink",
      },
      {
        kind: "arrow",
        x1: 20,
        y1: 50,
        x2: 100,
        y2: 50,
        tone: "violet",
      },
    ]);

    expect(svg).toContain("&lt;hello &amp; goodbye&gt;");
    expect(svg).toContain('marker-end="url(#arrow-violet)"');
  });

  it("rejects narration containing a token larger than the provider limit", () => {
    expect(() => splitNarration("x".repeat(601))).toThrow(/too long/);
  });
});
