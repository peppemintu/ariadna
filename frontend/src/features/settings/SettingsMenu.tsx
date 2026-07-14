// Far-right settings entry: a gear that opens a dropdown holding app-level
// controls — Settings, theme, and Log out — so they share one tidy home instead
// of crowding the header. Opens the SettingsDialog for the detailed preferences.

import { useState } from "react";
import { Button, Menu, type MenuItem } from "@/ui";
import { useTheme } from "@/lib/theme";
import { SettingsDialog } from "./SettingsDialog";

interface Props {
  /** When provided, adds a "Log out" item at the bottom. */
  onLogout?: () => void;
}

export function SettingsMenu({ onLogout }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { theme, toggle } = useTheme();

  const items: MenuItem[] = [
    { label: "Settings", onSelect: () => setDialogOpen(true) },
    { label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme", onSelect: toggle },
  ];
  if (onLogout) items.push({ label: "Log out", onSelect: onLogout, danger: true });

  return (
    <>
      <Menu
        align="end"
        trigger={
          <Button variant="ghost" size="sm" aria-label="Settings" title="Settings">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
              <path d="M19.14 12.94a7.5 7.5 0 0 0 .05-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.24-1.12.55-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.36 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.5 7.5 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.64.22l2.39-.96c.5.39 1.04.7 1.62.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.58-.24 1.12-.55 1.62-.94l2.39.96c.24.1.51 0 .64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.06-1.58zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />
            </svg>
          </Button>
        }
        items={items}
      />
      <SettingsDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
