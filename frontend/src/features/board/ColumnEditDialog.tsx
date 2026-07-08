// Edit a column: title + color. Manual save (no optimistic lock — the backend's
// column update DTO carries no version). Delete goes through the shared
// ConfirmDialog; closing with unsaved edits asks before discarding.

import { useEffect, useState } from "react";
import { Button, ConfirmDialog, Dialog, Input, useToast } from "@/ui";
import { useDeleteColumn, useUpdateColumn } from "@/hooks/mutations";
import type { ColumnWithCards } from "@/api/types";
import { ColorSwatches, COLUMN_COLORS } from "./ColorSwatches";
import styles from "./ColumnEditDialog.module.css";

interface Props {
  column: ColumnWithCards;
  open: boolean;
  onClose: () => void;
}

export function ColumnEditDialog({ column, open, onClose }: Props) {
  const { toast } = useToast();
  const update = useUpdateColumn(column.boardId);
  const del = useDeleteColumn(column.boardId);

  const [title, setTitle] = useState(column.title);
  const [color, setColor] = useState(column.color ?? COLUMN_COLORS[0].value);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(column.title);
    setColor(column.color ?? COLUMN_COLORS[0].value);
    setConfirmDeleteOpen(false);
    setConfirmDiscardOpen(false);
  }, [open, column.title, column.color]);

  const dirty = title.trim() !== column.title || color !== (column.color ?? COLUMN_COLORS[0].value);
  const canSave = title.trim().length > 0 && dirty;

  const requestClose = () => {
    if (dirty) setConfirmDiscardOpen(true);
    else onClose();
  };

  const handleSave = async () => {
    try {
      await update.mutateAsync({ id: column.id, body: { title: title.trim(), color } });
      toast({ title: "Column saved", tone: "success" });
      onClose();
    } catch (err) {
      toast({
        title: "Couldn't save column",
        description: err instanceof Error ? err.message : undefined,
        tone: "flare",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await del.mutateAsync(column.id);
      toast({ title: "Column deleted", tone: "ink" });
      onClose();
    } catch (err) {
      toast({
        title: "Couldn't delete column",
        description: err instanceof Error ? err.message : undefined,
        tone: "flare",
      });
    }
  };

  const cardsNote =
    column.cards.length === 0
      ? "This can't be undone."
      : `This deletes the column and its ${column.cards.length} card${column.cards.length === 1 ? "" : "s"}. This can't be undone.`;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => !o && requestClose()}
        title="Column"
        width={440}
        footer={
          <div className={styles.footer}>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteOpen(true)}>Delete</Button>
            <div className={styles.spacer} />
            <Button variant="ghost" onClick={requestClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={!canSave || update.isPending}>
              {update.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      >
        <div className={styles.form}>
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && canSave && handleSave()}
          />
          <ColorSwatches value={color} onChange={setColor} />
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete this column?"
        description={cardsNote}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        loading={del.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      <ConfirmDialog
        open={confirmDiscardOpen}
        title="Discard changes?"
        description="You have unsaved changes to this column. Close anyway?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        tone="danger"
        onConfirm={() => {
          setConfirmDiscardOpen(false);
          onClose();
        }}
        onCancel={() => setConfirmDiscardOpen(false)}
      />
    </>
  );
}
