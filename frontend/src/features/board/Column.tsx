// A board column: drag handle, colored header, title, edit affordance, and
// sortable cards. Columns themselves are sortable (drag them by the grip in the
// header only — the rest of the header stays clickable), and each column is also
// the drop container for cards. When a color is set, the header is painted in
// that shade and the body takes a muted, theme-aware tint of it.

import { memo, useMemo, useState } from "react";
import { useDndContext } from "@dnd-kit/core";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

const GripIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
    <circle cx="5" cy="3" r="1.4" /><circle cx="11" cy="3" r="1.4" />
    <circle cx="5" cy="8" r="1.4" /><circle cx="11" cy="8" r="1.4" />
    <circle cx="5" cy="13" r="1.4" /><circle cx="11" cy="13" r="1.4" />
  </svg>
);

export const Column = memo(function Column({ column, membersById, onCardClick }: ColumnProps) {
  const [editing, setEditing] = useState(false);
  const colored = normalizeHex(column.color) !== null;
  const cardIds = useMemo(() => column.cards.map((c) => c.id), [column.cards]);

  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id, data: { type: "column" } });

  // Highlight the body only when a *card* is being dragged over this column
  // (not while reordering columns). Resolve via the live drag context.
  const { active, over } = useDndContext();
  const draggingCard = active?.data.current?.type === "card";
  const cardOverHere =
    draggingCard && (over?.id === column.id || column.cards.some((c) => c.id === over?.id));

  const style = {
    ...columnColorVars(column.color),
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <section
      ref={setNodeRef}
      className={styles.column}
      style={style}
      data-colored={colored ? "" : undefined}
      data-dragging={isDragging ? "" : undefined}
    >
      <header className={styles.head}>
        <button
          ref={setActivatorNodeRef}
          className={styles.grip}
          aria-label={`Reorder column ${column.title}`}
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripIcon />
        </button>
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

      <div className={styles.body} data-scroll data-over={cardOverHere ? "" : undefined}>
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

/** Presentational preview shown in the DragOverlay while a column is dragged. */
export function ColumnOverlay({ column }: { column: ColumnWithCards }) {
  const colored = normalizeHex(column.color) !== null;
  const count = column.cards.length;
  return (
    <section
      className={styles.column}
      style={columnColorVars(column.color)}
      data-colored={colored ? "" : undefined}
      data-overlay=""
    >
      <header className={styles.head}>
        <span className={styles.grip} aria-hidden><GripIcon /></span>
        <h3 className={styles.title}>{column.title}</h3>
      </header>
      <div className={styles.body}>
        <div className={styles.empty}>{count} {count === 1 ? "card" : "cards"}</div>
      </div>
    </section>
  );
}
