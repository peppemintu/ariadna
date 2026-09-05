// Mirror of the backend DTOs (art.moor.ariadna.data.dto.*).
// Java `Instant` -> ISO-8601 string. `UUID` -> string. `double`/`long` -> number.
// Keep this file in lockstep with the backend records.

export type UUID = string;
export type Instant = string; // ISO-8601, e.g. "2025-07-03T19:11:00Z"

export type UserRole = "ADMIN" | "USER";

export type ActionType =
  | "COLUMN_CREATED"
  | "COLUMN_UPDATED"
  | "COLUMN_DELETED"
  | "CARD_CREATED"
  | "CARD_UPDATED"
  | "CARD_DELETED"
  | "CARD_MOVED"
  | "CARD_ASSIGNED";

// ---- User ----
export interface UserResponse {
  id: UUID;
  email: string;
  name: string;
  role: UserRole;
}
export interface UserCreateRequest {
  email: string;
  password: string; // 8..72
  name: string;
}
export interface LoginRequest {
  email: string;
  password: string; // 8..72
}

export interface AuthResponse {
  accessToken: string;
}

export interface UserUpdateRequest {
  name: string;
}

// ---- Board permissions ----
// Atomic, grantable board capabilities. Backend is the source of truth for
// what a role grants (GET /api/board-roles) — never hardcode a role's
// permission set on the frontend.
export type BoardPermission = "EDIT_CARDS" | "MANAGE_MEMBERS";

/** The caller's own rights on a board — read every check off this, never
 *  recompute "am I the owner/can I edit" from raw member lists. */
export interface BoardMyAccess {
  owner: boolean;
  permissions: BoardPermission[];
}

export interface BoardRoleResponse {
  name: string;
  permissions: BoardPermission[];
}

// ---- Board ----
export interface BoardResponse {
  id: UUID;
  title: string;
  ownerId: UUID;
  createdAt: Instant;
  updatedAt: Instant;
  myAccess: BoardMyAccess;
}
export interface BoardRequest {
  title: string; // max 255
}

// ---- Column ----
export interface BoardColumnResponse {
  id: UUID;
  boardId: UUID;
  title: string;
  color: string | null; // max 7, e.g. "#0076f5"
  position: number;
  version: number;
  createdAt: Instant;
  updatedAt: Instant;
}
export interface BoardColumnCreate {
  title: string;
  color?: string | null;
}
export interface BoardColumnUpdate {
  title: string;
  color?: string | null;
}
export interface ColumnMove {
  prevColumnId: UUID | null;
  nextColumnId: UUID | null;
  version: number; // optimistic lock
}

// ---- Card ----
export interface CardResponse {
  id: UUID;
  boardId: UUID;
  columnId: UUID;
  title: string;
  description: string | null;
  deadline: Instant | null;
  assigneeId: UUID | null;
  position: number;
  version: number;
  createdAt: Instant;
  updatedAt: Instant;
}
export interface CardCreate {
  title: string;
  description?: string | null;
  deadline?: Instant | null;
  assigneeId?: UUID | null;
}
export interface CardUpdate {
  title: string;
  description?: string | null;
  deadline?: Instant | null;
  version: number; // optimistic lock
}
export interface CardAssign {
  assigneeId: UUID | null;
}
export interface CardMove {
  targetColumnId: UUID;
  prevCardId: UUID | null;
  nextCardId: UUID | null;
  version: number; // optimistic lock
}

// ---- Board membership ----
export interface BoardUserResponse {
  id: UUID;
  boardId: UUID;
  userId: UUID;
  owner: boolean;
  permissions: BoardPermission[];
}

/** A board member for list rendering: identity + rights in one shape. `id` is
 *  the USER id (matches UserResponse.id — assignee pickers/avatars key off it
 *  everywhere); `boardUserId` is the membership row id, the target for
 *  permission changes or removal. */
export interface BoardMember {
  id: UUID;
  boardUserId: UUID;
  name: string;
  email: string;
  owner: boolean;
  permissions: BoardPermission[];
}

// ---- Invitations ----
export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface InvitationCreateRequest {
  email: string;
}

export interface InvitationResponse {
  id: UUID;
  boardId: UUID;
  boardTitle: string;
  invitedEmail: string;
  invitedById: UUID;
  invitedByName: string;
  status: InvitationStatus;
  createdAt: Instant;
  respondedAt: Instant | null;
}

// ---- Activity ----
export interface ActivityResponse {
  id: UUID;
  boardId: UUID;
  targetItemId: UUID | null;
  userId: UUID | null;
  actionType: ActionType;
  payload: Record<string, unknown>;
  createdAt: Instant;
}

// ---- WebSocket ----
// Broadcast to /topic/board/{boardId} on every board mutation.
export interface BoardMessage {
  type: ActionType;
  payload: unknown; // shape depends on `type` (usually a CardResponse / column id)
}

// ---- Aggregate ----
export interface ColumnWithCards extends BoardColumnResponse {
  cards: CardResponse[];
}
export interface BoardFull {
  id: UUID;
  title: string;
  ownerId: UUID;
  createdAt: Instant;
  updatedAt: Instant;
  myAccess: BoardMyAccess;
  members: BoardMember[];
  columns: ColumnWithCards[];
}
