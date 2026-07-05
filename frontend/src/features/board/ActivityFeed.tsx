// Live activity feed for a board. Realtime already invalidates this query on any
// board event (see useBoardRealtime), so the list refreshes on its own.

import { useActivity } from "@/hooks/queries";
import { Avatar, Badge } from "@/ui";
import { formatRelativeTime } from "@/lib/format";
import { activityMeta, payloadTitle } from "./activityText";
import type { UserResponse, UUID } from "@/api/types";
import styles from "./ActivityFeed.module.css";

interface Props {
  boardId: UUID;
  membersById: Map<UUID, UserResponse>;
  active: boolean;
}

export function ActivityFeed({ boardId, membersById, active }: Props) {
  const { data, isLoading, isError, error } = useActivity(boardId, { enabled: active });

  if (isLoading) return <p className={styles.note}>Loading activity…</p>;
  if (isError)
    return (
      <p className={styles.error}>
        Couldn't load activity{error instanceof Error ? ` — ${error.message}` : ""}.
      </p>
    );
  if (!data || data.length === 0) return <p className={styles.note}>No activity yet.</p>;

  return (
    <ul className={styles.feed}>
      {data.map((a) => {
        const meta = activityMeta(a.actionType);
        const who = a.userId ? membersById.get(a.userId)?.name ?? "Someone" : "Someone";
        const title = payloadTitle(a.payload);
        return (
          <li key={a.id} className={styles.item}>
            <Avatar name={who} size={30} />
            <div className={styles.body}>
              <div className={styles.line}>
                <span className={styles.who}>{who}</span>
                <span className={styles.verb}>{meta.verb}</span>
                {title && <span className={styles.title}>“{title}”</span>}
              </div>
              <div className={styles.meta}>
                <Badge tone={meta.tone}>{a.actionType.replace(/_/g, " ")}</Badge>
                <span className={styles.time}>{formatRelativeTime(a.createdAt)}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
