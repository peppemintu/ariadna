// The board screen. Loads the aggregate, mirrors columns into local state for
// optimistic drag-and-drop, and commits changes to the server. Card creation
// is optimistic (instant placeholder); column creation refetches.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useBoardFull } from "@/hooks/queries";
import { useBoardRealtime } from "@/hooks/useBoardRealtime";
import { useCreateCard, useCreateColumn, useMoveCard, useMoveColumn } from "@/hooks/mutations";
import { ApiError } from "@/api/http";
import { Button, Tabs, useToast } from "@/ui";
import type { CardCreate, CardResponse, ColumnWithCards, UserResponse, UUID } from "@/api/types";
import { BoardHeader } from "./BoardHeader";
import { BoardToolbar } from "./BoardToolbar";
import { Column, ColumnOverlay } from "./Column";
import { TaskCard } from "./TaskCard";
import { CardDetail } from "./CardDetail";
import { ListView } from "./ListView";
import { ActivityFeed } from "./ActivityFeed";
import { ColumnComposer } from "./ColumnComposer";
import { useBoardDnd, type MoveCommit, type ColumnMoveCommit } from "./useBoardDnd";
import { useEdgeAutoScroll } from "@/hooks/useEdgeAutoScroll";
import styles from "./BoardView.module.css";

