// Write-side hooks. Board-scoped card/column mutations invalidate the board
// aggregate so the UI re-syncs with server truth (positions/versions).
// Card creation is optimistic: the card appears instantly and rolls back on error.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { boardUsersApi, boardsApi, cardsApi, columnsApi, usersApi } from "@/api/endpoints";
import { ApiError } from "@/api/http";
import { qk } from "@/lib/queryClient";
import type {
  BoardColumnCreate,
  BoardColumnUpdate,
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

/**
 * Create a board and make the creator its first member — the backend has no
 * auth, so "creator" is just the current user passed from the client, added in
 * a second call. If that membership call fails, we roll back the now-orphaned
 * board (with no "all boards" view it would otherwise vanish from sight).
 * A backend that did both in one transaction would be cleaner; see the note in
 * the chat.
 */
export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, userId }: { title: string; userId: UUID }) => {
      const board = await boardsApi.create({ title });
      try {
        await boardUsersApi.add(board.id, userId);
      } catch (err) {
        await boardsApi.remove(board.id).catch(() => {});
        throw err;
      }
      return board;
    },
    // Prefix ["boards"] catches both the full list and per-user lists.
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

export function useAddBoardMember(boardId: UUID) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: UUID) => boardUsersApi.add(boardId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.boardFull(boardId) });
      qc.invalidateQueries({ queryKey: qk.boards }); // per-user board lists
    },
  });
}

/** Requires the pair-delete endpoint on the backend (see endpoints.ts note). */
export function useRemoveBoardMember(boardId: UUID) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: UUID) => boardUsersApi.removeByPair(boardId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.boardFull(boardId) });
      qc.invalidateQueries({ queryKey: qk.boards });
    },
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
