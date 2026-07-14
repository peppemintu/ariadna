// Renders a Markdown description string as safe formatted HTML. The HTML comes
// from renderMarkdown, which escapes first and only emits a fixed tag set, so
// dangerouslySetInnerHTML here is safe by construction.

import { useMemo } from "react";
import { renderMarkdown } from "@/lib/richText";
import styles from "./RichText.module.css";

interface RichTextProps {
  value: string | null | undefined;
  className?: string;
}

export function RichText({ value, className }: RichTextProps) {
  const html = useMemo(() => renderMarkdown(value), [value]);
  if (!html) return null;
  return (
    <div
      className={[styles.prose, className].filter(Boolean).join(" ")}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