export function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { data: board, isLoading, isError, error } = useBoardFull(boardId);
  const { toast } = useToast();
  const { connected } = useBoardRealtime(boardId);

  // Local mirror of the server columns — the surface DnD mutates optimistically.
  const [columns, setColumns] = useState<ColumnWithCards[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<UUID | null>(null);
  const [tab, setTab] = useState<"board" | "list" | "activity">("board");

  const createCard = useCreateCard(boardId!, {
    onError: (err) =>
      toast({
        title: "Couldn't add the card",
        description: err instanceof Error ? err.message : undefined,
        tone: "flare",
      }),
  });

  const createColumn = useCreateColumn(boardId!);

  const moveCard = useMoveCard(boardId!, {
    onConflict: () =>
      toast({
        title: "Move conflict",
        description: "Someone changed this card first. Refreshing the board.",
        tone: "flare",
      }),
    onError: (err) =>
      toast({
        title: "Couldn't move the card",
        description: err instanceof Error ? err.message : "The board will refresh.",
        tone: "flare",
      }),
  });

  const moveColumn = useMoveColumn(boardId!, {
    onConflict: () =>
      toast({
        title: "Move conflict",
        description: "Someone reordered this column first. Refreshing the board.",
        tone: "flare",
      }),
    onError: (err) =>
      toast({
        title: "Couldn't move the column",
        description: err instanceof Error ? err.message : "The board will refresh.",
        tone: "flare",
      }),
  });

  const dnd = useBoardDnd({
    columns,
    setColumns,
    commitMove: (m: MoveCommit) =>
      moveCard.mutate({
        id: m.cardId,
        body: {
          targetColumnId: m.targetColumnId,
          prevCardId: m.prevCardId,
          nextCardId: m.nextCardId,
          version: m.version,
        },
      }),
    commitColumnMove: (m: ColumnMoveCommit) =>
      moveColumn.mutate({
        id: m.columnId,
        body: {
          prevColumnId: m.prevColumnId,
          nextColumnId: m.nextColumnId,
          version: m.version,
        },
      }),
  });

  // Hover-to-scroll near the board's left/right edges. Off during a drag, where
  // dnd-kit runs its own auto-scroll.
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeEdge = useEdgeAutoScroll(scrollRef, { enabled: !dnd.activeCard && !dnd.activeColumn });

  // Re-sync local state whenever the server sends a fresh board, but never
  // mid-drag (would jump the card or column) — and crucially not merely because
  // the drag just ended: we keep the optimistic commit until a fresh board
  // actually arrives. Guarding via a ref (not a dep) means ending a drag doesn't
  // re-run this and clobber the local move with stale server data.
  const activeDragRef = useRef<boolean>(false);
  activeDragRef.current = Boolean(dnd.activeCard || dnd.activeColumn);
  useEffect(() => {
    if (board && !activeDragRef.current) setColumns(board.columns);
  }, [board]);

  // Board title in the browser tab.
  useEffect(() => {
    if (board) document.title = `${board.title} — Ariadna`;
    return () => {
      document.title = "Ariadna";
    };
  }, [board?.title]);

  const membersById = useMemo(() => {
    const map = new Map<UUID, UserResponse>();
    board?.members.forEach((m) => map.set(m.id, m));
    return map;
  }, [board]);

  const selectedCard = useMemo(
    () =>
      selectedCardId
        ? board?.columns.flatMap((c) => c.cards).find((c) => c.id === selectedCardId) ?? null
        : null,
    [board, selectedCardId],
  );

  const onCreateCard = useCallback(
    (columnId: UUID, body: CardCreate) => createCard.mutate({ columnId, body }),
    [createCard],
  );

  const onCreateColumn = useCallback(
    (title: string, color: string) =>
      createColumn.mutate(
        { title, color },
        {
          onError: (err) =>
            toast({
              title: "Couldn't add the column",
              description: err instanceof Error ? err.message : undefined,
              tone: "flare",
            }),
        },
      ),
    [createColumn, toast],
  );

  const onCardClick = useCallback((card: CardResponse) => setSelectedCardId(card.id), []);

  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

  if (isLoading) return <Centered>Loading board…</Centered>;
  if (isError) {
    const notFound = error instanceof ApiError && error.isNotFound;
    return (
      <Centered tone="error">
        <span>
          {notFound
            ? "Board not found — it may have been deleted."
            : `Couldn't load the board${error instanceof Error ? ` — ${error.message}` : ""}.`}
        </span>
        <Button variant="default" onClick={() => navigate("/boards")}>← Back to boards</Button>
      </Centered>
    );
  }
  if (!board) return null;

  return (
    <div className={styles.screen}>
      <BoardHeader board={board} live={connected} />

      <div className={styles.tabbar}>
        <BoardToolbar
          boardId={board.id}
          columns={columns}
          members={board.members}
          onCreateCard={onCreateCard}
        />
        <Tabs
          value={tab}
          onChange={(v) => setTab(v as "board" | "list" | "activity")}
          tabs={[
            { value: "board", label: "Board" },
            { value: "list", label: "List" },
            { value: "activity", label: "Activity" },
          ]}
        />
      </div>

      {tab === "board" && (
        <div className={styles.boardArea}>
          <div className={styles.edgeHint} data-side="left" data-active={activeEdge === "left" ? "" : undefined} aria-hidden />
          <div className={styles.edgeHint} data-side="right" data-active={activeEdge === "right" ? "" : undefined} aria-hidden />
          <div ref={scrollRef} className={styles.scroll} data-scroll>
            <DndContext
              sensors={dnd.sensors}
              collisionDetection={dnd.collisionDetection}
              onDragStart={dnd.handlers.onDragStart}
              onDragOver={dnd.handlers.onDragOver}
              onDragEnd={dnd.handlers.onDragEnd}
              onDragCancel={dnd.handlers.onDragCancel}
            >
              <div className={styles.row}>
                <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
                  {columns.map((col) => (
                    <Column
                      key={col.id}
                      column={col}
                      membersById={membersById}
                      onCardClick={onCardClick}
                    />
                  ))}
                </SortableContext>
                <ColumnComposer onCreate={onCreateColumn} />
              </div>

              <DragOverlay>
                {dnd.activeColumn ? (
                  <ColumnOverlay column={dnd.activeColumn} />
                ) : dnd.activeCard ? (
                  <TaskCard
                    card={dnd.activeCard}
                    assignee={dnd.activeCard.assigneeId ? membersById.get(dnd.activeCard.assigneeId) : undefined}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      )}

      {tab === "list" && (
        <div className={styles.panel}>
          <ListView columns={board.columns} membersById={membersById} onCardClick={onCardClick} />
        </div>
      )}

      {tab === "activity" && (
        <div className={styles.panel}>
          <ActivityFeed boardId={board.id} membersById={membersById} active={tab === "activity"} />
        </div>
      )}

      <CardDetail
        card={selectedCard}
        boardId={board.id}
        members={board.members}
        onClose={() => setSelectedCardId(null)}
      />
    </div>
  );
}

function Centered({ children, tone }: { children: React.ReactNode; tone?: "error" }) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-4)",
        padding: "var(--space-8)",
        color: tone === "error" ? "var(--flare-700)" : "var(--text-muted)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-sm)",
        letterSpacing: "var(--tracking-label)",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}
