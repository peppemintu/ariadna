// No auth on the backend yet, so "who am I" is a client-side choice.
// The login page (a plain user picker) sets this; it persists for the session.

import { createContext, useContext, useState, type ReactNode } from "react";
import type { UserResponse } from "@/api/types";

const KEY = "ariadna.currentUserId";

interface Ctx {
  user: UserResponse | null;
  setUser: (u: UserResponse | null) => void;
}

const CurrentUserContext = createContext<Ctx | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserResponse | null>(null);

  const setUser = (u: UserResponse | null) => {
    setUserState(u);
    if (u) sessionStorage.setItem(KEY, u.id);
    else sessionStorage.removeItem(KEY);
  };

  return (
    <CurrentUserContext.Provider value={{ user, setUser }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): Ctx {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within CurrentUserProvider");
  return ctx;
}

/** Restore the previously-picked user id (if any) for auto-login on reload. */
export function storedUserId(): string | null {
  return sessionStorage.getItem(KEY);
}
