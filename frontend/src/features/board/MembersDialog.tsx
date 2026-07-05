// Manage board members: add from the global user list, remove existing ones.
// Members drive the assignee picker and avatar resolution across the board.
// NB: removal calls the pair-delete endpoint the backend still needs to add.

import { useState } from "react";
import { Avatar, Badge, Button, Dialog, Select, useToast } from "@/ui";
import { useUsers } from "@/hooks/queries";
import { useAddBoardMember, useRemoveBoardMember } from "@/hooks/mutations";
import type { BoardFull, UUID } from "@/api/types";
import styles from "./MembersDialog.module.css";

interface Props {
  board: BoardFull;
  open: boolean;
  onClose: () => void;
}

export function MembersDialog({ board, open, onClose }: Props) {
  const { toast } = useToast();
  const { data: users } = useUsers({ enabled: open });
  const add = useAddBoardMember(board.id);
  const remove = useRemoveBoardMember(board.id);
  const [picked, setPicked] = useState<string>("");

  const memberIds = new Set(board.members.map((m) => m.id));
  const candidates = (users ?? []).filter((u) => !memberIds.has(u.id));

  const handleAdd = async () => {
    if (!picked) return;
    try {
      await add.mutateAsync(picked);
      setPicked("");
      toast({ title: "Member added", tone: "success" });
    } catch (err) {
      toast({
        title: "Couldn't add member",
        description: err instanceof Error ? err.message : undefined,
        tone: "flare",
      });
    }
  };

  const handleRemove = async (userId: UUID) => {
    try {
      await remove.mutateAsync(userId);
      toast({ title: "Member removed", tone: "ink" });
    } catch (err) {
      toast({
        title: "Couldn't remove member",
        description: err instanceof Error ? err.message : undefined,
        tone: "flare",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} title="Members" width={480}>
      <div className={styles.wrap}>
        <div className={styles.addRow}>
          <div className={styles.addSelect}>
            <Select
              placeholder={candidates.length ? "Pick a user…" : "Everyone's already here"}
              value={picked}
              onChange={setPicked}
              options={candidates.map((u) => ({ value: u.id, label: `${u.name} — ${u.email}` }))}
              disabled={candidates.length === 0}
            />
          </div>
          <Button onClick={handleAdd} disabled={!picked || add.isPending}>
            {add.isPending ? "Adding…" : "Add"}
          </Button>
        </div>

        {board.members.length === 0 ? (
          <p className={styles.empty}>
            No members yet. Members appear in the assignee picker on cards.
          </p>
        ) : (
          <ul className={styles.list}>
            {board.members.map((m) => (
              <li key={m.id} className={styles.row}>
                <Avatar name={m.name} size={32} />
                <span className={styles.text}>
                  <span className={styles.name}>{m.name}</span>
                  <span className={styles.email}>{m.email}</span>
                </span>
                {m.role === "ADMIN" && <Badge tone="ink">Admin</Badge>}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(m.id)}
                  disabled={remove.isPending}
                  aria-label={`Remove ${m.name} from the board`}
                >
                  ✕
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
