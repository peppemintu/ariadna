// Read-side data hooks. Thin wrappers over the endpoint fns so components never
// touch fetch/query-keys directly. Mutations live separately (added in step 5).

import { useQuery } from "@tanstack/react-query";
import { activityApi, boardRolesApi, boardsApi, invitationsApi, usersApi } from "@/api/endpoints";
import { qk } from "@/lib/queryClient";
import type { UUID } from "@/api/types";

/** All users. NB: GET /api/user is ADMIN-only on the backend — only call this
 *  from admin-gated UI (pass `enabled` accordingly). For the current user use
 *  the currentUser context (/me); for a board's people use board/full members. */
export function useUsers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: qk.users,
    queryFn: usersApi.list,
    enabled: options?.enabled ?? true,
  });
}

/** Boards the current user is a member of — the backend self-scopes this. */
export function useBoards() {
  return useQuery({ queryKey: qk.boards, queryFn: boardsApi.list });
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

/** Named permission-bundle presets for the "grant a role" UI. */
export function useBoardRoles() {
  return useQuery({ queryKey: qk.boardRoles, queryFn: boardRolesApi.list, staleTime: Infinity });
}

/** Invitations addressed to the current user, pending a response. */
export function usePendingInvitations() {
  return useQuery({ queryKey: qk.invitations, queryFn: invitationsApi.mine });
}

/** Invitations a board has sent that are still awaiting a response. */
export function useBoardInvitations(boardId: UUID | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: boardId ? qk.boardInvitations(boardId) : ["board", "invitations", "nil"],
    queryFn: () => invitationsApi.pendingForBoard(boardId!),
    enabled: Boolean(boardId) && (options?.enabled ?? true),
  });
}
