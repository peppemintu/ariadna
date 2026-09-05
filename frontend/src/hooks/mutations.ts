// Write-side hooks. Board-scoped card/column mutations invalidate the board
// aggregate so the UI re-syncs with server truth (positions/versions).
// Card creation is optimistic: the card appears instantly and rolls back on error.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { boardUsersApi, boardsApi, cardsApi, columnsApi, invitationsApi, usersApi } from "@/api/endpoints";
import { ApiError } from "@/api/http";
import { qk } from "@/lib/queryClient";
import type {
  BoardColumnCreate,
  BoardColumnUpdate,
  BoardPermission,
  ColumnMove,
  BoardFull,
  CardAssign,
  CardCreate,
  CardMove,
  CardResponse,
  CardUpdate,
  UserCreateRequest,
  UUID,
} from "@/api/types";

/* ------------------------------ helpers ------------------------------ */

const OPTIMISTIC_PREFIX = "optimistic-";

/** True for locally-minted placeholder cards (not yet on the server). */
export function isOptimisticId(id: string): boolean {
  return id.startsWith(OPTIMISTIC_PREFIX);
}

function useBoardInvalidation(boardId: UUID) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: qk.boardFull(boardId) });
}

/* -------------------------------- cards ------------------------------- */

/**
 * Optimistic create: a placeholder card lands in the cache immediately
 * (end of the target column), then the refetch swaps it for the real one.
 * On error the snapshot is restored and `onError` lets the caller toast.
 */
export function useCreateCard(boardId: UUID, opts?: { onError?: (err: unknown) => void }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, body }: { columnId: UUID; body: CardCreate }) =>
      cardsApi.create(columnId, body),
    onMutate: async ({ columnId, body }) => {
      await qc.cancelQueries({ queryKey: qk.boardFull(boardId) });
      const prev = qc.getQueryData<BoardFull>(qk.boardFull(boardId));
      if (prev) {
        const now = new Date().toISOString();
        const temp: CardResponse = {
          id: `${OPTIMISTIC_PREFIX}${Date.now()}`,
          boardId,
          columnId,
          title: body.title,
          description: body.description ?? null,
          deadline: body.deadline ?? null,
          assigneeId: body.assigneeId ?? null,
          position: Number.MAX_SAFE_INTEGER, // display order = array order anyway
          version: 0,
          createdAt: now,
          updatedAt: now,
        };
        qc.setQueryData<BoardFull>(qk.boardFull(boardId), {
          ...prev,
          columns: prev.columns.map((c) =>
            c.id === columnId ? { ...c, cards: [...c.cards, temp] } : c,
          ),
        });
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.boardFull(boardId), ctx.prev);
      opts?.onError?.(err);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.boardFull(boardId) }),
  });
}

export function useUpdateCard(boardId: UUID) {
  const invalidate = useBoardInvalidation(boardId);
  return useMutation({
    mutationFn: ({ id, body }: { id: UUID; body: CardUpdate }) => cardsApi.update(id, body),
    onSettled: invalidate,
  });
}

export function useDeleteCard(boardId: UUID) {
  const invalidate = useBoardInvalidation(boardId);
  return useMutation({
    mutationFn: (id: UUID) => cardsApi.remove(id),
    onSuccess: invalidate,
  });
}

export function useAssignCard(boardId: UUID) {
  const invalidate = useBoardInvalidation(boardId);
  return useMutation({
    mutationFn: ({ id, body }: { id: UUID; body: CardAssign }) => cardsApi.assign(id, body),
    onSettled: invalidate,
  });
}

/**
 * Move a card. The backend derives the fractional position from prev/next.
 * `onConflict` fires on a 409 (someone else moved/edited it first).
 */
