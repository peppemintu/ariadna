// "Add column" tail at the end of the board row. Collapsed = dashed placeholder;
// expanded = title + color palette. Closes after creating (columns are rarer
// than cards, so no rapid-entry mode here).

import { useState } from "react";
import { Button, Input } from "@/ui";
import { ColorSwatches, COLUMN_COLORS } from "./ColorSwatches";
import styles from "./ColumnComposer.module.css";

interface Props {
  onCreate: (title: string, color: string) => void;
}

export function ColumnComposer({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState<string>(COLUMN_COLORS[0].value);

  const reset = () => {
    setOpen(false);
    setTitle("");
    setColor(COLUMN_COLORS[0].value);
  };

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    onCreate(t, color);
    reset();
  };

  if (!open) {
    return (
      <button className={styles.trigger} onClick={() => setOpen(true)} title="Add column">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
          <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" />
        </svg>
        Column
      </button>
    );
  }

  return (
    <div className={styles.panel}>
      <Input
        autoFocus
        label="Column title"
        placeholder="e.g. In review"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") reset();
        }}
      />
      <ColorSwatches value={color} onChange={setColor} />
      <div className={styles.actions}>
        <Button size="sm" onClick={submit} disabled={!title.trim()}>Add column</Button>
        <Button size="sm" variant="ghost" onClick={reset}>Cancel</Button>
      </div>
    </div>
  );
}
