// Board chooser. Shows only the boards the current user is a member of.
// Creating a board also makes the creator a member (see useCreateBoard).
// Rename yourself from the header (the backend's user-update endpoint).

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMyBoards } from "@/hooks/queries";
import { useCreateBoard, useRenameUser } from "@/hooks/mutations";
import { useCurrentUser } from "@/lib/currentUser";
import { Avatar, Button, Dialog, Input, useToast } from "@/ui";
import styles from "./BoardsPage.module.css";

export function BoardsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, setUser } = useCurrentUser();

  const { data: boards, isLoading, isError, error } = useMyBoards(user?.id);

  // --- create board ---
  const createBoard = useCreateBoard();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleCreate = async () => {
    const t = newTitle.trim();
    if (!t || !user) return;
    try {
      const created = await createBoard.mutateAsync({ title: t, userId: user.id });
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

  const logout = () => {
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <div>
          <p className={styles.eyebrow}>Ariadna</p>
          <h1 className={styles.title}>Boards</h1>
        </div>
        <div className={styles.who}>
          {user && <Avatar name={user.name} size={32} />}
          {user && <span className={styles.whoName}>{user.name}</span>}
          <Button variant="ghost" size="sm" onClick={openRename} aria-label="Rename yourself" title="Rename">✎</Button>
          <Button variant="ghost" size="sm" onClick={logout}>Switch user</Button>
        </div>
      </header>

      {isLoading && <p className={styles.note}>Loading boards…</p>}
      {isError && (
        <p className={styles.error}>
          Can't load boards{error instanceof Error ? ` — ${error.message}` : ""}.
        </p>
      )}

      {boards && (
        <ul className={styles.grid}>
          <li>
            <button className={styles.newCard} onClick={() => setCreateOpen(true)}>
              + New board
            </button>
          </li>
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
        <p className={styles.note}>No boards yet — create your first one.</p>
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
