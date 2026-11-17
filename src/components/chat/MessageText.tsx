/**
 * Renders the small subset of markdown the tutor is allowed to use:
 * paragraphs, line breaks and **bold** spans.
 */
import { Fragment } from "react";

export function MessageText({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index}>{part.slice(2, -2)}</strong>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
