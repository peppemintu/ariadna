// Column color picker — the Ariadna accent palette as hard-bordered swatches.

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
  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>
      <div className={styles.row} role="radiogroup" aria-label={label}>
        {COLUMN_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={value === c.value}
            className={styles.swatch}
            data-selected={value === c.value ? "" : undefined}
            style={{ background: c.value }}
            onClick={() => onChange(c.value)}
            title={c.name}
            aria-label={c.name}
          />
        ))}
      </div>
    </div>
  );
}
