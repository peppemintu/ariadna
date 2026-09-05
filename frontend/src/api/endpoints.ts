// One function per backend route. Grouped by resource. No React here —
// TanStack Query hooks (added in a later step) call into these.

import { http } from "./http";
import type {
  ActivityResponse,
  BoardColumnCreate,
  BoardColumnResponse,
  BoardColumnUpdate,
  ColumnMove,
  BoardFull,
  BoardPermission,
  BoardRequest,
  BoardResponse,
  BoardRoleResponse,
  AuthResponse,
  BoardUserResponse,
  CardAssign,
  CardCreate,
  CardMove,
  CardResponse,
  CardUpdate,
  InvitationCreateRequest,
  InvitationResponse,
  LoginRequest,
  UserCreateRequest,
  UserResponse,
  UserRole,
  UserUpdateRequest,
  UUID,
} from "./types";

export const authApi = {
  login: (b: LoginRequest) => http.post<AuthResponse>("/api/auth/login", b),
  register: (b: UserCreateRequest) => http.post<UserResponse>("/api/auth/register", b),
  // Exchanges the httpOnly refresh cookie for a new access token; used on app
  // bootstrap to restore a session across reloads. http.ts also calls this
  // internally to silently retry a request once the access token has expired.
  refresh: () => http.post<AuthResponse>("/api/auth/refresh"),
  logout: () => http.post<void>("/api/auth/logout"),
};

export const usersApi = {
  list: () => http.get<UserResponse[]>("/api/user"), // ADMIN-only on the backend
  me: () => http.get<UserResponse>("/api/user/me"),
  get: (id: UUID) => http.get<UserResponse>(`/api/user/${id}`),
  create: (b: UserCreateRequest) => http.post<UserResponse>("/api/user", b),
  update: (id: UUID, b: UserUpdateRequest) =>
    http.put<UserResponse>(`/api/user/${id}`, b),
  updateRole: (id: UUID, role: UserRole) =>
    http.put<UserResponse>(`/api/user/role/${id}?role=${role}`),
  remove: (id: UUID) => http.del(`/api/user/${id}`),
};

export const boardsApi = {
  // Only boards the caller is a member of — the backend self-scopes this.
  list: () => http.get<BoardResponse[]>("/api/board"),
  get: (id: UUID) => http.get<BoardResponse>(`/api/board/${id}`),
  getFull: (id: UUID) => http.get<BoardFull>(`/api/board/${id}/full`),
  create: (b: BoardRequest) => http.post<BoardResponse>("/api/board", b),
  update: (id: UUID, b: BoardRequest) =>
    http.put<BoardResponse>(`/api/board/${id}`, b),
  remove: (id: UUID) => http.del(`/api/board/${id}`),
};

export const boardRolesApi = {
  list: () => http.get<BoardRoleResponse[]>("/api/board-roles"),
};

export const columnsApi = {
  listByBoard: (boardId: UUID) =>
    http.get<BoardColumnResponse[]>(`/api/board/${boardId}/column`),
  get: (id: UUID) => http.get<BoardColumnResponse>(`/api/column/${id}`),
  create: (boardId: UUID, b: BoardColumnCreate) =>
    http.post<BoardColumnResponse>(`/api/board/${boardId}/column`, b),
  update: (id: UUID, b: BoardColumnUpdate) =>
    http.put<BoardColumnResponse>(`/api/column/${id}`, b),
  move: (id: UUID, b: ColumnMove) =>
    http.patch<BoardColumnResponse>(`/api/column/${id}/position`, b),
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

// Membership by its own id — adding a member happens only via invitations
// (invitationsApi below), never directly by user id.
export const boardUsersApi = {
  updatePermissions: (boardUserId: UUID, permissions: BoardPermission[]) =>
    http.patch<BoardUserResponse>(`/api/boardUser/${boardUserId}`, { permissions }),
  remove: (boardUserId: UUID) => http.del(`/api/boardUser/${boardUserId}`),
};

export const invitationsApi = {
  invite: (boardId: UUID, b: InvitationCreateRequest) =>
    http.post<InvitationResponse>(`/api/board/${boardId}/invitations`, b),
  pendingForBoard: (boardId: UUID) =>
    http.get<InvitationResponse[]>(`/api/board/${boardId}/invitations`),
  mine: () => http.get<InvitationResponse[]>("/api/invitations/me"),
  accept: (id: UUID) => http.post<BoardUserResponse>(`/api/invitations/${id}/accept`),
  decline: (id: UUID) => http.post<void>(`/api/invitations/${id}/decline`),
};

export const activityApi = {
  byBoard: (boardId: UUID) =>
    http.get<ActivityResponse[]>(`/api/board/${boardId}/activity`),
};
