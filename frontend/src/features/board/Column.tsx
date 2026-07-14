// A board column: colored header, title, edit affordance, and sortable cards.
// When a color is set, the header is painted in that exact shade and the body
// takes a muted, theme-aware tint of it (see color.ts + Column.module.css).
// Card creation is handled by the single board-level "Add card" button, so the
// column header only carries the edit control. Memoised so a drag that rebuilds
// the columns array only re-renders the columns that actually changed.

import { memo, useMemo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ColumnWithCards, CardResponse, UserResponse, UUID } from "@/api/types";
import { columnColorVars, normalizeHex } from "@/lib/color";
import { SortableTaskCard } from "./SortableTaskCard";
import { ColumnEditDialog } from "./ColumnEditDialog";
import styles from "./Column.module.css";

interface ColumnProps {
  column: ColumnWithCards;
  membersById: Map<UUID, UserResponse>;
  onCardClick?: (card: CardResponse) => void;
}

export const Column = memo(function Column({ column, membersById, onCardClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [editing, setEditing] = useState(false);
  const colored = normalizeHex(column.color) !== null;
  const cardIds = useMemo(() => column.cards.map((c) => c.id), [column.cards]);

  return (
    <section className={styles.column} style={columnColorVars(column.color)} data-colored={colored ? "" : undefined}>
      <header className={styles.head}>
        <h3 className={styles.title}>{column.title}</h3>
        <button
          className={styles.headBtn}
          onClick={() => setEditing(true)}
          aria-label={`Edit column ${column.title}`}
          title="Edit column"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden>
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
        </button>
      </header>

      <div ref={setNodeRef} className={styles.body} data-scroll data-over={isOver ? "" : undefined}>
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cards.length === 0 ? (
            <div className={styles.empty}>Drop here</div>
          ) : (
            column.cards.map((card) => (
              <SortableTaskCard
                key={card.id}
                card={card}
                assignee={card.assigneeId ? membersById.get(card.assigneeId) : undefined}
                onClick={onCardClick}
              />
            ))
          )}
        </SortableContext>
      </div>

      <ColumnEditDialog column={column} open={editing} onClose={() => setEditing(false)} />
    </section>
  );
});
