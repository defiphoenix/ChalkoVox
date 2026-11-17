/**
 * Pure SVG whiteboard renderer.
 * Draws the validated lesson elements on a 1000x600 canvas, with a subtle
 * stroke animation for each new step. No client hooks are required, so the
 * same component powers the landing preview and the tutor workspace.
 */
import type { CSSProperties } from "react";
import type { BoardElement, BoardTone } from "@/lib/lesson/schema";

const TONE_COLOURS: Record<BoardTone, string> = {
  ink: "#111827",
  violet: "#6C4CF1",
  muted: "#98A2B3",
  green: "#0E9F6E",
  red: "#E5484D",
};

const FONT_SIZES = { sm: 17, md: 21, lg: 30, xl: 40 } as const;

/** Rough wrap estimate for foreignObject height. */
function estimateHeight(text: string, width: number, size: keyof typeof FONT_SIZES, highlight: boolean) {
  const fontSize = FONT_SIZES[size];
  const perLine = Math.max(10, Math.floor(width / (fontSize * 0.56)));
  const lines = text.split("\n").reduce((total, line) => total + Math.max(1, Math.ceil(line.length / perLine)), 0);
  return fontSize * 1.35 * lines + (highlight ? 26 : 10);
}

/** One drawable element with its entry animation order. */
function ElementView({ element, order }: { element: BoardElement; order: number }) {
  const colour = TONE_COLOURS[element.tone];
  const animation = { "--order": order } as CSSProperties;

  switch (element.kind) {
    case "text": {
      const width = element.width ?? (element.size === "xl" ? 760 : element.size === "lg" ? 600 : 430);
      const height = estimateHeight(element.text, width, element.size, Boolean(element.highlight));
      const fontSize = FONT_SIZES[element.size];

      return (
        <foreignObject x={element.x} y={element.y} width={width} height={height} style={{ overflow: "visible" }}>
          <div
            className={element.highlight ? "board-label highlight board-element" : "board-label board-element"}
            style={{
              ...animation,
              fontSize,
              fontWeight: element.size === "xl" || element.size === "lg" ? 700 : element.highlight ? 600 : 500,
              color: colour,
              letterSpacing: element.size === "xl" ? "-0.02em" : undefined,
            }}
          >
            {element.text}
          </div>
        </foreignObject>
      );
    }

    case "line":
    case "arrow":
      return (
        <g key={order}>
          <line
            x1={element.x1}
            y1={element.y1}
            x2={element.x2}
            y2={element.y2}
            stroke={colour}
            strokeWidth={2.6}
            strokeLinecap="round"
            markerEnd={element.kind === "arrow" ? `url(#arrow-${element.tone})` : undefined}
            className={element.dashed ? "board-element" : "board-stroke"}
            style={element.dashed ? { ...animation, strokeDasharray: "10 9" } : animation}
            pathLength={element.dashed ? undefined : 1}
          />
          {element.label ? (
            <text
              x={(element.x1 + element.x2) / 2}
              y={(element.y1 + element.y2) / 2 - 12}
              textAnchor="middle"
              fontSize={19}
              fill={colour}
              stroke="#ffffff"
              strokeWidth={6}
              paintOrder="stroke"
              className="board-element"
              style={{ ...animation, fontWeight: 600 }}
            >
              {element.label}
            </text>
          ) : null}
        </g>
      );

    case "circle":
      return (
        <circle
          cx={element.cx}
          cy={element.cy}
          r={element.r}
          stroke={colour}
          strokeWidth={2.6}
          className="board-stroke"
          style={animation}
          pathLength={1}
        />
      );

    case "rect":
      return (
        <rect
          x={element.x}
          y={element.y}
          width={element.w}
          height={element.h}
          rx={10}
          stroke={colour}
          strokeWidth={2.6}
          className="board-stroke"
          style={animation}
          pathLength={1}
        />
      );

    case "dot":
      return (
        <circle cx={element.cx} cy={element.cy} r={element.r} fill={colour} className="board-dot" style={animation} />
      );

    case "path":
      return (
        <path
          d={element.d}
          stroke={colour}
          strokeWidth={2.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="board-stroke"
          style={animation}
          pathLength={1}
        />
      );

    default:
      return null;
  }
}

/** Renders a validated element list as a responsive whiteboard. */
export function Whiteboard({ elements, label = "Whiteboard explanation" }: { elements: BoardElement[]; label?: string }) {
  return (
    <svg
      viewBox="0 0 1000 600"
      role="img"
      aria-label={label}
      className="board-svg"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {(Object.keys(TONE_COLOURS) as BoardTone[]).map((tone) => (
          <marker
            key={tone}
            id={`arrow-${tone}`}
            viewBox="0 0 8 8"
            refX="6.5"
            refY="4"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0.6 L7.4 4 L0 7.4 Z" fill={TONE_COLOURS[tone]} />
          </marker>
        ))}
      </defs>

      {elements.map((element, index) => (
        <ElementView key={index} element={element} order={index} />
      ))}
    </svg>
  );
}
