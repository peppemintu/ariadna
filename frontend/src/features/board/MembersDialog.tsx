// Manage board members. Members + rights come from the board aggregate
// (board/full) — nothing here is computed client-side beyond reading the
// flags the backend already sent (board.myAccess, member.permissions).
// Inviting is by email only (no user list is ever shown, per the product
// requirement); a manager can grant/revoke EDIT_CARDS and MANAGE_MEMBERS on
// plain members, but only the owner may touch another manager, and the owner
// row itself is never editable or removable.

import { useState } from "react";
import { Avatar, Badge, Button, Dialog, Input, Switch, useToast } from "@/ui";
import { useBoardInvitations } from "@/hooks/queries";
import { useInviteMember, useRemoveBoardMember, useUpdateMemberPermissions } from "@/hooks/mutations";
import type { BoardFull, BoardMember, BoardPermission, UUID } from "@/api/types";
import styles from "./MembersDialog.module.css";

interface Props {
  board: BoardFull;
  open: boolean;
  onClose: () => void;
}

function togglePermission(current: BoardPermission[], permission: BoardPermission, on: boolean): BoardPermission[] {
  return on ? [...current, permission] : current.filter((p) => p !== permission);
}

export function MembersDialog({ board, open, onClose }: Props) {
  const { toast } = useToast();
  const canManageMembers = board.myAccess.permissions.includes("MANAGE_MEMBERS");

  const { data: pendingInvitations } = useBoardInvitations(board.id, { enabled: open && canManageMembers });
  const invite = useInviteMember(board.id);
  const updatePermissions = useUpdateMemberPermissions(board.id);
  const remove = useRemoveBoardMember(board.id);

  const [email, setEmail] = useState("");

  const handleInvite = async () => {
    const e = email.trim();
    if (!e) return;
    try {
      await invite.mutateAsync(e);
      setEmail("");
      toast({ title: "Invitation sent", tone: "success" });
    } catch (err) {
      toast({
        title: "Couldn't send the invitation",
        description: err instanceof Error ? err.message : undefined,
        tone: "flare",
      });
    }
  };

  const canEditMember = (member: BoardMember) =>
    canManageMembers && (board.myAccess.owner || !member.permissions.includes("MANAGE_MEMBERS"));

  const handleTogglePermission = async (member: BoardMember, permission: BoardPermission, on: boolean) => {
    try {
      await updatePermissions.mutateAsync({
        boardUserId: member.boardUserId,
        permissions: togglePermission(member.permissions, permission, on),
      });
    } catch (err) {
      toast({
        title: "Couldn't update permissions",
        description: err instanceof Error ? err.message : undefined,
        tone: "flare",
      });
    }
  };

  const handleRemove = async (boardUserId: UUID, name: string) => {
    try {
      await remove.mutateAsync(boardUserId);
      toast({ title: `${name} removed`, tone: "ink" });
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
        {canManageMembers && (
          <div className={styles.addRow}>
            <div className={styles.addSelect}>
              <Input
                placeholder="Invite by email…"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
            </div>
            <Button onClick={handleInvite} disabled={!email.trim() || invite.isPending}>
              {invite.isPending ? "Inviting…" : "Invite"}
            </Button>
          </div>
        )}

        {canManageMembers && pendingInvitations && pendingInvitations.length > 0 && (
          <ul className={styles.list}>
            {pendingInvitations.map((inv) => (
              <li key={inv.id} className={styles.row}>
                <span className={styles.text}>
                  <span className={styles.name}>{inv.invitedEmail}</span>
                  <span className={styles.email}>Invited — awaiting response</span>
                </span>
              </li>
            ))}
          </ul>
        )}

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

                {m.owner ? (
                  <Badge tone="ink">Owner</Badge>
                ) : (
                  <>
                    <div className={styles.permissions}>
                      <Switch
                        label="Edit"
                        checked={m.permissions.includes("EDIT_CARDS")}
                        onChange={(on) => handleTogglePermission(m, "EDIT_CARDS", on)}
                        disabled={!canEditMember(m) || updatePermissions.isPending}
                      />
                      <Switch
                        label="Manage members"
                        checked={m.permissions.includes("MANAGE_MEMBERS")}
                        onChange={(on) => handleTogglePermission(m, "MANAGE_MEMBERS", on)}
                        disabled={!canEditMember(m) || updatePermissions.isPending}
                      />
                    </div>
                    {canEditMember(m) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(m.boardUserId, m.name)}
                        disabled={remove.isPending}
                        aria-label={`Remove ${m.name} from the board`}
                      >
                        ✕
                      </Button>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
