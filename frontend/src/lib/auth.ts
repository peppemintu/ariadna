// Low-level auth primitives: in-memory access-token store, JWT decoding, and a
// "session died" signal. Deliberately React-free and dependency-free so the
// fetch layer (http.ts) can read the token and report 401s without importing
// React or the user context.
//
// The access token lives only in this module variable, not localStorage: an
// XSS payload that can run JS can still read it, but only for the ~15 minutes
// it's valid, not for the life of a long-lived refresh token. It does NOT
// survive a page reload on purpose — session persistence across reloads goes
// through the httpOnly refresh cookie instead (see currentUser.tsx, which
// calls POST /api/auth/refresh on mount).

let accessToken: string | null = null;

export function getToken(): string | null {
  return accessToken;
}

export function setToken(token: string) {
  accessToken = token;
}

export function clearToken() {
  accessToken = null;
}

// --- session-expired signal: http.ts fires it when refreshing the session
//     fails, the user context listens and logs out. Keeps the fetch layer
//     free of React. ---
const listeners = new Set<() => void>();

export function onSessionExpired(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function notifySessionExpired() {
  listeners.forEach((cb) => cb());
}
