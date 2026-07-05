// Encapsulates all board drag-and-drop state and event wiring so BoardView stays
// declarative. Between-column moves happen live in local state during dragOver;
// the server commit is computed once on dragEnd from the final neighbours.

import { useState } from "react";
import {
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
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

  // Small activation distance so a plain click (open detail) isn't read as a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  const onDragCancel = () => setActiveCard(null);

  return {
    sensors,
    collisionDetection: closestCorners,
    activeCard,
    handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel },
  };
}
