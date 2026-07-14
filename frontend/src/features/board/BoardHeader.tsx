import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Button } from "@/ui";
import { useCurrentUser } from "@/lib/currentUser";
import type { BoardFull } from "@/api/types";
import { BoardMenu } from "./BoardMenu";
import { MembersDialog } from "./MembersDialog";
import { SettingsMenu } from "@/features/settings/SettingsMenu";
import styles from "./BoardHeader.module.css";

interface BoardHeaderProps {
  board: BoardFull;
  live?: boolean;
}

export function BoardHeader({ board, live }: BoardHeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useCurrentUser();
  const [membersOpen, setMembersOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Button variant="ghost" size="sm" onClick={() => navigate("/boards")}>← Boards</Button>
        <h1 className={styles.title}>{board.title}</h1>
        <span className={styles.live} data-on={live ? "" : undefined} title={live ? "Live" : "Reconnecting…"}>
          <span className={styles.liveDot} aria-hidden />
          {live ? "Live" : "Offline"}
        </span>
      </div>

      <div className={styles.right}>
        <button
          className={styles.membersBtn}
          onClick={() => setMembersOpen(true)}
          aria-label="Board members"
          title="Board members"
        >
          {board.members.length === 0 ? (
            <span className={styles.membersEmpty}>+ Members</span>
          ) : (
            <span className={styles.members}>
              {board.members.slice(0, 5).map((m) => (
                <span key={m.id} className={styles.memberChip}>
                  <Avatar name={m.name} size={28} title={m.name} />
                </span>
              ))}
              {board.members.length > 5 && <span className={styles.more}>+{board.members.length - 5}</span>}
            </span>
          )}
        </button>

        {user && <Avatar name={user.name} size={32} title={`You — ${user.name}`} />}
        <BoardMenu board={board} onOpenMembers={() => setMembersOpen(true)} />
        <SettingsMenu onLogout={handleLogout} />
      </div>

      <MembersDialog board={board} open={membersOpen} onClose={() => setMembersOpen(false)} />
    </header>
  );
}
