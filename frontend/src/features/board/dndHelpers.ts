// Pure helpers for board drag-and-drop. No React, no dnd-kit — easy to reason
// about and test in isolation.

import type { ColumnWithCards, UUID } from "@/api/types";

/** Which column currently holds this card (in the given snapshot). */
export function columnIdOfCard(columns: ColumnWithCards[], cardId: UUID): UUID | undefined {
  return columns.find((c) => c.cards.some((card) => card.id === cardId))?.id;
}

export function isColumnId(columns: ColumnWithCards[], id: UUID): boolean {
  return columns.some((c) => c.id === id);
}

/** The cards immediately before/after a card within its column. */
export function neighborsOf(
  columns: ColumnWithCards[],
  cardId: UUID,
): { prevCardId: UUID | null; nextCardId: UUID | null } {
  const col = columns.find((c) => c.cards.some((card) => card.id === cardId));
  if (!col) return { prevCardId: null, nextCardId: null };
  const idx = col.cards.findIndex((card) => card.id === cardId);
  return {
    prevCardId: idx > 0 ? col.cards[idx - 1].id : null,
    nextCardId: idx < col.cards.length - 1 ? col.cards[idx + 1].id : null,
  };
}

/**
 * Move a card into a target column at a given index (immutable).
 * If targetIndex is undefined, appends to the end.
 */
export function moveCardTo(
  columns: ColumnWithCards[],
  cardId: UUID,
  targetColumnId: UUID,
  targetIndex?: number,
): ColumnWithCards[] {
  const sourceCol = columns.find((c) => c.cards.some((card) => card.id === cardId));
  if (!sourceCol) return columns;
  const card = sourceCol.cards.find((c) => c.id === cardId)!;

  return columns.map((col) => {
    if (col.id === sourceCol.id && col.id === targetColumnId) {
      // Reorder within the same column.
      const without = col.cards.filter((c) => c.id !== cardId);
      const at = targetIndex ?? without.length;
      without.splice(at, 0, card);
      return { ...col, cards: without };
    }
    if (col.id === sourceCol.id) {
      return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
    }
    if (col.id === targetColumnId) {
      const next = [...col.cards];
      const at = targetIndex ?? next.length;
      next.splice(at, 0, card);
      return { ...col, cards: next };
    }
    return col;
  });
}
