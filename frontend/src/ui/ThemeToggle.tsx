// Light/dark switch. Uses the shared theme context; sun in dark mode (tap to
// go light), moon in light mode (tap to go dark).

import { Button } from "./Button";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Light mode" : "Dark mode"}
    >
      {dark ? (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden>
          <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 17a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zM4.22 4.22a1 1 0 0 1 1.42 0l1.4 1.4A1 1 0 0 1 5.63 7.04l-1.4-1.4a1 1 0 0 1 0-1.42zm12.72 12.72a1 1 0 0 1 1.42 0l1.4 1.4a1 1 0 0 1-1.42 1.42l-1.4-1.4a1 1 0 0 1 0-1.42zM2 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1zm17 0a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1zM4.22 19.78a1 1 0 0 1 0-1.42l1.4-1.4a1 1 0 0 1 1.42 1.42l-1.4 1.4a1 1 0 0 1-1.42 0zM16.94 7.06a1 1 0 0 1 0-1.42l1.4-1.4a1 1 0 1 1 1.42 1.42l-1.4 1.4a1 1 0 0 1-1.42 0z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden>
          <path d="M21.64 13a1 1 0 0 0-1.05-.14 8 8 0 0 1-3.37.73 8.15 8.15 0 0 1-8.14-8.1 8 8 0 0 1 .68-3.28A1 1 0 0 0 8 .68 10.16 10.16 0 1 0 22 14.05a1 1 0 0 0-.36-1.05z" />
        </svg>
      )}
    </Button>
  );
}
