import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import field from "./Field.module.css";
import styles from "./Textarea.module.css";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, id, disabled, className, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const cls = [styles.area, error && styles.invalid, disabled && styles.disabled, className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={field.wrap}>
      {label && <label htmlFor={fieldId} className={field.label}>{label}</label>}
      <textarea ref={ref} id={fieldId} disabled={disabled} className={cls} {...rest} />
      {error ? <span className={field.error}>{error}</span> : hint ? <span className={field.hint}>{hint}</span> : null}
    </div>
  );
});
