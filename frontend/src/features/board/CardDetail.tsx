// Card detail / edit dialog with AUTOSAVE. Edits are debounced and pushed to the
// server automatically; a status pill shows saving/saved/unsaved/error. Closing
// flushes any pending change (no data loss), so there's no manual Save button.
//
// Two subtleties:
//  * The form is (re)initialised only when the card IDENTITY changes, never on a
//    version bump — otherwise the refetch our own autosave triggers would wipe an
//    edit in progress. We carry the optimistic-lock version in a ref, updated
//    from each save's response.
//  * Delete uses the shared ConfirmDialog; a failed final save on close prompts a
//    discard confirmation rather than losing edits silently.

import { useEffect, useRef, useState } from "react";
import { Button, ConfirmDialog, Dialog, Input, SaveIndicator, Select, Textarea, useToast } from "@/ui";
import type { SaveState } from "@/ui";
import { useAssignCard, useDeleteCard, useUpdateCard } from "@/hooks/mutations";
import { ApiError } from "@/api/http";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/format";
import type { CardResponse, UserResponse, UUID } from "@/api/types";
import styles from "./CardDetail.module.css";

const UNASSIGNED = "__unassigned__";
const AUTOSAVE_MS = 1200;

interface CardDetailProps {
  card: CardResponse | null;
  boardId: UUID;
  members: UserResponse[];
  onClose: () => void;
}

interface Snapshot {
  title: string;
  description: string;
  deadline: string | null; // normalized ISO or null
  assignee: string | null;
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
  const [status, setStatus] = useState<SaveState>("saved");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const versionRef = useRef(0);
  const savedRef = useRef<Snapshot>({ title: "", description: "", deadline: null, assignee: null });
  const timerRef = useRef<number | null>(null);
  const savingRef = useRef(false);
  const cardIdRef = useRef<string | null>(null);

  // Live mirror of the form so the autosave closure always sees fresh values.
  const formRef = useRef({ title, description, deadline, assigneeId });
  formRef.current = { title, description, deadline, assigneeId };

  // Initialise only when the card identity changes (NOT on version bumps).
  useEffect(() => {
    if (!card) {
      cardIdRef.current = null;
      return;
    }
    if (cardIdRef.current === card.id) return;
    cardIdRef.current = card.id;
    const dl = toDatetimeLocalValue(card.deadline);
    setTitle(card.title);
    setDescription(card.description ?? "");
    setDeadline(dl);
    setAssigneeId(card.assigneeId ?? UNASSIGNED);
    versionRef.current = card.version;
    savedRef.current = {
      title: card.title,
      description: card.description ?? "",
      deadline: fromDatetimeLocalValue(dl),
      assignee: card.assigneeId ?? null,
    };
    setStatus("saved");
    setConfirmDeleteOpen(false);
    setConfirmDiscardOpen(false);
  }, [card]);

  function computeDirty() {
    const f = formRef.current;
    const nd = fromDatetimeLocalValue(f.deadline);
    const na = f.assigneeId === UNASSIGNED ? null : f.assigneeId;
    const s = savedRef.current;
    const coreDirty =
      f.title.trim() !== s.title ||
      (f.description.trim() || "") !== (s.description || "") ||
      (nd ?? "") !== (s.deadline ?? "");
    const assigneeDirty = na !== s.assignee;
    return {
      coreDirty,
      assigneeDirty,
      dirty: coreDirty || assigneeDirty,
      title: f.title.trim(),
      desc: f.description.trim() || null,
      nd,
      na,
    };
  }

  const scheduleAutosave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => void autosaveRef.current(), AUTOSAVE_MS);
  };

  const doAutosave = async (): Promise<boolean> => {
    if (!card || savingRef.current) return true;
    const d = computeDirty();
    if (!d.dirty) {
      setStatus("saved");
      return true;
    }
    if (!d.title) {
      setStatus("unsaved"); // can't persist an empty title
      return false;
    }
    savingRef.current = true;
    setStatus("saving");
    try {
      if (d.coreDirty) {
        const resp = await update.mutateAsync({
          id: card.id,
          body: { title: d.title, description: d.desc, deadline: d.nd, version: versionRef.current },
        });
        versionRef.current = resp.version;
      }
      if (d.assigneeDirty) {
        const resp = await assign.mutateAsync({ id: card.id, body: { assigneeId: d.na } });
        versionRef.current = resp.version;
      }
      savedRef.current = { title: d.title, description: d.desc ?? "", deadline: d.nd, assignee: d.na };
      savingRef.current = false;
      // The user may have typed while we were saving — recheck.
      if (computeDirty().dirty) {
        setStatus("unsaved");
        scheduleAutosave();
      } else {
        setStatus("saved");
      }
      return true;
    } catch (err) {
      savingRef.current = false;
      setStatus("error");
      if (err instanceof ApiError && err.isConflict) {
        toast({
          title: "Edit conflict",
          description: "This card changed elsewhere. Close and reopen to get the latest.",
          tone: "flare",
        });
      } else {
        toast({
          title: "Couldn't save",
          description: err instanceof Error ? err.message : undefined,
          tone: "flare",
        });
      }
      return false;
    }
  };

  const autosaveRef = useRef<() => Promise<boolean>>(async () => true);
  autosaveRef.current = doAutosave;

  // Debounced autosave on any field change.
  useEffect(() => {
    if (!card) return;
    const d = computeDirty();
    if (!d.dirty) {
      if (!savingRef.current) setStatus("saved");
      return;
    }
    setStatus("unsaved");
    scheduleAutosave();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, deadline, assigneeId, card]);

  const requestClose = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const d = computeDirty();
    if (!d.dirty) {
      onClose();
      return;
    }
    if (!d.title) {
      setConfirmDiscardOpen(true); // empty title — can't save what's there
      return;
    }
    const ok = await autosaveRef.current();
    if (ok) onClose();
    else setConfirmDiscardOpen(true);
  };

  const handleDelete = async () => {
    if (!card) return;
    try {
      await del.mutateAsync(card.id);
      toast({ title: "Card deleted", tone: "ink" });
      onClose();
    } catch (err) {
      toast({
        title: "Couldn't delete",
        description: err instanceof Error ? err.message : undefined,
        tone: "flare",
      });
    }
  };

  const assigneeOptions = [
    { value: UNASSIGNED, label: "Unassigned" },
    ...members.map((m) => ({ value: m.id, label: m.name })),
  ];

  return (
    <>
      <Dialog
        open={Boolean(card)}
        onOpenChange={(o) => !o && void requestClose()}
        title="Card"
        width={560}
        footer={
          <div className={styles.footer}>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteOpen(true)}>
              Delete
            </Button>
            <div className={styles.spacer} />
            <SaveIndicator state={status} />
            <Button variant="ghost" onClick={() => void requestClose()}>
              Close
            </Button>
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
              <Select label="Assignee" value={assigneeId} onChange={setAssigneeId} options={assigneeOptions} />
            </div>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete this card?"
        description="This can't be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        loading={del.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      <ConfirmDialog
        open={confirmDiscardOpen}
        title="Discard unsaved changes?"
        description="Your latest changes couldn't be saved. Close anyway and lose them?"
        confirmLabel="Discard & close"
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
