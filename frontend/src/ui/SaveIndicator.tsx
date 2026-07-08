// Tiny autosave status pill: coloured dot + label. Shared by the card editor
// (server autosave) and the card creator (local draft).

import styles from "./SaveIndicator.module.css";

export type SaveState = "saved" | "unsaved" | "saving" | "error" | "draft";

const LABEL: Record<SaveState, string> = {
  saved: "All changes saved",
  unsaved: "Unsaved changes",
  saving: "Saving…",
  error: "Couldn't save",
  draft: "Draft saved locally",
};

export function SaveIndicator({ state, label }: { state: SaveState; label?: string }) {
  return (
    <span className={styles.wrap} data-state={state} aria-live="polite">
      <span className={styles.dot} aria-hidden />
      {label ?? LABEL[state]}
    </span>
  );
}
