// Column color picker — Ariadna accent presets plus a custom color well, so a
// column can be ANY color (the backend stores an arbitrary hex). A preset reads
// as selected when it matches the current value; otherwise the custom well holds
// the selection and shows the exact chosen hex.

import { useRef } from "react";
import { normalizeHex } from "@/lib/color";
import styles from "./ColorSwatches.module.css";

export const COLUMN_COLORS = [
  { value: "#0076f5", name: "Signal blue" },
  { value: "#1f9d57", name: "Go green" },
  { value: "#e8a400", name: "Hold amber" },
  { value: "#e73c04", name: "Flare orange" },
  { value: "#041425", name: "Ink" },
] as const;

interface Props {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
}

export function ColorSwatches({ value, onChange, label = "Color" }: Props) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const current = normalizeHex(value) ?? value;
  const isPreset = COLUMN_COLORS.some((c) => c.value === current);
  const customValue = isPreset ? "#8b5cf6" : current;

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>
      <div className={styles.row} role="radiogroup" aria-label={label}>
        {COLUMN_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={current === c.value}
            className={styles.swatch}
            data-selected={current === c.value ? "" : undefined}
            style={{ background: c.value }}
            onClick={() => onChange(c.value)}
            title={c.name}
            aria-label={c.name}
          />
        ))}

        {/* Custom color well — opens the native picker; the swatch shows the
            live custom value and reads as selected when no preset matches. */}
        <button
          type="button"
          className={styles.custom}
          data-selected={!isPreset ? "" : undefined}
          style={{ background: customValue }}
          onClick={() => colorInputRef.current?.click()}
          title="Custom color"
          aria-label="Choose a custom color"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          <input
            ref={colorInputRef}
            type="color"
            className={styles.nativeColor}
            value={customValue}
            onChange={(e) => onChange(e.target.value)}
            tabIndex={-1}
            aria-hidden
          />
        </button>
      </div>
    </div>
  );
}
