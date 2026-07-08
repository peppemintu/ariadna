// A board column: accent bar, title, add-card button, edit affordance, and
// sortable cards. Memoised so a drag that rebuilds the columns array only
// re-renders the columns that actually changed.

import { memo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { CardCreate, ColumnWithCards, CardResponse, UserResponse, UUID } from "@/api/types";
import { SortableTaskCard } from "./SortableTaskCard";
import { ColumnEditDialog } from "./ColumnEditDialog";
import { CardCreateDialog } from "./CardCreateDialog";
import styles from "./Column.module.css";

interface ColumnProps {
  column: ColumnWithCards;
  membersById: Map<UUID, UserResponse>;
  members: UserResponse[];
  onCardClick?: (card: CardResponse) => void;
  onCreateCard: (columnId: UUID, body: CardCreate) => void;
}

export const Column = memo(function Column({
  column,
  membersById,
  members,
  onCardClick,
  onCreateCard,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const accent = column.color || "var(--signal-500)";
  const cardIds = column.cards.map((c) => c.id);

  return (
    <section className={styles.column}>
      <header className={styles.head}>
        <span className={styles.accent} style={{ background: accent }} aria-hidden />
        <h3 className={styles.title}>{column.title}</h3>
        <button
          className={styles.headBtn}
          onClick={() => setCreating(true)}
          aria-label={`Add card to ${column.title}`}
          title="Add card"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
            <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" />
          </svg>
        </button>
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

      <div ref={setNodeRef} className={styles.body} data-over={isOver ? "" : undefined}>
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
      <CardCreateDialog
        columnId={column.id}
        columnTitle={column.title}
        members={members}
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={onCreateCard}
      />
    </section>
  );
});