export function useMoveCard(
  boardId: UUID,
  opts?: { onConflict?: () => void; onError?: (err: unknown) => void },
) {
  const invalidate = useBoardInvalidation(boardId);
  return useMutation({
    mutationFn: ({ id, body }: { id: UUID; body: CardMove }) => cardsApi.move(id, body),
    onError: (err) => {
      if (err instanceof ApiError && err.isConflict) opts?.onConflict?.();
      else opts?.onError?.(err);
    },
    onSettled: invalidate,
  });
}

/* ------------------------------- columns ------------------------------ */
// Note: the backend has no optimistic lock on columns (no version in the DTO).

export function useCreateColumn(boardId: UUID) {
  const invalidate = useBoardInvalidation(boardId);
  return useMutation({
    mutationFn: (body: BoardColumnCreate) => columnsApi.create(boardId, body),
    onSuccess: invalidate,
  });
}

export function useUpdateColumn(boardId: UUID) {
  const invalidate = useBoardInvalidation(boardId);
  return useMutation({
    mutationFn: ({ id, body }: { id: UUID; body: BoardColumnUpdate }) =>
      columnsApi.update(id, body),
    onSettled: invalidate,
  });
}

/**
 * Move a column. Mirrors card moves: the backend derives the fractional
 * position from the prev/next column ids and version-checks for conflicts.
 * `onConflict` fires on a 409 (someone else reordered it first).
 */
export function useMoveColumn(
  boardId: UUID,
  opts?: { onConflict?: () => void; onError?: (err: unknown) => void },
) {
  const invalidate = useBoardInvalidation(boardId);
  return useMutation({
    mutationFn: ({ id, body }: { id: UUID; body: ColumnMove }) => columnsApi.move(id, body),
    onError: (err) => {
      if (err instanceof ApiError && err.isConflict) opts?.onConflict?.();
      else opts?.onError?.(err);
    },
    onSettled: invalidate,
  });
}

export function useDeleteColumn(boardId: UUID) {
  const invalidate = useBoardInvalidation(boardId);
  return useMutation({
    mutationFn: (id: UUID) => columnsApi.remove(id),
    onSuccess: invalidate,
  });
}

/* -------------------------------- boards ------------------------------ */
// Board mutations are NOT broadcast over WS (no BOARD_* action types), so other
// clients only learn about them on their next refetch.

/** Create a board — the backend makes the caller its owner in the same transaction. */
export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => boardsApi.create({ title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.boards }),
  });
}

export function useRenameBoard(boardId: UUID) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => boardsApi.update(boardId, { title }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.boards });
      qc.invalidateQueries({ queryKey: qk.boardFull(boardId) });
    },
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => boardsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.boards }),
  });
}

/* ------------------------------- members ------------------------------ */

/** Invite a user by email — only visible/callable when myAccess has MANAGE_MEMBERS. */
export function useInviteMember(boardId: UUID) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => invitationsApi.invite(boardId, { email }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.boardInvitations(boardId) }),
  });
}

export function useUpdateMemberPermissions(boardId: UUID) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ boardUserId, permissions }: { boardUserId: UUID; permissions: BoardPermission[] }) =>
      boardUsersApi.updatePermissions(boardUserId, permissions),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.boardFull(boardId) }),
  });
}

export function useRemoveBoardMember(boardId: UUID) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boardUserId: UUID) => boardUsersApi.remove(boardUserId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.boardFull(boardId) }),
  });
}

/* ----------------------------- invitations ----------------------------- */
// Accept/decline act on invitations addressed to me, not board-scoped.

export function useAcceptInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => invitationsApi.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.invitations });
      qc.invalidateQueries({ queryKey: qk.boards });
    },
  });
}

export function useDeclineInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: UUID) => invitationsApi.decline(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.invitations }),
  });
}

/* -------------------------------- users ------------------------------- */

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UserCreateRequest) => usersApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }),
  });
}

/** Rename a user. Invalidates every board query too — member names live there. */
export function useRenameUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: UUID; name: string }) => usersApi.update(id, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.users });
      qc.invalidateQueries({ queryKey: ["board"] });
    },
  });
}
