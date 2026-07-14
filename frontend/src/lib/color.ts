// Color helpers for arbitrary column colors.
//
// A column stores a single hex (e.g. "#0076f5"). From that one value we derive
// the whole column look:
//   * the HEADER is painted in the exact shade the user picked;
//   * the BODY is a muted tint of it, mixed with the current theme's surface via
//     CSS `color-mix` (see Column.module.css) so it reads correctly in BOTH the
//     light and dark themes without us knowing the theme here.
// The only thing we can't express purely in CSS is the header's text color,
// which must contrast against an arbitrary background — so we compute that in JS
// and hand it to CSS as a variable.

import type { CSSProperties } from "react";

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isValidHex(value: string | null | undefined): value is string {
  return typeof value === "string" && HEX_RE.test(value.trim());
}

/** Normalize "#abc" -> "#aabbcc"; returns null for anything invalid. */
export function normalizeHex(value: string | null | undefined): string | null {
  if (!isValidHex(value)) return null;
  let hex = value.trim().toLowerCase();
  if (hex.length === 4) {
    hex = "#" + [...hex.slice(1)].map((c) => c + c).join("");
  }
  return hex;
}

function channels(hex: string): [number, number, number] {
  const h = normalizeHex(hex) ?? "#000000";
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Concrete (theme-independent) ink/paper values from the design tokens. We
// return concrete hex — NOT the --ink-900 token — because that token flips with
// the theme, whereas the header background is a fixed color the user chose.
const INK = "#041425";
const PAPER = "#ffffff";

/** Pick the header text color that best contrasts the given background. */
export function readableTextOn(hex: string): string {
  return relativeLuminance(hex) > 0.5 ? INK : PAPER;
}

/**
 * Inline CSS variables for a colored column. Spread onto the column element;
 * the stylesheet consumes `--col-accent` / `--col-on-accent` and mixes the
 * muted body tint against the theme surface. Returns an empty object when there
 * is no color, so the column falls back to its neutral look.
 */
export function columnColorVars(color: string | null | undefined): CSSProperties {
  const hex = normalizeHex(color);
  if (!hex) return {};
  return {
    "--col-accent": hex,
    "--col-on-accent": readableTextOn(hex),
  } as CSSProperties;
}
