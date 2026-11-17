import { describe, expect, it } from "vitest";
import { createLessonPptx } from "@/lib/lesson/pptx";
import { DEMO_LESSON } from "@/lib/lesson/demo";

describe("createLessonPptx", () => {
  it("generates a PowerPoint archive from the lesson slides", async () => {
    const file = await createLessonPptx(DEMO_LESSON);

    expect(file.length).toBeGreaterThan(0);
    expect(file[0]).toBe(0x50);
    expect(file[1]).toBe(0x4b);
  });
});
