// Compact list view of the whole board, grouped by column. No drag — read and
// click-to-edit (opens the shared CardDetail via onCardClick).

import { Avatar, Badge } from "@/ui";
import { formatDeadline, isOverdue } from "@/lib/format";
import type { CardResponse, ColumnWithCards, UserResponse, UUID } from "@/api/types";
import styles from "./ListView.module.css";

interface Props {
  columns: ColumnWithCards[];
  membersById: Map<UUID, UserResponse>;
  onCardClick: (card: CardResponse) => void;
}

export function ListView({ columns, membersById, onCardClick }: Props) {
  return (
    <div className={styles.wrap}>
      {columns.map((col) => (
        <section key={col.id} className={styles.group}>
          <header className={styles.groupHead}>
            <span className={styles.accent} style={{ background: col.color || "var(--signal-500)" }} aria-hidden />
            <h3 className={styles.groupTitle}>{col.title}</h3>
            <span className={styles.count}>{col.cards.length}</span>
          </header>

          {col.cards.length === 0 ? (
            <p className={styles.empty}>No cards</p>
          ) : (
            <ul className={styles.rows}>
              {col.cards.map((card) => {
                const assignee = card.assigneeId ? membersById.get(card.assigneeId) : undefined;
                const deadline = formatDeadline(card.deadline);
                return (
                  <li key={card.id}>
                    <button className={styles.row} onClick={() => onCardClick(card)}>
                      <span className={styles.title}>{card.title}</span>
                      <span className={styles.right}>
                        {deadline && (
                          <Badge tone={isOverdue(card.deadline) ? "flare" : "neutral"} dot={isOverdue(card.deadline)}>
                            {deadline}
                          </Badge>
                        )}
                        {assignee && <Avatar name={assignee.name} size={24} title={assignee.name} />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
