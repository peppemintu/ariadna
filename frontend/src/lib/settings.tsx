// Client-side user settings.
//
// Persisted to localStorage, namespaced by user id so two accounts on one
// browser don't clobber each other's preferences. This is intentionally the
// only source of truth for now — see the note in chat about moving these to the
// backend later (a `preferences` JSON blob on the user, or a dedicated
// /api/user/{id}/settings route, would let settings follow the user across
// devices).
//
// Adding a setting = extend `Settings`, `DEFAULTS`, and (if user-facing) the
// SettingsDialog. Everything else flows through automatically.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useCurrentUser } from "./currentUser";

export interface Settings {
  /** Clamp long card titles to two lines instead of showing them in full. */
  truncateCardTitles: boolean;
  /** Per-board default column for the quick "Add card" dialog (board id -> column id). */
  defaultColumnByBoard: Record<string, string>;
}

const DEFAULTS: Settings = {
  truncateCardTitles: false,
  defaultColumnByBoard: {},
};

const storageKey = (userId: string | null) =>
  userId ? `ariadna:settings:${userId}` : "ariadna:settings:anon";

function readSettings(userId: string | null): Settings {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULTS, ...parsed, defaultColumnByBoard: { ...parsed.defaultColumnByBoard } };
  } catch {
    return DEFAULTS;
  }
}

interface SettingsCtx {
  settings: Settings;
  /** Patch one or more top-level settings. */
  update: (patch: Partial<Settings>) => void;
  /** Convenience: read/set the default column for a specific board. */
  getDefaultColumn: (boardId: string) => string | null;
  setDefaultColumn: (boardId: string, columnId: string | null) => void;
}

const SettingsContext = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser();
  const userId = user?.id ?? null;
  const [settings, setSettings] = useState<Settings>(() => readSettings(userId));

  // Reload the right namespace whenever the signed-in user changes.
  useEffect(() => {
    setSettings(readSettings(userId));
  }, [userId]);

  const persist = useCallback(
    (next: Settings) => {
      setSettings(next);
      try {
        localStorage.setItem(storageKey(userId), JSON.stringify(next));
      } catch {
        /* storage unavailable — keep the in-memory value */
      }
    },
    [userId],
  );

  const update = useCallback(
    (patch: Partial<Settings>) => persist({ ...settings, ...patch }),
    [persist, settings],
  );

  const getDefaultColumn = useCallback(
    (boardId: string) => settings.defaultColumnByBoard[boardId] ?? null,
    [settings.defaultColumnByBoard],
  );

  const setDefaultColumn = useCallback(
    (boardId: string, columnId: string | null) => {
      const next = { ...settings.defaultColumnByBoard };
      if (columnId) next[boardId] = columnId;
      else delete next[boardId];
      persist({ ...settings, defaultColumnByBoard: next });
    },
    [persist, settings],
  );

  const value = useMemo<SettingsCtx>(
    () => ({ settings, update, getDefaultColumn, setDefaultColumn }),
    [settings, update, getDefaultColumn, setDefaultColumn],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsCtx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
