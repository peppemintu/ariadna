// Route guard. While a stored token is being validated -> "restoring". Once
// authenticated -> render. Otherwise -> /login.

import { Navigate, Outlet } from "react-router-dom";
import { useCurrentUser } from "@/lib/currentUser";

export function RequireUser() {
  const { status } = useCurrentUser();

  if (status === "loading") return <FullScreenNote>Restoring session…</FullScreenNote>;
  if (status === "anon") return <Navigate to="/login" replace />;
  return <Outlet />;
}

function FullScreenNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        color: "var(--text-muted)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-sm)",
        letterSpacing: "var(--tracking-label)",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}
