// One function per backend route. Grouped by resource. No React here —
// TanStack Query hooks (added in a later step) call into these.

import { http } from "./http";
import type {
  ActivityResponse,
  BoardColumnCreate,
  BoardColumnResponse,
  BoardColumnUpdate,
  BoardFull,
  BoardRequest,
  BoardResponse,
  BoardUserResponse,
  CardAssign,
  CardCreate,
  CardMove,
  CardResponse,
  CardUpdate,
  UserCreateRequest,
  UserResponse,
  UserRole,
  UserUpdateRequest,
  UUID,
} from "./types";

export const usersApi = {
  list: () => http.get<UserResponse[]>("/api/user"),
  get: (id: UUID) => http.get<UserResponse>(`/api/user/${id}`),
  create: (b: UserCreateRequest) => http.post<UserResponse>("/api/user", b),
  update: (id: UUID, b: UserUpdateRequest) =>
    http.put<UserResponse>(`/api/user/${id}`, b),
  updateRole: (id: UUID, role: UserRole) =>
    http.put<UserResponse>(`/api/user/role/${id}?role=${role}`),
  remove: (id: UUID) => http.del(`/api/user/${id}`),
};

export const boardsApi = {
  list: () => http.get<BoardResponse[]>("/api/board"),
  get: (id: UUID) => http.get<BoardResponse>(`/api/board/${id}`),
  // TO BE ADDED on the backend: GET /api/board/{id}/full
  getFull: (id: UUID) => http.get<BoardFull>(`/api/board/${id}/full`),
  create: (b: BoardRequest) => http.post<BoardResponse>("/api/board", b),
  update: (id: UUID, b: BoardRequest) =>
    http.put<BoardResponse>(`/api/board/${id}`, b),
  remove: (id: UUID) => http.del(`/api/board/${id}`),
};

export const columnsApi = {
  listByBoard: (boardId: UUID) =>
    http.get<BoardColumnResponse[]>(`/api/board/${boardId}/column`),
  get: (id: UUID) => http.get<BoardColumnResponse>(`/api/column/${id}`),
  create: (boardId: UUID, b: BoardColumnCreate) =>
    http.post<BoardColumnResponse>(`/api/board/${boardId}/column`, b),
  update: (id: UUID, b: BoardColumnUpdate) =>
    http.put<BoardColumnResponse>(`/api/column/${id}`, b),
  remove: (id: UUID) => http.del(`/api/column/${id}`),
};

export const cardsApi = {
  listByColumn: (columnId: UUID) =>
    http.get<CardResponse[]>(`/api/card/column/${columnId}`),
  get: (id: UUID) => http.get<CardResponse>(`/api/card/${id}`),
  create: (columnId: UUID, b: CardCreate) =>
    http.post<CardResponse>(`/api/card/column/${columnId}`, b),
  update: (id: UUID, b: CardUpdate) =>
    http.put<CardResponse>(`/api/card/${id}`, b),
  assign: (id: UUID, b: CardAssign) =>
    http.patch<CardResponse>(`/api/card/${id}/assignee`, b),
  move: (id: UUID, b: CardMove) =>
    http.patch<CardResponse>(`/api/card/${id}/position`, b),
  remove: (id: UUID) => http.del(`/api/card/${id}`),
};

export const boardUsersApi = {
  add: (boardId: UUID, userId: UUID) =>
    http.post<BoardUserResponse>(`/api/boardUser/board/${boardId}/user/${userId}`),
  usersByBoard: (boardId: UUID) =>
    http.get<UserResponse[]>(`/api/boardUser/board/${boardId}/users`),
  boardsByUser: (userId: UUID) =>
    http.get<BoardResponse[]>(`/api/boardUser/boards/user/${userId}`),
  remove: (id: UUID) => http.del(`/api/boardUser/${id}`),
  // TO BE ADDED on the backend: DELETE /api/boardUser/board/{b}/user/{u}.
  // The existing DELETE needs the link id, which no endpoint exposes.
  removeByPair: (boardId: UUID, userId: UUID) =>
    http.del(`/api/boardUser/board/${boardId}/user/${userId}`),
};

export const activityApi = {
  byBoard: (boardId: UUID) =>
    http.get<ActivityResponse[]>(`/api/board/${boardId}/activity`),
};
