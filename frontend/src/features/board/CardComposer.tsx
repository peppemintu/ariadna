// Inline "add a card" control. With optimistic creation the card appears
// instantly, so the composer stays open and refocuses for rapid entry
// (Trello-style). Escape or Cancel closes it.

import { useRef, useState } from "react";
import { Button, Textarea } from "@/ui";
import styles from "./CardComposer.module.css";

interface Props {
  onCreate: (title: string) => void;
}

export function CardComposer({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const close = () => {
    setOpen(false);
    setTitle("");
  };

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setTitle("");
    areaRef.current?.focus(); // stay open — next card right away
  };

  if (!open) {
    return (
      <button className={styles.trigger} onClick={() => setOpen(true)}>
        + Add card
      </button>
    );
  }

  return (
    <div className={styles.composer}>
      <Textarea
        ref={areaRef}
        autoFocus
        placeholder="Card title…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") close();
        }}
      />
      <div className={styles.actions}>
        <Button size="sm" onClick={submit} disabled={!title.trim()}>Add</Button>
        <Button size="sm" variant="ghost" onClick={close}>Cancel</Button>
      </div>
    </div>
  );
}
