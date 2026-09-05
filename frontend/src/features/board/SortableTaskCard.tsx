// Drag behaviour wrapper around the presentational TaskCard. Optimistic
// placeholder cards (not on the server yet) can't be dragged or opened —
// there's nothing to PATCH until the real card lands.

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CardResponse, BoardMember } from "@/api/types";
import { isOptimisticId } from "@/hooks/mutations";
import { TaskCard } from "./TaskCard";

interface Props {
  card: CardResponse;
  assignee?: BoardMember;
  onClick?: (card: CardResponse) => void;
  canEdit: boolean;
}

export const SortableTaskCard = memo(function SortableTaskCard({ card, assignee, onClick, canEdit }: Props) {
  const optimistic = isOptimisticId(card.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card" },
    disabled: optimistic || !canEdit,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : optimistic ? 0.6 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <TaskCard card={card} assignee={assignee} onClick={optimistic ? undefined : onClick} />
    </div>
  );
});
