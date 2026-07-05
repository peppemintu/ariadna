// A board column: accent bar, title, add-card button, edit affordance, and
// sortable cards. Droppable as a whole for empty-space drops. Cards are created
// from a full dialog opened via the header "+".

import { useState } from "react";
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

export function Column({ column, membersById, members, onCardClick, onCreateCard }: ColumnProps) {
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
          className={styles.add}
          onClick={() => setCreating(true)}
          aria-label={`Add card to ${column.title}`}
          title="Add card"
        >
          +
        </button>
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
}
