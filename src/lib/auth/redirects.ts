/**
 * Post-login redirect validation.
 * Prevents open redirects by rejecting absolute and protocol-relative URLs.
 */

/** Returns a safe internal path, or the fallback when the input is unsafe. */
export function safeNextPath(value: string | null | undefined, fallback = "/tutor"): string {
  if (!value) return fallback;

  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.startsWith("/\\")) return fallback;
  if (trimmed.includes("\n") || trimmed.includes("\r")) return fallback;

  return trimmed;
}
