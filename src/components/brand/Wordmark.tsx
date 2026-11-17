/**
 * Brand wordmark: graduation cap + product name.
 * Used on the landing page, auth screens and the app header.
 */
import Link from "next/link";

export function CapMark({ size = 38 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className="wordmark-svg"
      aria-hidden="true"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="38" height="38" rx="11" fill="#F2EFFF" />
      <path d="M7.5 16.2 20 10l12.5 6.2L20 22.4 7.5 16.2Z" fill="#6C4CF1" />
      <path
        d="M12.5 19.4v6.1c0 2.6 15 2.6 15 0v-6.1"
        stroke="#6C4CF1"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M32.5 16.7v7.1" stroke="#6C4CF1" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="32.5" cy="25.3" r="1.5" fill="#6C4CF1" />
    </svg>
  );
}

/** Linked brand block with optional subtitle. */
export function Wordmark({ href = "/", subtitle = true }: { href?: string; subtitle?: boolean }) {
  return (
    <Link href={href} className="wordmark" aria-label="Chalkovox home">
      <CapMark />
      <span className="brand-text">
        <span className="brand-title">Chalkovox</span>
        {subtitle ? <span className="brand-sub">AI Whiteboard Tutor</span> : null}
      </span>
    </Link>
  );
}
