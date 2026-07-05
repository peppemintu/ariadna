// Board chooser. "All boards" lists everything; "My boards" is scoped to the
// current user's memberships (boardUser links). Create a board inline; rename
// yourself from the header (the backend's user-update endpoint).

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBoards, useMyBoards } from "@/hooks/queries";
import { useCreateBoard, useRenameUser } from "@/hooks/mutations";
import { useCurrentUser } from "@/lib/currentUser";
import { Avatar, Button, Dialog, Input, Tabs, useToast } from "@/ui";
import styles from "./BoardsPage.module.css";

type Scope = "all" | "my";

export function BoardsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, setUser } = useCurrentUser();

  const [scope, setScope] = useState<Scope>("all");
  const allQ = useBoards();
  const myQ = useMyBoards(user?.id, scope === "my");
  const q = scope === "all" ? allQ : myQ;
  const boards = q.data;

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

  const logout = () => {
    setUser(null);
    navigate("/login", { replace: true });
  };

  const emptyCopy =
    scope === "all"
      ? "No boards yet — create the first one."
      : "You're not a member of any board yet. Open a board and add yourself via Members.";

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

      <div className={styles.scopeRow}>
        <Tabs
          value={scope}
          onChange={(v) => setScope(v as Scope)}
          tabs={[
            { value: "all", label: "All boards" },
            { value: "my", label: "My boards" },
          ]}
        />
      </div>

      {q.isLoading && <p className={styles.note}>Loading boards…</p>}
      {q.isError && (
        <p className={styles.error}>
          Can't load boards{q.error instanceof Error ? ` — ${q.error.message}` : ""}.
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
      {boards && boards.length === 0 && <p className={styles.note}>{emptyCopy}</p>}

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
