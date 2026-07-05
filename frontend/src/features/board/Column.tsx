// A board column: accent bar, title, count, edit affordance, sortable cards,
// and an add-card composer. Droppable as a whole for empty-space drops.

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ColumnWithCards, CardResponse, UserResponse, UUID } from "@/api/types";
import { SortableTaskCard } from "./SortableTaskCard";
import { CardComposer } from "./CardComposer";
import { ColumnEditDialog } from "./ColumnEditDialog";
import styles from "./Column.module.css";

interface ColumnProps {
  column: ColumnWithCards;
  membersById: Map<UUID, UserResponse>;
  onCardClick?: (card: CardResponse) => void;
  onCreateCard: (columnId: UUID, title: string) => void;
}

export function Column({ column, membersById, onCardClick, onCreateCard }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [editing, setEditing] = useState(false);
  const accent = column.color || "var(--signal-500)";
  const cardIds = column.cards.map((c) => c.id);

  return (
    <section className={styles.column}>
      <header className={styles.head}>
        <span className={styles.accent} style={{ background: accent }} aria-hidden />
        <h3 className={styles.title}>{column.title}</h3>
        <span className={styles.count}>{column.cards.length}</span>
        <button
          className={styles.edit}
          onClick={() => setEditing(true)}
          aria-label={`Edit column ${column.title}`}
          title="Edit column"
        >
          ✎
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

        <CardComposer onCreate={(title) => onCreateCard(column.id, title)} />
      </div>

      <ColumnEditDialog column={column} open={editing} onClose={() => setEditing(false)} />
    </section>
  );
}
