// Read-side data hooks. Thin wrappers over the endpoint fns so components never
// touch fetch/query-keys directly. Mutations live separately (added in step 5).

import { useQuery } from "@tanstack/react-query";
import { activityApi, boardUsersApi, boardsApi, usersApi } from "@/api/endpoints";
import { qk } from "@/lib/queryClient";
import type { UUID } from "@/api/types";

export function useUsers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: qk.users,
    queryFn: usersApi.list,
    enabled: options?.enabled ?? true,
  });
}

export function useBoards() {
  return useQuery({ queryKey: qk.boards, queryFn: boardsApi.list });
}

/** Boards the given user is a member of (via BoardUser links). */
export function useMyBoards(userId: UUID | undefined, enabled = true) {
  return useQuery({
    queryKey: userId ? qk.boardsByUser(userId) : ["boards", "user", "nil"],
    queryFn: () => boardUsersApi.boardsByUser(userId!),
    enabled: Boolean(userId) && enabled,
  });
}

/** Full board aggregate — board + members + columns with nested cards. */
export function useBoardFull(boardId: UUID | undefined) {
  return useQuery({
    queryKey: boardId ? qk.boardFull(boardId) : ["board", "full", "nil"],
    queryFn: () => boardsApi.getFull(boardId!),
    enabled: Boolean(boardId),
  });
}

/** Board activity feed. Enabled on demand (only when the tab is visible). */
export function useActivity(boardId: UUID | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: boardId ? qk.activity(boardId) : ["board", "activity", "nil"],
    queryFn: () => activityApi.byBoard(boardId!),
    enabled: Boolean(boardId) && (options?.enabled ?? true),
  });
}
