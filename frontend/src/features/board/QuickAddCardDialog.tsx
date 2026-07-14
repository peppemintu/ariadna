// Board-level "Add card" dialog opened from the big toolbar button (or the
// keyboard shortcut). Unlike the per-column composer, this one lets you choose
// WHICH column the card lands in — right under the title, as requested — and
// remember a per-board default column so it's preselected next time.
//
// Enter creates the card from either the title field OR the column picker, so a
// title-then-Enter (or title, pick column, Enter) flow never touches the mouse.
// Focus inside the description editor keeps Enter as a normal newline.

import { useEffect, useRef, useState } from "react";
import { Button, Dialog, Input, RichTextEditor, Select } from "@/ui";
import { fromDatetimeLocalValue } from "@/lib/format";
import { useSettings } from "@/lib/settings";
import type { CardCreate, ColumnWithCards, UserResponse, UUID } from "@/api/types";
import styles from "./QuickAddCardDialog.module.css";

const UNASSIGNED = "__unassigned__";

interface Props {
  boardId: UUID;
  columns: ColumnWithCards[];
  members: UserResponse[];
  open: boolean;
  onClose: () => void;
  onCreate: (columnId: UUID, body: CardCreate) => void;
}

export function QuickAddCardDialog({ boardId, columns, members, open, onClose, onCreate }: Props) {
  const { getDefaultColumn, setDefaultColumn } = useSettings();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>(UNASSIGNED);
  const [columnId, setColumnId] = useState<UUID | "">("");
  const titleRef = useRef<HTMLInputElement>(null);

  // Read latest columns / default lookup without making them effect deps —
  // otherwise re-syncs (websocket) or toggling the default would reset the form
  // mid-edit. We only reset when the dialog actually opens.
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const getDefaultRef = useRef(getDefaultColumn);
  getDefaultRef.current = getDefaultColumn;

  useEffect(() => {
    if (!open) return;
    const cols = columnsRef.current;
    const preferred = getDefaultRef.current(boardId);
    const valid = cols.find((c) => c.id === preferred)?.id ?? cols[0]?.id ?? "";
    setColumnId(valid);
    setTitle("");
    setDescription("");
    setDeadline("");
    setAssigneeId(UNASSIGNED);
    const t = window.setTimeout(() => titleRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open, boardId]);

  const canSubmit = title.trim().length > 0 && columnId !== "";

  const submit = () => {
    if (!canSubmit) return;
    onCreate(columnId as UUID, {
      title: title.trim(),
      description: description.trim() || null,
      deadline: fromDatetimeLocalValue(deadline),
      assigneeId: assigneeId === UNASSIGNED ? null : assigneeId,
    });
    onClose();
  };

  const isDefault = getDefaultColumn(boardId) === columnId && columnId !== "";
  const toggleDefault = () => {
    if (columnId === "") return;
    setDefaultColumn(boardId, isDefault ? null : (columnId as UUID));
  };

  // Keep the selection valid if columns change live (e.g. the chosen column is
  // deleted by someone else over the websocket) while the dialog is open.
  useEffect(() => {
    if (!open || columnId === "") return;
    if (!columns.some((c) => c.id === columnId)) {
      const preferred = getDefaultRef.current(boardId);
      setColumnId(columns.find((c) => c.id === preferred)?.id ?? columns[0]?.id ?? "");
    }
  }, [open, columns, columnId, boardId]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Add card"
      width={560}
      footer={
        <div className={styles.footer}>
          <span className={styles.hintKbd}>
            <kbd>Enter</kbd> to create
          </span>
          <div className={styles.spacer} />
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit}>Create card</Button>
        </div>
      }
    >
      {columns.length === 0 ? (
        <p className={styles.noColumns}>Add a column first — cards need somewhere to live.</p>
      ) : (
        <div className={styles.form}>
          <Input
            ref={titleRef}
            label="Title"
            placeholder="What needs doing?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />

          <div className={styles.colField}>
            <span className={styles.colLabel}>Column</span>
            <div className={styles.selectRow}>
              <div className={styles.selectWrap}>
                <Select
                  value={columnId || undefined}
                  onChange={(v) => setColumnId(v as UUID)}
                  placeholder="Choose a column"
                  options={columns.map((c) => ({ value: c.id, label: c.title }))}
                />
              </div>
              <button
                type="button"
                className={styles.defaultToggle}
                data-on={isDefault ? "" : undefined}
                onClick={toggleDefault}
                disabled={columnId === ""}
                title={isDefault ? "This is your default column" : "Make this the default column"}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden fill={isDefault ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.9 6.1 22l1.2-6.5L2.5 9.4l6.6-.9z" />
                </svg>
                {isDefault ? "Default" : "Set default"}
              </button>
            </div>
          </div>

          <RichTextEditor
            label="Description"
            placeholder="Optional details… links, lists and formatting supported"
            value={description}
            onChange={setDescription}
            rows={4}
          />

          <div className={styles.rowTwo}>
            <Input
              type="datetime-local"
              label="Deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <Select
              label="Assignee"
              value={assigneeId}
              onChange={setAssigneeId}
              options={[
                { value: UNASSIGNED, label: "Unassigned" },
                ...members.map((m) => ({ value: m.id, label: m.name })),
              ]}
            />
          </div>
        </div>
      )}
    </Dialog>
  );
}
