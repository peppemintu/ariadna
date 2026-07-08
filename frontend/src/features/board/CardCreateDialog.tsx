// Full "new card" dialog opened from a column header. Title is focused on open,
// Enter submits, the rest is optional.
//
// The card doesn't exist server-side yet, so "autosave" here means a local DRAFT:
// entered data is debounced into localStorage (per column) and restored if you
// reopen the dialog — so an accidental close doesn't lose work. A status pill
// shows when a draft is stored. Creating or discarding clears the draft.
//
// Any exit path with entered data still routes through requestClose for a
// discard confirmation (the draft is kept only if you don't discard).

import { useEffect, useRef, useState } from "react";
import { Button, ConfirmDialog, Dialog, Input, SaveIndicator, Select, Textarea } from "@/ui";
import { fromDatetimeLocalValue } from "@/lib/format";
import type { CardCreate, UserResponse, UUID } from "@/api/types";
import styles from "./CardCreateDialog.module.css";

const UNASSIGNED = "__unassigned__";
const DRAFT_MS = 700;
const draftKey = (columnId: UUID) => `ariadna:card-draft:${columnId}`;

interface DraftShape {
  title: string;
  description: string;
  deadline: string;
  assigneeId: string;
}

interface Props {
  columnId: UUID;
  columnTitle: string;
  members: UserResponse[];
  open: boolean;
  onClose: () => void;
  onCreate: (columnId: UUID, body: CardCreate) => void;
}

function readDraft(columnId: UUID): DraftShape | null {
  try {
    const raw = localStorage.getItem(draftKey(columnId));
    return raw ? (JSON.parse(raw) as DraftShape) : null;
  } catch {
    return null;
  }
}
function clearDraft(columnId: UUID) {
  try {
    localStorage.removeItem(draftKey(columnId));
  } catch {
    /* ignore */
  }
}

export function CardCreateDialog({ columnId, columnTitle, members, open, onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>(UNASSIGNED);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const timerRef = useRef<number | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // On open: restore a saved draft for this column, or start clean.
  useEffect(() => {
    if (!open) return;
    const draft = readDraft(columnId);
    if (draft) {
      setTitle(draft.title ?? "");
      setDescription(draft.description ?? "");
      setDeadline(draft.deadline ?? "");
      setAssigneeId(draft.assigneeId ?? UNASSIGNED);
      setHasDraft(true);
    } else {
      setTitle("");
      setDescription("");
      setDeadline("");
      setAssigneeId(UNASSIGNED);
      setHasDraft(false);
    }
    setConfirmOpen(false);
  }, [open, columnId]);

  const dirty =
    title.trim() !== "" ||
    description.trim() !== "" ||
    deadline !== "" ||
    assigneeId !== UNASSIGNED;

  // Debounced local draft save while the dialog is open.
  useEffect(() => {
    if (!open) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!dirty) {
      clearDraft(columnId);
      setHasDraft(false);
      return;
    }
    timerRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey(columnId),
          JSON.stringify({ title, description, deadline, assigneeId }),
        );
        setHasDraft(true);
      } catch {
        /* storage full / unavailable — silently skip */
      }
    }, DRAFT_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, deadline, assigneeId, open, columnId]);

  const requestClose = () => {
    if (dirty) setConfirmOpen(true);
    else onClose();
  };

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    onCreate(columnId, {
      title: t,
      description: description.trim() || null,
      deadline: fromDatetimeLocalValue(deadline),
      assigneeId: assigneeId === UNASSIGNED ? null : assigneeId,
    });
    clearDraft(columnId);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => !o && requestClose()}
        title={`New card in “${columnTitle}”`}
        width={520}
        footer={
          <div className={styles.footer}>
            {hasDraft && <SaveIndicator state="draft" />}
            <div className={styles.spacer} />
            <Button variant="ghost" onClick={requestClose}>Cancel</Button>
            <Button onClick={submit} disabled={!title.trim()}>Create card</Button>
          </div>
        }
      >
        <div className={styles.form}>
          <Input
            ref={titleRef}
            autoFocus
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
          <Textarea
            label="Description"
            placeholder="Optional details…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Discard this card?"
        description="Your draft is saved for this column and will be cleared if you discard."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        tone="danger"
        onConfirm={() => {
          clearDraft(columnId);
          setConfirmOpen(false);
          setHasDraft(false);
          onClose();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
