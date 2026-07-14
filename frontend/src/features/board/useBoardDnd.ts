// Encapsulates all board drag-and-drop state and event wiring so BoardView stays
// declarative. Between-column moves happen live in local state during dragOver;
// the server commit is computed once on dragEnd from the final neighbours.
//
// Stability note: naive `closestCorners` + a state update in `onDragOver` can
// oscillate at a column boundary — inserting the card grows one column and
// shrinks another, shifting the pointer's target back and forth every frame,
// which snowballs into React's "maximum update depth exceeded". We fix this with
// the dnd-kit multi-container recipe: pointer-first collision detection plus a
// `recentlyMovedToNewContainer` latch that pins the over-target to the last one
// until the layout settles (reset on the next animation frame).

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
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { CardResponse, ColumnWithCards, UUID } from "@/api/types";
import { columnIdOfCard, isColumnId, moveCardTo, neighborsOf } from "./dndHelpers";

export interface MoveCommit {
  cardId: UUID;
  version: number;
  targetColumnId: UUID;
  prevCardId: UUID | null;
  nextCardId: UUID | null;
}

interface Params {
  columns: ColumnWithCards[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnWithCards[]>>;
  commitMove: (move: MoveCommit) => void;
}

export function useBoardDnd({ columns, setColumns, commitMove }: Params) {
  const [activeCard, setActiveCard] = useState<CardResponse | null>(null);

  const lastOverId = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewContainer = useRef(false);

  // Release the latch once the post-move render has painted.
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
    // Just moved to a new column, or lost the target mid-shift: hold the last one.
    if (recentlyMovedToNewContainer.current) {
      lastOverId.current = args.active.id;
    }
    return lastOverId.current ? [{ id: lastOverId.current }] : [];
  }, []);

  const findCard = (id: UUID): CardResponse | undefined =>
    columns.flatMap((c) => c.cards).find((c) => c.id === id);

  const onDragStart = (e: DragStartEvent) => {
    setActiveCard(findCard(e.active.id as UUID) ?? null);
  };

  // Live cross-column moves: keep the dragged card under the cursor's column.
  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = active.id as UUID;
    const overId = over.id as UUID;

    const fromCol = columnIdOfCard(columns, activeId);
    const toCol = isColumnId(columns, overId) ? overId : columnIdOfCard(columns, overId);
    if (!fromCol || !toCol || fromCol === toCol) return;

    recentlyMovedToNewContainer.current = true;
    setColumns((prev) => {
      const target = prev.find((c) => c.id === toCol);
      if (!target) return prev;
      // Drop over a card -> insert at its index; over the column -> append.
      const overIndex = isColumnId(prev, overId)
        ? target.cards.length
        : target.cards.findIndex((c) => c.id === overId);
      return moveCardTo(prev, activeId, toCol, overIndex < 0 ? target.cards.length : overIndex);
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    const activeId = active.id as UUID;
    const dragged = activeCard;
    setActiveCard(null);
    lastOverId.current = null;
    if (!over || !dragged) return;

    const overId = over.id as UUID;
    const targetColumnId = columnIdOfCard(columns, activeId);
    if (!targetColumnId) return;

    // Reorder within the final column if we dropped onto another card.
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

    // No-op: dropped onto itself without leaving its original column.
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
    lastOverId.current = null;
  };

  return {
    sensors,
    collisionDetection,
    activeCard,
    handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel },
  };
}
