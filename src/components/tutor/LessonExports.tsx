"use client";

import { useMemo, useState } from "react";
import { Film, Presentation } from "lucide-react";
import {
  createLessonVideo,
  downloadBlob,
  downloadLessonPptx,
  getSupportedVideoFormats,
  lessonExportFilename,
  type VideoFormat,
} from "@/lib/lesson/export";
import type { Lesson } from "@/lib/lesson/schema";

export function LessonExports({ lesson }: { lesson: Lesson }) {
  const formats = useMemo(() => getSupportedVideoFormats(), []);
  const [formatLabel, setFormatLabel] = useState<VideoFormat["label"]>(() => formats[0]?.label ?? "WebM");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const selectedFormat = formats.find((format) => format.label === formatLabel);
  const supportsMp4 = formats.some((format) => format.label === "MP4");

  async function exportPptx() {
    setBusy(true);
    setError("");
    setStatus("Preparing PowerPoint…");
    try {
      await downloadLessonPptx(lesson);
      setStatus("PowerPoint downloaded.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not export PowerPoint.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  async function exportVideo() {
    if (!selectedFormat) {
      setError("Video export is not supported by this browser.");
      return;
    }
    setBusy(true);
    setError("");
    setStatus("Preparing narration…");
    try {
      const blob = await createLessonVideo(lesson, selectedFormat, setStatus);
      downloadBlob(blob, lessonExportFilename(lesson.title, selectedFormat.extension));
      setStatus(`${selectedFormat.label} video downloaded.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not export video.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lesson-exports">
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={exportPptx}
        disabled={busy}
        aria-label="Export lesson as PowerPoint"
        title="Export PowerPoint"
      >
        <Presentation size={14} />
        <span className="export-label">Export PPTX</span>
      </button>
      <div className="video-export">
        <label className="sr-only" htmlFor="video-export-format">Video format</label>
        <select
          id="video-export-format"
          className="video-format-select"
          value={formatLabel}
          onChange={(event) => setFormatLabel(event.target.value as VideoFormat["label"])}
          disabled={busy}
        >
          <option value="WebM" disabled={!formats.some((format) => format.label === "WebM")}>
            WebM
          </option>
          <option value="MP4" disabled={!supportsMp4}>
            MP4{supportsMp4 ? "" : " (not supported)"}
          </option>
        </select>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={exportVideo}
          disabled={busy || !selectedFormat}
          aria-label="Export narrated video"
          title="Export narrated video"
        >
          <Film size={14} />
          <span className="export-label">Export video</span>
        </button>
      </div>
      {busy ? <span className="export-status" role="status">{status}</span> : null}
      {error ? <span className="export-error" role="alert">{error}</span> : null}
    </div>
  );
}
