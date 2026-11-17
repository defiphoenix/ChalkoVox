import type { BoardElement, BoardTone, Lesson } from "@/lib/lesson/schema";

const TONE_COLOURS: Record<BoardTone, string> = {
  ink: "#111827",
  violet: "#6C4CF1",
  muted: "#98A2B3",
  green: "#0E9F6E",
  red: "#E5484D",
};

const FONT_SIZES = { sm: 17, md: 21, lg: 30, xl: 40 } as const;

export interface VideoFormat {
  label: "WebM" | "MP4";
  mimeType: string;
  extension: "webm" | "mp4";
}

export function getSupportedVideoFormats(): VideoFormat[] {
  if (typeof MediaRecorder === "undefined") return [];

  const candidates: VideoFormat[] = [
    { label: "WebM", mimeType: "video/webm;codecs=vp9,opus", extension: "webm" },
    { label: "WebM", mimeType: "video/webm;codecs=vp8,opus", extension: "webm" },
    { label: "WebM", mimeType: "video/webm", extension: "webm" },
    { label: "MP4", mimeType: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", extension: "mp4" },
    { label: "MP4", mimeType: "video/mp4", extension: "mp4" },
  ];
  const formats: VideoFormat[] = [];

  for (const candidate of candidates) {
    if (
      MediaRecorder.isTypeSupported(candidate.mimeType) &&
      !formats.some((format) => format.label === candidate.label)
    ) {
      formats.push(candidate);
    }
  }
  return formats;
}

export function splitNarration(text: string, limit = 600): string[] {
  const words = text.trim().split(/\s+/);
  const chunks: string[] = [];
  let chunk = "";

  for (const word of words) {
    if (word.length > limit) {
      throw new Error("Narration contains a word that is too long to synthesize.");
    }
    const next = chunk ? `${chunk} ${word}` : word;
    if (next.length > limit) {
      chunks.push(chunk);
      chunk = word;
    } else {
      chunk = next;
    }
  }

  if (chunk) chunks.push(chunk);
  return chunks;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapText(text: string, maxCharacters: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxCharacters && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }
  return lines;
}

function renderBoardElement(element: BoardElement): string {
  const colour = TONE_COLOURS[element.tone];
  switch (element.kind) {
    case "text": {
      const width = element.width ?? (element.size === "xl" ? 760 : element.size === "lg" ? 600 : 430);
      const fontSize = FONT_SIZES[element.size];
      const lines = wrapText(element.text, Math.max(10, Math.floor(width / (fontSize * 0.56))));
      const lineHeight = fontSize * 1.35;
      const text = lines
        .map(
          (line, index) =>
            `<tspan x="${element.x}" dy="${index === 0 ? fontSize : lineHeight}">${escapeXml(line)}</tspan>`,
        )
        .join("");
      const highlight = element.highlight
        ? `<rect x="${element.x - 8}" y="${element.y - 5}" width="${width}" height="${lines.length * lineHeight + 10}" rx="7" fill="#F2EFFF"/>`
        : "";
      return `${highlight}<text x="${element.x}" y="${element.y}" fill="${colour}" font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="${element.size === "xl" || element.size === "lg" || element.highlight ? 700 : 500}">${text}</text>`;
    }
    case "line":
    case "arrow": {
      const marker = element.kind === "arrow" ? ` marker-end="url(#arrow-${element.tone})"` : "";
      const dash = element.dashed ? ' stroke-dasharray="10 9"' : "";
      const label = element.label
        ? `<text x="${(element.x1 + element.x2) / 2}" y="${(element.y1 + element.y2) / 2 - 12}" text-anchor="middle" fill="${colour}" stroke="#fff" stroke-width="6" paint-order="stroke" font-family="Arial,sans-serif" font-size="19" font-weight="600">${escapeXml(element.label)}</text>`
        : "";
      return `<line x1="${element.x1}" y1="${element.y1}" x2="${element.x2}" y2="${element.y2}" stroke="${colour}" stroke-width="2.6" stroke-linecap="round"${marker}${dash}/>${label}`;
    }
    case "circle":
      return `<circle cx="${element.cx}" cy="${element.cy}" r="${element.r}" fill="none" stroke="${colour}" stroke-width="2.6"/>`;
    case "rect":
      return `<rect x="${element.x}" y="${element.y}" width="${element.w}" height="${element.h}" rx="10" fill="none" stroke="${colour}" stroke-width="2.6"/>`;
    case "dot":
      return `<circle cx="${element.cx}" cy="${element.cy}" r="${element.r}" fill="${colour}"/>`;
    case "path":
      return `<path d="${element.d}" fill="none" stroke="${colour}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
}

export function renderBoardSvg(elements: BoardElement[]): string {
  const markers = Object.entries(TONE_COLOURS)
    .map(
      ([tone, colour]) =>
        `<marker id="arrow-${tone}" viewBox="0 0 8 8" refX="6.5" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 .6 7.4 4 0 7.4Z" fill="${colour}"/></marker>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600" viewBox="0 0 1000 600"><defs>${markers}</defs><rect width="1000" height="600" fill="#fff"/>${elements.map(renderBoardElement).join("")}</svg>`;
}

function filenamePart(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "lesson";
}

export async function downloadLessonPptx(lesson: Lesson): Promise<void> {
  const response = await fetch("/api/lesson/export/pptx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lesson),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(payload?.error?.message || "Could not create PowerPoint.");
  }
  downloadBlob(await response.blob(), lessonExportFilename(lesson.title, "pptx"));
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > maxWidth && line) {
      context.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = next;
    }
  }
  if (line) context.fillText(line, x, y);
}

function drawBoard(context: CanvasRenderingContext2D, elements: BoardElement[]) {
  context.save();
  context.translate(55, 165);
  context.scale(0.8, 0.8);
  context.fillStyle = "#fff";
  context.fillRect(0, 0, 1000, 600);
  context.strokeStyle = "#EAECF0";
  context.lineWidth = 2;
  context.strokeRect(1, 1, 998, 598);

  for (const element of elements) {
    const colour = TONE_COLOURS[element.tone];
    context.strokeStyle = colour;
    context.fillStyle = colour;
    context.lineWidth = 2.8;
    context.lineCap = "round";
    context.lineJoin = "round";

    switch (element.kind) {
      case "text": {
        const fontSize = FONT_SIZES[element.size];
        const width = element.width ?? (element.size === "xl" ? 760 : element.size === "lg" ? 600 : 430);
        const left = element.x;
        const top = element.y;
        if (element.highlight) {
          context.fillStyle = "#F2EFFF";
          context.fillRect(left - 8, top - 4, width, fontSize * 2.1);
          context.fillStyle = colour;
        }
        context.font = `${element.size === "xl" || element.size === "lg" || element.highlight ? 700 : 500} ${fontSize}px Arial`;
        const maxCharacters = Math.max(10, Math.floor(width / (fontSize * 0.56)));
        let lineNumber = 0;
        for (const line of wrapText(element.text, maxCharacters)) {
          context.fillText(line, left, top + fontSize + lineNumber * fontSize * 1.35);
          lineNumber += 1;
        }
        break;
      }
      case "line":
      case "arrow":
        context.setLineDash(element.dashed ? [10, 9] : []);
        context.beginPath();
        context.moveTo(element.x1, element.y1);
        context.lineTo(element.x2, element.y2);
        context.stroke();
        context.setLineDash([]);
        if (element.kind === "arrow") {
          const angle = Math.atan2(element.y2 - element.y1, element.x2 - element.x1);
          context.beginPath();
          context.moveTo(element.x2, element.y2);
          context.lineTo(element.x2 - 12 * Math.cos(angle - 0.4), element.y2 - 12 * Math.sin(angle - 0.4));
          context.lineTo(element.x2 - 12 * Math.cos(angle + 0.4), element.y2 - 12 * Math.sin(angle + 0.4));
          context.closePath();
          context.fill();
        }
        if (element.label) {
          context.font = "600 19px Arial";
          context.textAlign = "center";
          context.fillText(element.label, (element.x1 + element.x2) / 2, (element.y1 + element.y2) / 2 - 12);
          context.textAlign = "left";
        }
        break;
      case "circle":
        context.beginPath();
        context.arc(element.cx, element.cy, element.r, 0, 2 * Math.PI);
        context.stroke();
        break;
      case "rect":
        context.strokeRect(element.x, element.y, element.w, element.h);
        break;
      case "dot":
        context.beginPath();
        context.arc(element.cx, element.cy, element.r, 0, 2 * Math.PI);
        context.fill();
        break;
      case "path":
        context.stroke(new Path2D(element.d));
        break;
    }
  }
  context.restore();
}

function drawVideoSlide(canvas: HTMLCanvasElement, lesson: Lesson, stepIndex: number) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not draw the video frames.");
  const step = lesson.steps[stepIndex];

  context.fillStyle = "#FAFAFC";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#6C4CF1";
  context.font = "700 18px Arial";
  context.fillText(lesson.subject.toUpperCase(), 55, 54);
  context.fillStyle = "#111827";
  context.font = "700 34px Arial";
  drawWrappedText(context, step.title, 55, 112, 1150, 42);
  drawBoard(context, step.board.elements);

  context.fillStyle = "#667085";
  context.font = "700 14px Arial";
  context.fillText("EXPLANATION", 900, 177);
  context.fillStyle = "#344054";
  context.font = "20px Arial";
  drawWrappedText(context, step.narration, 900, 214, 320, 30);

  context.fillStyle = "#98A2B3";
  context.font = "14px Arial";
  context.textAlign = "right";
  context.fillText(`${stepIndex + 1} / ${lesson.steps.length}`, 1225, 690);
  context.textAlign = "left";
}

async function synthesizeNarration(
  text: string,
  audioContext: AudioContext,
  onProgress: (message: string) => void,
  stepIndex: number,
  totalSteps: number,
): Promise<AudioBuffer[]> {
  const chunks = splitNarration(text);
  const buffers: AudioBuffer[] = [];
  for (let index = 0; index < chunks.length; index += 1) {
    onProgress(`Creating voiceover ${stepIndex + 1} of ${totalSteps}…`);
    const response = await fetch("/api/voice/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: chunks[index] }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      throw new Error(payload?.error?.message || `Could not create voiceover for step ${stepIndex + 1}.`);
    }
    buffers.push(await audioContext.decodeAudioData(await response.arrayBuffer()));
  }
  return buffers;
}

export async function createLessonVideo(
  lesson: Lesson,
  format: VideoFormat,
  onProgress: (message: string) => void,
): Promise<Blob> {
  if (typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream) {
    throw new Error("Video export is not supported by this browser.");
  }
  if (!MediaRecorder.isTypeSupported(format.mimeType)) {
    throw new Error(`${format.label} recording is not supported by this browser.`);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const audioContext = new AudioContext();
  let mediaRecorder: MediaRecorder | null = null;
  let mediaStream: MediaStream | null = null;

  try {
    await audioContext.resume();
    const voiceovers: AudioBuffer[][] = [];
    for (let index = 0; index < lesson.steps.length; index += 1) {
      voiceovers.push(
        await synthesizeNarration(
          lesson.steps[index].narration,
          audioContext,
          onProgress,
          index,
          lesson.steps.length,
        ),
      );
    }

    const audioDestination = audioContext.createMediaStreamDestination();
    mediaStream = canvas.captureStream(30);
    mediaStream.addTrack(audioDestination.stream.getAudioTracks()[0]);
    mediaRecorder = new MediaRecorder(mediaStream, { mimeType: format.mimeType });
    const chunks: BlobPart[] = [];
    const stopped = new Promise<Blob>((resolve, reject) => {
      if (!mediaRecorder) {
        reject(new Error("Video recorder could not be initialized."));
        return;
      }
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      mediaRecorder.onerror = () => reject(new Error("Video recording failed."));
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mediaRecorder?.mimeType || format.mimeType });
        if (!blob.size) reject(new Error("The video recording was empty."));
        else resolve(blob);
      };
    });

    drawVideoSlide(canvas, lesson, 0);
    mediaRecorder.start(1000);
    for (let stepIndex = 0; stepIndex < lesson.steps.length; stepIndex += 1) {
      onProgress(`Recording slide ${stepIndex + 1} of ${lesson.steps.length}…`);
      drawVideoSlide(canvas, lesson, stepIndex);
      await new Promise((resolve) => window.setTimeout(resolve, 300));
      for (const buffer of voiceovers[stepIndex]) {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioDestination);
        const ended = new Promise<void>((resolve) => {
          source.onended = () => resolve();
        });
        source.start();
        await ended;
        source.disconnect();
      }
    }
    mediaRecorder.stop();
    onProgress("Preparing download…");
    return await stopped;
  } finally {
    if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
    mediaStream?.getTracks().forEach((track) => track.stop());
    await audioContext.close();
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function lessonExportFilename(title: string, extension: string): string {
  return `${filenamePart(title)}.${extension}`;
}
