// Authenticated current-user context (JWT).
//
// login/register store the access token and then resolve "who am I" via the
// backend's GET /api/user/me (identified from the JWT). Previously we fetched the
// whole user list and matched on email; that endpoint is now ADMIN-only, so /me
// is both correct and a single request.
//
// A 401/403 on any authenticated request fires onSessionExpired, which logs out;
// the route guard then bounces to /login.

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { authApi, usersApi } from "@/api/endpoints";
import { getToken, setToken, clearToken, isTokenValid, onSessionExpired } from "@/lib/auth";
import type { LoginRequest, UserCreateRequest, UserResponse } from "@/api/types";

type Status = "loading" | "authed" | "anon";

interface Ctx {
  user: UserResponse | null;
  status: Status;
  login: (creds: LoginRequest) => Promise<void>;
  register: (data: UserCreateRequest) => Promise<void>;
  logout: () => void;
  /** Update the cached user object in place (e.g. after a self-rename). */
  setUser: (u: UserResponse) => void;
}

const CurrentUserContext = createContext<Ctx | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserResponse | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const restoredRef = useRef(false);

  const logout = () => {
    clearToken();
    setUserState(null);
    setStatus("anon");
  };

  // Restore a session from a stored, unexpired token on first mount.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const token = getToken();
    if (!isTokenValid(token)) {
      logout();
      return;
    }
    usersApi
      .me()
      .then((u) => {
        setUserState(u);
        setStatus("authed");
      })
      .catch(() => logout()); // 401/404 (token invalid or user gone) -> sign out
  }, []);

  // Global session-expiry (fired by http.ts on 401/403).
  useEffect(() => {
    return onSessionExpired(() => {
      setUserState(null);
      setStatus("anon");
    });
  }, []);

  const login = async (creds: LoginRequest) => {
    const { accessToken } = await authApi.login(creds);
    setToken(accessToken);
    try {
      const u = await usersApi.me();
      setUserState(u);
      setStatus("authed");
    } catch {
      clearToken();
      throw new Error("Signed in, but couldn't load your profile.");
    }
  };

  const register = async (data: UserCreateRequest) => {
    await authApi.register(data); // creates the user (no token returned)
    await login({ email: data.email, password: data.password }); // then sign in
  };

  const setUser = (u: UserResponse) => setUserState(u);

  return (
    <CurrentUserContext.Provider value={{ user, status, login, register, logout, setUser }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): Ctx {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within CurrentUserProvider");
  return ctx;
}
