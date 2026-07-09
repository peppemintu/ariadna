// Thin fetch wrapper. Everything goes through here so error handling — the 409
// optimistic-lock conflict AND auth (Bearer token + session expiry) — lives in
// one place.

import { getToken, clearToken, notifySessionExpired } from "@/lib/auth";

const BASE = import.meta.env.VITE_API_BASE ?? ""; // "" => same-origin (Vite proxy)

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

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
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

    // A 401/403 on an authenticated request means the session is gone — but the
    // login/register calls carry no token and their 401 (bad password) must NOT
    // trigger a global logout.
    if ((res.status === 401 || res.status === 403) && token) {
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
