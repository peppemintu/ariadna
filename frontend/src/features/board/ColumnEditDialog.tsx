// Edit a column: title + color, plus a two-step delete. No optimistic lock —
// the backend's column update DTO carries no version.

import { useEffect, useState } from "react";
import { Button, Dialog, Input, useToast } from "@/ui";
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
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(column.title);
    setColor(column.color ?? COLUMN_COLORS[0].value);
    setConfirmDelete(false);
  }, [open, column.title, column.color]);

  const dirty = title.trim() !== column.title || color !== (column.color ?? COLUMN_COLORS[0].value);
  const canSave = title.trim().length > 0 && dirty;

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
      ? "Delete this column?"
      : `Delete this column and its ${column.cards.length} card${column.cards.length === 1 ? "" : "s"}?`;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Column"
      width={440}
      footer={
        <div className={styles.footer}>
          {confirmDelete ? (
            <div className={styles.confirm}>
              <span className={styles.confirmText}>{cardsNote}</span>
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
              <Button onClick={handleSave} disabled={!canSave || update.isPending}>
                {update.isPending ? "Saving…" : "Save"}
              </Button>
            </>
          )}
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
  );
}
