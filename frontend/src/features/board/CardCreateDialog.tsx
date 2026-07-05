// Full "new card" dialog opened from a column header. Title is focused on open
// and Enter submits straight away; the rest (description / deadline / assignee)
// is optional. Creation is optimistic (see useCreateCard), so we close on submit
// and the placeholder card appears instantly.

import { useEffect, useRef, useState } from "react";
import { Button, Dialog, Input, Select, Textarea } from "@/ui";
import { fromDatetimeLocalValue } from "@/lib/format";
import type { CardCreate, UserResponse, UUID } from "@/api/types";
import styles from "./CardCreateDialog.module.css";

const UNASSIGNED = "__unassigned__";

interface Props {
  columnId: UUID;
  columnTitle: string;
  members: UserResponse[];
  open: boolean;
  onClose: () => void;
  onCreate: (columnId: UUID, body: CardCreate) => void;
}

export function CardCreateDialog({ columnId, columnTitle, members, open, onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>(UNASSIGNED);
  const titleRef = useRef<HTMLInputElement>(null);

  // Reset the form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setDeadline("");
    setAssigneeId(UNASSIGNED);
  }, [open]);

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    onCreate(columnId, {
      title: t,
      description: description.trim() || null,
      deadline: fromDatetimeLocalValue(deadline),
      assigneeId: assigneeId === UNASSIGNED ? null : assigneeId,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={`New card in “${columnTitle}”`}
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim()}>Create card</Button>
        </>
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
  );
}
