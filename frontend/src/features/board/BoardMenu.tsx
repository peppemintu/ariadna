// Board actions: rename, members, delete. Board CRUD is NOT broadcast over WS,
// so other viewers only see renames/deletes on their next refetch.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, ConfirmDialog, Dialog, Input, Menu, useToast } from "@/ui";
import { useDeleteBoard, useRenameBoard } from "@/hooks/mutations";
import type { BoardFull } from "@/api/types";

interface Props {
  board: BoardFull;
  onOpenMembers: () => void;
}

export function BoardMenu({ board, onOpenMembers }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const rename = useRenameBoard(board.id);
  const del = useDeleteBoard();

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState(board.title);

  useEffect(() => {
    if (renameOpen) setTitle(board.title);
  }, [renameOpen, board.title]);

  const saveRename = async () => {
    const t = title.trim();
    if (!t) return;
    if (t === board.title) {
      setRenameOpen(false);
      return;
    }
    try {
      await rename.mutateAsync(t);
      toast({ title: "Board renamed", tone: "success" });
      setRenameOpen(false);
    } catch (err) {
      toast({
        title: "Couldn't rename board",
        description: err instanceof Error ? err.message : undefined,
        tone: "flare",
      });
    }
  };

  const confirmDelete = async () => {
    try {
      await del.mutateAsync(board.id);
      toast({ title: "Board deleted", tone: "ink" });
      navigate("/boards", { replace: true });
    } catch (err) {
      toast({
        title: "Couldn't delete board",
        description: err instanceof Error ? err.message : undefined,
        tone: "flare",
      });
    }
  };

  return (
    <>
      <Menu
        trigger={
          <Button variant="ghost" size="sm" aria-label="Board menu">
            ⋯
          </Button>
        }
        items={[
          { label: "Rename board", onSelect: () => setRenameOpen(true) },
          { label: "Members…", onSelect: onOpenMembers },
          { label: "Delete board", danger: true, onSelect: () => setDeleteOpen(true) },
        ]}
      />

      <Dialog
        open={renameOpen}
        onOpenChange={(o) => !o && setRenameOpen(false)}
        title="Rename board"
        width={440}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={saveRename} disabled={!title.trim() || rename.isPending}>
              {rename.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveRename()}
          autoFocus
        />
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete board"
        description={`“${board.title}” and all of its columns and cards will be gone. This can't be undone.`}
        confirmLabel="Delete board"
        cancelLabel="Cancel"
        tone="danger"
        loading={del.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
