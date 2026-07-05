import * as RT from "@radix-ui/react-toast";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import styles from "./Toast.module.css";

export type ToastTone = "signal" | "success" | "flare" | "warning" | "ink";

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastCtx {
  toast: (opts: ToastOptions) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

let counter = 0;

/** Wrap the app once. Exposes useToast() anywhere below. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((opts: ToastOptions) => {
    setItems((prev) => [...prev, { ...opts, id: ++counter }]);
  }, []);

  const remove = (id: number) => setItems((prev) => prev.filter((t) => t.id !== id));

  return (
    <Ctx.Provider value={{ toast }}>
      <RT.Provider swipeDirection="right" duration={4000}>
        {children}
        {items.map((t) => (
          <RT.Root
            key={t.id}
            className={styles.toast}
            data-tone={t.tone ?? "signal"}
            duration={t.duration}
            onOpenChange={(open) => !open && remove(t.id)}
          >
            <div className={styles.stripe} aria-hidden />
            <div className={styles.textCol}>
              <RT.Title className={styles.title}>{t.title}</RT.Title>
              {t.description && <RT.Description className={styles.desc}>{t.description}</RT.Description>}
            </div>
            <RT.Close className={styles.close} aria-label="Dismiss">✕</RT.Close>
          </RT.Root>
        ))}
        <RT.Viewport className={styles.viewport} />
      </RT.Provider>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
