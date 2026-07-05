import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import field from "./Field.module.css";
import styles from "./Input.module.css";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  iconLeft?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, size = "md", iconLeft, id, disabled, className, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const boxCls = [styles.box, styles[size], error && styles.invalid, disabled && styles.disabled]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={field.wrap}>
      {label && <label htmlFor={fieldId} className={field.label}>{label}</label>}
      <div className={boxCls}>
        {iconLeft && <span aria-hidden className={styles.icon}>{iconLeft}</span>}
        <input
          ref={ref}
          id={fieldId}
          disabled={disabled}
          className={[styles.input, className].filter(Boolean).join(" ")}
          {...rest}
        />
      </div>
      {error ? <span className={field.error}>{error}</span> : hint ? <span className={field.hint}>{hint}</span> : null}
    </div>
  );
});
