// Maps an ActionType to human-readable copy + a badge tone. Driven by the action
// type (stable contract), not the payload shape (unknown/volatile). We only peek
// at payload.title opportunistically.

import type { ActionType } from "@/api/types";

interface ActivityMeta {
  verb: string;
  tone: "signal" | "flare" | "success" | "warning" | "neutral";
}

const META: Record<ActionType, ActivityMeta> = {
  CARD_CREATED: { verb: "created a card", tone: "signal" },
  CARD_UPDATED: { verb: "updated a card", tone: "neutral" },
  CARD_DELETED: { verb: "deleted a card", tone: "flare" },
  CARD_MOVED: { verb: "moved a card", tone: "signal" },
  CARD_ASSIGNED: { verb: "reassigned a card", tone: "warning" },
  COLUMN_CREATED: { verb: "created a column", tone: "success" },
  COLUMN_UPDATED: { verb: "updated a column", tone: "neutral" },
  COLUMN_DELETED: { verb: "deleted a column", tone: "flare" },
};

export function activityMeta(type: ActionType): ActivityMeta {
  return META[type] ?? { verb: type.toLowerCase().replace(/_/g, " "), tone: "neutral" };
}

/** Best-effort title pulled from a loosely-typed payload. */
export function payloadTitle(payload: unknown): string | null {
  if (payload && typeof payload === "object" && "title" in payload) {
    const t = (payload as { title: unknown }).title;
    if (typeof t === "string" && t.trim()) return t;
  }
  return null;
}
