import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "accent" | "default" | "inverse" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

/** Brutalist stamp button — thick ink border, hard shadow, presses into it. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth, iconLeft, iconRight, children, className, ...rest },
  ref,
) {
  const cls = [styles.btn, styles[variant], styles[size], fullWidth && styles.full, className]
    .filter(Boolean)
    .join(" ");
  return (
    <button ref={ref} className={cls} {...rest}>
      {iconLeft && <span aria-hidden className={styles.icon}>{iconLeft}</span>}
      {children}
      {iconRight && <span aria-hidden className={styles.icon}>{iconRight}</span>}
    </button>
  );
});
