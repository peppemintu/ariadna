// The primary "Add card" action, placed to the right of the board/list/activity
// tabs. A keyboard shortcut (C) opens the same dialog from anywhere on the
// board — matched by physical key code so it works on non-Latin layouts too
// (e.g. the Russian "с" sits on the same key).

import { useEffect, useState } from "react";
import type { CardCreate, ColumnWithCards, UserResponse, UUID } from "@/api/types";
import { QuickAddCardDialog } from "./QuickAddCardDialog";
import styles from "./BoardToolbar.module.css";

interface Props {
  boardId: UUID;
  columns: ColumnWithCards[];
  members: UserResponse[];
  onCreateCard: (columnId: UUID, body: CardCreate) => void;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export function BoardToolbar({ boardId, columns, members, onCreateCard }: Props) {
  const [open, setOpen] = useState(false);

  // Global shortcut — ignored while typing, using modifiers, or already open.
  // `e.code === "KeyC"` is layout-independent (fires on the physical C key
  // regardless of QWERTY/ЙЦУКЕН), unlike `e.key` which is the typed character.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (open || isTypingTarget(e.target)) return;
      if (e.code === "KeyC" || e.key.toLowerCase() === "c") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button className={styles.addCard} onClick={() => setOpen(true)} aria-keyshortcuts="c">
        <span className={styles.plus} aria-hidden>
          <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
            <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" />
          </svg>
        </span>
        <span className={styles.addLabel}>Add card</span>
        <kbd className={styles.kbd} aria-hidden>C</kbd>
      </button>

      <QuickAddCardDialog
        boardId={boardId}
        columns={columns}
        members={members}
        open={open}
        onClose={() => setOpen(false)}
        onCreate={onCreateCard}
      />
    </>
  );
}
