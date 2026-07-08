// Small yes/no confirmation, rendered as a plain portal overlay — deliberately
// NOT a Radix Dialog. It routinely appears ON TOP of an open Radix Dialog
// (e.g. discard-confirm over the card form), and two stacked Radix modals fight
// over focus-lock and pointer-events (causing flicker / stuck dialogs). A self-
// contained overlay sidesteps that entirely.
//
// Escape is captured at the document level so it dismisses THIS layer without
// waking the dialog underneath. Heavier backdrop than Dialog so it reads as the
// topmost surface.

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import styles from "./ConfirmDialog.module.css";

interface ConfirmDialogProps {
  open: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        e.preventDefault();
        e.stopPropagation(); // don't let a Radix dialog beneath us also react
        onCancel();
      }
    };
    document.addEventListener("keydown", onKey, true); // capture phase = first
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div className={styles.panel} role="alertdialog" aria-modal="true">
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.desc}>{description}</p>}
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "accent" : "primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
