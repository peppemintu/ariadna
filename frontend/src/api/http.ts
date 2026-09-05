// Thin fetch wrapper. Everything goes through here so error handling — the 409
// optimistic-lock conflict AND auth (Bearer token + silent refresh + session
// expiry) — lives in one place.

import { getToken, setToken, clearToken, notifySessionExpired } from "@/lib/auth";
import type { AuthResponse } from "./types";

const BASE = import.meta.env.VITE_API_BASE ?? ""; // "" => same-origin (Vite proxy)

// These carry their own success/failure handling at the call site (LoginPage,
// currentUser's bootstrap/login/logout) — a 401/403 from one of them must
// never trigger a silent-refresh retry (refreshing a bad refresh token, or
// retrying a rejected login, makes no sense and risks a request loop).
const NO_RETRY_PATHS = ["/api/auth/login", "/api/auth/register", "/api/auth/refresh", "/api/auth/logout"];

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
  /** Optimistic-lock conflict — caller should refetch the item and retry. */
  get isConflict() {
    return this.status === 409;
  }
  get isNotFound() {
    return this.status === 404;
  }
  /** Missing/invalid/expired credentials. */
  get isAuth() {
    return this.status === 401 || this.status === 403;
  }
}

// Exchanges the httpOnly refresh cookie for a new access token. Deduped so
// several requests failing at once (e.g. a batch of parallel queries right
// after the access token expires) only trigger one /refresh call.
let refreshInFlight: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(BASE + "/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as AuthResponse;
        return data.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function request<T>(method: string, path: string, body?: unknown, isRetry = false): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // Needed so the browser sends/receives the httpOnly refresh-token cookie.
    credentials: "include",
  });

  if (!res.ok) {
    const isAuthFailure = res.status === 401 || res.status === 403;
    const isRetryableEndpoint = !NO_RETRY_PATHS.includes(path);

    if (isAuthFailure && isRetryableEndpoint && !isRetry) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        setToken(newToken);
        return request<T>(method, path, body, true);
      }
    }

    let parsed: unknown;
    const text = await res.text();
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      parsed = text;
    }
    const msg =
      (parsed && typeof parsed === "object" && "message" in parsed
        ? String((parsed as { message: unknown }).message)
        : undefined) ?? `${method} ${path} failed (${res.status})`;

    // Bad credentials on login/register, or a failed refresh/logout, are
    // handled by their own callers and must not trigger a global logout.
    if (isAuthFailure && isRetryableEndpoint) {
      clearToken();
      notifySessionExpired();
    }

    throw new ApiError(res.status, msg, parsed);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const http = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  del: (path: string) => request<void>("DELETE", path),
};
