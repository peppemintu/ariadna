// Route guard. If a user is already picked -> render. If not, but a previous
// pick is remembered (sessionStorage) -> restore it once users load. Otherwise
// bounce to /login. No real auth here — the backend has none yet.

import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useCurrentUser, storedUserId } from "@/lib/currentUser";
import { useUsers } from "@/hooks/queries";

export function RequireUser() {
  const { user, setUser } = useCurrentUser();
  const remembered = storedUserId();
  const needsRestore = !user && Boolean(remembered);

  // Only fetch users when we actually need to restore a session.
  const { data: users, isLoading, isError } = useUsers({ enabled: needsRestore });

  useEffect(() => {
    if (needsRestore && users) {
      const found = users.find((u) => u.id === remembered);
      if (found) setUser(found);
    }
  }, [needsRestore, users, remembered, setUser]);

  if (user) return <Outlet />;
  if (!remembered) return <Navigate to="/login" replace />;

  // Restoring a remembered session.
  if (isLoading) return <FullScreenNote>Restoring session…</FullScreenNote>;
  if (isError || (users && !users.some((u) => u.id === remembered))) {
    return <Navigate to="/login" replace />;
  }
  return <FullScreenNote>Restoring session…</FullScreenNote>;
}

function FullScreenNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", letterSpacing: "var(--tracking-label)", textTransform: "uppercase" }}>
      {children}
    </div>
  );
}
