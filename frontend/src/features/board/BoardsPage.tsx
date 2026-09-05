// Board chooser. Shows only the boards the current user is a member of.
// Creating a board makes the caller its owner (backend side, one transaction).
// Rename yourself from the header (the backend's user-update endpoint).
// Pending invitations addressed to the current user show up in a panel here —
// the "main page" notification spot.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBoards, usePendingInvitations } from "@/hooks/queries";
import { useAcceptInvitation, useCreateBoard, useDeclineInvitation, useRenameUser } from "@/hooks/mutations";
import { useNotifications } from "@/hooks/useNotifications";
import { useCurrentUser } from "@/lib/currentUser";
import { Avatar, Button, Dialog, Input, useToast } from "@/ui";
import { SettingsMenu } from "@/features/settings/SettingsMenu";
import styles from "./BoardsPage.module.css";

export function BoardsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, setUser, logout } = useCurrentUser();

  const { data: boards, isLoading, isError, error } = useBoards();
  useNotifications();

  // --- invitations ---
  const { data: invitations } = usePendingInvitations();
  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();

  const handleAccept = async (id: string, boardTitle: string) => {
    try {
      await acceptInvitation.mutateAsync(id);
      toast({ title: `Joined “${boardTitle}”`, tone: "success" });
    } catch (err) {
      toast({
        title: "Couldn't accept the invitation",
        description: err instanceof Error ? err.message : undefined,
        tone: "flare",
      });
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await declineInvitation.mutateAsync(id);
    } catch (err) {
      toast({
        title: "Couldn't decline the invitation",
        description: err instanceof Error ? err.message : undefined,
        tone: "flare",
      });
    }
  };

  // --- create board ---
  const createBoard = useCreateBoard();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleCreate = async () => {
    const t = newTitle.trim();
    if (!t) return;
    try {
      const created = await createBoard.mutateAsync(t);
      toast({ title: "Board created", tone: "success" });
      setCreateOpen(false);
      setNewTitle("");
      navigate(`/board/${created.id}`);
    } catch (err) {
      toast({
        title: "Couldn't create board",
        description: err instanceof Error ? err.message : undefined,
        tone: "flare",
      });
    }
  };

  // --- rename self ---
  const renameUser = useRenameUser();
  const [renameOpen, setRenameOpen] = useState(false);
  const [myName, setMyName] = useState("");

  const openRename = () => {
    setMyName(user?.name ?? "");
    setRenameOpen(true);
  };

  const handleRename = async () => {
    const n = myName.trim();
    if (!user || !n) return;
    if (n === user.name) {
      setRenameOpen(false);
      return;
    }
    try {
      const updated = await renameUser.mutateAsync({ id: user.id, name: n });
      setUser(updated);
      toast({ title: "Name updated", tone: "success" });
      setRenameOpen(false);
    } catch (err) {
      toast({
        title: "Couldn't rename",
        description: err instanceof Error ? err.message : undefined,
        tone: "flare",
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <div className={styles.titleBlock}>
          <p className={styles.eyebrow}>Ariadna</p>
          <h1 className={styles.title}>Boards</h1>
          <div className={styles.titleActions}>
            <Button size="sm" onClick={() => setCreateOpen(true)} iconLeft="+">New board</Button>
          </div>
        </div>
        <div className={styles.who}>
          <div className={styles.identity}>
            {user && <Avatar name={user.name} size={32} />}
            {user && <span className={styles.whoName}>{user.name}</span>}
            <button
              className={styles.editName}
              onClick={openRename}
              aria-label="Rename yourself"
              title="Rename"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden>
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
            </button>
          </div>
          <SettingsMenu onLogout={handleLogout} />
        </div>
      </header>

      {invitations && invitations.length > 0 && (
        <section className={styles.invitations}>
          <p className={styles.invitationsTitle}>Invitations</p>
          <ul className={styles.invitationsList}>
            {invitations.map((inv) => (
              <li key={inv.id} className={styles.invitationRow}>
                <span className={styles.invitationText}>
                  <strong>{inv.invitedByName}</strong> invited you to <strong>{inv.boardTitle}</strong>
                </span>
                <div className={styles.invitationActions}>
                  <Button size="sm" onClick={() => handleAccept(inv.id, inv.boardTitle)} disabled={acceptInvitation.isPending}>
                    Accept
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDecline(inv.id)} disabled={declineInvitation.isPending}>
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isLoading && <p className={styles.note}>Loading boards…</p>}
      {isError && (
        <p className={styles.error}>
          Can't load boards{error instanceof Error ? ` — ${error.message}` : ""}.
        </p>
      )}

      {boards && boards.length > 0 && (
        <ul className={styles.grid}>
          {boards.map((b) => (
            <li key={b.id}>
              <button className={styles.card} onClick={() => navigate(`/board/${b.id}`)}>
                <span className={styles.cardTitle}>{b.title}</span>
                <span className={styles.cardMeta}>
                  Updated {new Date(b.updatedAt).toLocaleDateString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {boards && boards.length === 0 && (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No boards yet</p>
          <p className={styles.emptyText}>Create your first board to start organizing work.</p>
          <Button onClick={() => setCreateOpen(true)} iconLeft="+">New board</Button>
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(o) => !o && setCreateOpen(false)}
        title="New board"
        width={440}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim() || createBoard.isPending}>
              {createBoard.isPending ? "Creating…" : "Create"}
            </Button>
          </>
        }
      >
        <Input
          label="Title"
          placeholder="e.g. Product roadmap"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          autoFocus
        />
      </Dialog>

      <Dialog
        open={renameOpen}
        onOpenChange={(o) => !o && setRenameOpen(false)}
        title="Your name"
        width={440}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={handleRename} disabled={!myName.trim() || renameUser.isPending}>
              {renameUser.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <Input
          label="Name"
          value={myName}
          onChange={(e) => setMyName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRename()}
          autoFocus
        />
      </Dialog>
    </main>
  );
}
