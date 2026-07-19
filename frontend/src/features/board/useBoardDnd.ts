// All board drag-and-drop state and event wiring, for BOTH cards and columns,
// kept out of BoardView so the view stays declarative.
//
//  - Cards move between/within columns. Cross-column moves happen live in local
//    state during dragOver; the server commit is computed once on dragEnd.
//  - Columns reorder horizontally. Column widths are fixed, so a live reorder in
//    dragOver can't oscillate; we commit the final order on dragEnd.
//
// The active drag kind is read from `active.data.current.type` ("card" |
// "column"), set on each sortable.
//
// Card stability note: a naive `closestCorners` + state update in dragOver can
// oscillate at a column boundary (inserting the card resizes columns, shifting
// the pointer's target every frame → React's "maximum update depth exceeded").
// We use the dnd-kit multi-container recipe: pointer-first collision detection
// plus a `recentlyMovedToNewContainer` latch that pins the over-target until the
// layout settles (reset on the next animation frame).

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type CollisionDetection,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type UniqueIdentifier,
  KeyboardSensor,
  PointerSensor,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { CardResponse, ColumnWithCards, UUID } from "@/api/types";
import { columnIdOfCard, isColumnId, moveCardTo, neighborsOf } from "./dndHelpers";

export interface MoveCommit {
  cardId: UUID;
  version: number;
  targetColumnId: UUID;
  prevCardId: UUID | null;
  nextCardId: UUID | null;
}

export interface ColumnMoveCommit {
  columnId: UUID;
  version: number;
  prevColumnId: UUID | null;
  nextColumnId: UUID | null;
}

interface Params {
  columns: ColumnWithCards[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnWithCards[]>>;
  commitMove: (move: MoveCommit) => void;
  commitColumnMove: (move: ColumnMoveCommit) => void;
}

const typeOf = (e: { active: { data: { current?: { type?: string } } } }) =>
  e.active.data.current?.type;

export function useBoardDnd({ columns, setColumns, commitMove, commitColumnMove }: Params) {
  const [activeCard, setActiveCard] = useState<CardResponse | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnWithCards | null>(null);

  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);

  // Release the card latch once the post-move render has painted.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
    return () => cancelAnimationFrame(raf);
  }, [columns]);

  // Small activation distance so a plain click (open detail) isn't read as a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Pointer-first detection with a rect fallback, stabilised so the over-target
  // doesn't flip-flop right after a cross-column insert.
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    const collisions = pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
    const overId = getFirstCollision(collisions, "id");

    if (overId != null) {
      lastOverId.current = overId;
      return [{ id: overId }];
    }
    if (recentlyMovedToNewContainer.current) {
      lastOverId.current = args.active.id;
    }
    return lastOverId.current ? [{ id: lastOverId.current }] : [];
  }, []);

  const findCard = (id: UUID): CardResponse | undefined =>
    columns.flatMap((c) => c.cards).find((c) => c.id === id);
  const findColumn = (id: UUID): ColumnWithCards | undefined =>
    columns.find((c) => c.id === id);

  const onDragStart = (e: DragStartEvent) => {
    const id = e.active.id as UUID;
    if (typeOf(e) === "column") {
      setActiveColumn(findColumn(id) ?? null);
    } else {
      setActiveCard(findCard(id) ?? null);
    }
  };

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = active.id as UUID;
    const overId = over.id as UUID;

    // Columns reorder as a single horizontal list: let dnd-kit's sortable
    // strategy animate the live preview and commit the new order on drop. No
    // live array mutation here (that would fight the strategy's transforms).
    if (typeOf(e) === "column") return;

    // --- Card cross-column move ---
    const fromCol = columnIdOfCard(columns, activeId);
    const toCol = isColumnId(columns, overId) ? overId : columnIdOfCard(columns, overId);
    if (!fromCol || !toCol || fromCol === toCol) return;

    recentlyMovedToNewContainer.current = true;
    setColumns((prev) => {
      const target = prev.find((c) => c.id === toCol);
      if (!target) return prev;
      const overIndex = isColumnId(prev, overId)
        ? target.cards.length
        : target.cards.findIndex((c) => c.id === overId);
      return moveCardTo(prev, activeId, toCol, overIndex < 0 ? target.cards.length : overIndex);
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    const activeId = active.id as UUID;
    lastOverId.current = null;

    // --- Column drop ---
    if (typeOf(e) === "column") {
      const dragged = activeColumn;
      setActiveColumn(null);
      if (!dragged || !over) return;

      const overId = over.id as UUID;
      const overColId = isColumnId(columns, overId) ? overId : columnIdOfCard(columns, overId);
      const from = columns.findIndex((c) => c.id === activeId);
      const to = overColId ? columns.findIndex((c) => c.id === overColId) : -1;
      if (from === -1 || to === -1 || from === to) return; // dropped in place → no-op

      const reordered = arrayMove(columns, from, to);
      setColumns(reordered);

      const idx = reordered.findIndex((c) => c.id === activeId);
      const prevColumnId = idx > 0 ? reordered[idx - 1].id : null;
      const nextColumnId = idx < reordered.length - 1 ? reordered[idx + 1].id : null;
      commitColumnMove({ columnId: activeId, version: dragged.version, prevColumnId, nextColumnId });
      return;
    }

    // --- Card drop ---
    const dragged = activeCard;
    setActiveCard(null);
    if (!over || !dragged) return;

    const overId = over.id as UUID;
    const targetColumnId = columnIdOfCard(columns, activeId);
    if (!targetColumnId) return;

    let nextColumns = columns;
    if (!isColumnId(columns, overId) && overId !== activeId) {
      const overCol = columnIdOfCard(columns, overId);
      if (overCol === targetColumnId) {
        const overIndex = columns
          .find((c) => c.id === targetColumnId)!
          .cards.findIndex((c) => c.id === overId);
        nextColumns = moveCardTo(columns, activeId, targetColumnId, overIndex);
        setColumns(nextColumns);
      }
    }

    if (overId === activeId && targetColumnId === dragged.columnId) return;

    const { prevCardId, nextCardId } = neighborsOf(nextColumns, activeId);
    commitMove({
      cardId: activeId,
      version: dragged.version,
      targetColumnId,
      prevCardId,
      nextCardId,
    });
  };

  const onDragCancel = () => {
    setActiveCard(null);
    setActiveColumn(null);
    lastOverId.current = null;
  };

  return {
    sensors,
    collisionDetection,
    activeCard,
    activeColumn,
    handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel },
  };
}
