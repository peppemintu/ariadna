// Card detail / edit dialog. Title/description/deadline go through PUT (with the
// optimistic-lock version); assignee goes through its own PATCH endpoint. Both
// fire on Save. A 409 keeps the dialog open, toasts, and re-syncs from server.

import { useEffect, useState } from "react";
import { Button, Dialog, Input, Select, Textarea, useToast } from "@/ui";
import { useAssignCard, useDeleteCard, useUpdateCard } from "@/hooks/mutations";
import { ApiError } from "@/api/http";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/format";
import type { CardResponse, UserResponse, UUID } from "@/api/types";
import styles from "./CardDetail.module.css";

const UNASSIGNED = "__unassigned__";

interface CardDetailProps {
  card: CardResponse | null;
  boardId: UUID;
  members: UserResponse[];
  onClose: () => void;
}

export function CardDetail({ card, boardId, members, onClose }: CardDetailProps) {
  const { toast } = useToast();
  const update = useUpdateCard(boardId);
  const assign = useAssignCard(boardId);
  const del = useDeleteCard(boardId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>(UNASSIGNED);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // (Re)load the form whenever the card identity or its version changes
  // (version bump = server sent fresher data, e.g. after a conflict refetch).
  useEffect(() => {
    if (!card) return;
    setTitle(card.title);
    setDescription(card.description ?? "");
    setDeadline(toDatetimeLocalValue(card.deadline));
    setAssigneeId(card.assigneeId ?? UNASSIGNED);
    setConfirmDelete(false);
  }, [card?.id, card?.version]);

  if (!card) return null;

  // Normalize the stored deadline through the same round-trip the input does,
  // so second-level precision differences don't read as a spurious edit.
  const deadlineBaseline = fromDatetimeLocalValue(toDatetimeLocalValue(card.deadline));
  const dirtyCore =
    title.trim() !== card.title ||
    (description.trim() || "") !== (card.description ?? "") ||
    fromDatetimeLocalValue(deadline) !== deadlineBaseline;
  const nextAssignee = assigneeId === UNASSIGNED ? null : assigneeId;
  const dirtyAssignee = nextAssignee !== (card.assigneeId ?? null);
  const canSave = title.trim().length > 0 && (dirtyCore || dirtyAssignee);
  const saving = update.isPending || assign.isPending;

  const handleSave = async () => {
    try {
      if (dirtyCore) {
        await update.mutateAsync({
          id: card.id,
          body: {
            title: title.trim(),
            description: description.trim() || null,
            deadline: fromDatetimeLocalValue(deadline),
            version: card.version,
          },
        });
      }
      if (dirtyAssignee) {
        await assign.mutateAsync({ id: card.id, body: { assigneeId: nextAssignee } });
      }
      toast({ title: "Card saved", tone: "success" });
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.isConflict) {
        toast({
          title: "Edit conflict",
          description: "This card changed elsewhere. Reloaded the latest — reapply your edits.",
          tone: "flare",
        });
        // onSettled in the mutation already refetched; form re-syncs via useEffect.
      } else {
        toast({
          title: "Couldn't save",
          description: err instanceof Error ? err.message : undefined,
          tone: "flare",
        });
      }
    }
  };

  const handleDelete = async () => {
    try {
      await del.mutateAsync(card.id);
      toast({ title: "Card deleted", tone: "ink" });
      onClose();
    } catch (err) {
      toast({ title: "Couldn't delete", description: err instanceof Error ? err.message : undefined, tone: "flare" });
    }
  };

  const assigneeOptions = [
    { value: UNASSIGNED, label: "Unassigned" },
    ...members.map((m) => ({ value: m.id, label: m.name })),
  ];

  return (
    <Dialog
      open={Boolean(card)}
      onOpenChange={(o) => !o && onClose()}
      title="Card"
      width={560}
      footer={
        <div className={styles.footer}>
          {confirmDelete ? (
            <div className={styles.confirm}>
              <span className={styles.confirmText}>Delete this card?</span>
              <Button variant="accent" size="sm" onClick={handleDelete} disabled={del.isPending}>
                {del.isPending ? "Deleting…" : "Delete"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>Delete</Button>
              <div className={styles.spacer} />
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={!canSave || saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className={styles.form}>
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more detail…"
        />
        <div className={styles.row}>
          <div className={styles.col}>
            <label className={styles.label}>Deadline</label>
            <input
              type="datetime-local"
              className={styles.dateInput}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div className={styles.col}>
            <Select
              label="Assignee"
              value={assigneeId}
              onChange={setAssigneeId}
              options={assigneeOptions}
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
