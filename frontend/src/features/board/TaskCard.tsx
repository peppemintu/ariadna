// A kanban card. Shows only what the backend actually stores: title,
// description preview, deadline, assignee. No labels/priority/subtasks.

import { memo } from "react";
import { Avatar, Badge } from "@/ui";
import type { CardResponse, UserResponse } from "@/api/types";
import { formatDeadline, isOverdue } from "@/lib/format";
import { stripMarkdown } from "@/lib/richText";
import { useSettings } from "@/lib/settings";
import styles from "./TaskCard.module.css";

interface TaskCardProps {
  card: CardResponse;
  assignee?: UserResponse;
  onClick?: (card: CardResponse) => void;
}

export const TaskCard = memo(function TaskCard({ card, assignee, onClick }: TaskCardProps) {
  const { settings } = useSettings();
  const deadline = formatDeadline(card.deadline);
  const overdue = isOverdue(card.deadline);
  const preview = stripMarkdown(card.description);

  return (
    <article
      className={styles.card}
      onClick={onClick ? () => onClick(card) : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && onClick(card) : undefined}
    >
      <h4 className={styles.title} data-truncate={settings.truncateCardTitles ? "" : undefined}>
        {card.title}
      </h4>
      {preview && <p className={styles.desc}>{preview}</p>}

      {(deadline || assignee) && (
        <div className={styles.footer}>
          {deadline ? (
            <Badge tone={overdue ? "flare" : "neutral"} dot={overdue}>
              {deadline}
            </Badge>
          ) : (
            <span />
          )}
          {assignee && <Avatar name={assignee.name} size={26} title={assignee.name} />}
        </div>
      )}
    </article>
  );
});
