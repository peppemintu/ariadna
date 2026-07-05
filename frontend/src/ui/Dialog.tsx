import * as RD from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import styles from "./Dialog.module.css";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Max content width; defaults to a comfortable form width. */
  width?: number | string;
}

/** Ariadna modal — hard-edged panel, ink overlay, mono title bar. */
export function Dialog({ open, onOpenChange, title, description, children, footer, width = 520 }: DialogProps) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className={styles.overlay} />
        <RD.Content className={styles.content} style={{ maxWidth: width }}>
          <div className={styles.header}>
            <RD.Title className={styles.title}>{title}</RD.Title>
            <RD.Close className={styles.close} aria-label="Close">✕</RD.Close>
          </div>
          {description && <RD.Description className={styles.desc}>{description}</RD.Description>}
          {children && <div className={styles.body}>{children}</div>}
          {footer && <div className={styles.footer}>{footer}</div>}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

export const DialogClose = RD.Close;
