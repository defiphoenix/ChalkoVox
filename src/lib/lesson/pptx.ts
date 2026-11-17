import PptxGenJS from "pptxgenjs";
import { renderBoardSvg } from "@/lib/lesson/export";
import type { Lesson } from "@/lib/lesson/schema";

function svgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function createLessonPptx(lesson: Lesson): Promise<Uint8Array> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Chalkovox";
  pptx.subject = lesson.subject;
  pptx.title = lesson.title;
  pptx.company = "Chalkovox";

  lesson.steps.forEach((step, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: "FAFAFC" };
    slide.addText(lesson.subject.toUpperCase(), {
      x: 0.62,
      y: 0.3,
      w: 12.1,
      h: 0.25,
      fontFace: "Arial",
      fontSize: 10,
      bold: true,
      color: "6C4CF1",
      charSpacing: 1.2,
      margin: 0,
    });
    slide.addText(step.title, {
      x: 0.62,
      y: 0.65,
      w: 12.1,
      h: 0.64,
      fontFace: "Arial",
      fontSize: 25,
      bold: true,
      color: "111827",
      fit: "shrink",
      margin: 0,
    });
    slide.addImage({
      data: svgDataUri(renderBoardSvg(step.board.elements)),
      x: 0.62,
      y: 1.5,
      w: 8.67,
      h: 5.2,
    });
    slide.addText("EXPLANATION", {
      x: 9.65,
      y: 1.54,
      w: 3.05,
      h: 0.25,
      fontFace: "Arial",
      fontSize: 9,
      bold: true,
      color: "667085",
      charSpacing: 0.8,
      margin: 0,
    });
    slide.addText(step.narration, {
      x: 9.65,
      y: 1.92,
      w: 3.05,
      h: 4.65,
      fontFace: "Arial",
      fontSize: 15,
      color: "344054",
      valign: "top",
      fit: "shrink",
      margin: 0.04,
      paraSpaceAfter: 6,
    });
    slide.addText(`${index + 1} / ${lesson.steps.length}`, {
      x: 11.6,
      y: 7.05,
      w: 1.1,
      h: 0.2,
      fontFace: "Arial",
      fontSize: 9,
      color: "98A2B3",
      align: "right",
      margin: 0,
    });
  });

  const result = await pptx.write({ outputType: "uint8array" });
  if (!(result instanceof Uint8Array)) throw new Error("PowerPoint generation returned an invalid file.");
  return result;
}
