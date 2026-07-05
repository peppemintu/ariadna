import type { ReactNode } from "react";
import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "signal" | "flare" | "success" | "warning" | "ink";

interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
}

/** Compact mono label chip. Optional leading status dot. */
export function Badge({ tone = "neutral", dot, children }: BadgeProps) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {dot && <span className={styles.dot} aria-hidden />}
      {children}
    </span>
  );
}
