// Low-level auth primitives: JWT storage, decoding, and a "session died" signal.
// Deliberately React-free and dependency-free so the fetch layer (http.ts) can
// read the token and report 401s without importing React or the user context.

const TOKEN_KEY = "ariadna:token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

interface JwtPayload {
  sub?: string; // email (backend puts email in subject)
  exp?: number; // seconds since epoch
  iat?: number;
}

/** Decode a JWT payload without verifying the signature (client-side only). */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split(".")[1];
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** The email a token is issued for, or null if it can't be read. */
export function emailFromToken(token: string): string | null {
  return decodeJwt(token)?.sub ?? null;
}

/** True if the token exists and hasn't expired (with a small clock-skew margin). */
export function isTokenValid(token: string | null): token is string {
  if (!token) return false;
  const exp = decodeJwt(token)?.exp;
  if (!exp) return false;
  return exp * 1000 > Date.now() + 5000;
}

// --- session-expired signal: http.ts fires it on a 401/403, the user context
//     listens and logs out. Keeps the fetch layer free of React. ---
const listeners = new Set<() => void>();

export function onSessionExpired(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function notifySessionExpired() {
  listeners.forEach((cb) => cb());
}
