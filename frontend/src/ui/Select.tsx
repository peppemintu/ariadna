import * as RS from "@radix-ui/react-select";
import { useId, type ReactNode } from "react";
import field from "./Field.module.css";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: ReactNode;
}

interface SelectProps {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  id?: string;
}

/** Radix Select styled to Ariadna. State (open/highlighted) via data-attrs. */
export function Select({
  label, hint, error, placeholder = "Select…", value, onChange, options, disabled, id,
}: SelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={field.wrap}>
      {label && <label htmlFor={fieldId} className={field.label}>{label}</label>}
      <RS.Root value={value} onValueChange={onChange} disabled={disabled}>
        <RS.Trigger id={fieldId} className={styles.trigger} data-invalid={error ? "" : undefined} aria-label={label}>
          <RS.Value placeholder={placeholder} />
          <RS.Icon className={styles.chevron}>▾</RS.Icon>
        </RS.Trigger>
        <RS.Portal>
          <RS.Content className={styles.content} position="popper" sideOffset={6}>
            <RS.Viewport className={styles.viewport}>
              {options.map((o) => (
                <RS.Item key={o.value} value={o.value} className={styles.item}>
                  <RS.ItemText>{o.label}</RS.ItemText>
                  <RS.ItemIndicator className={styles.check}>✓</RS.ItemIndicator>
                </RS.Item>
              ))}
            </RS.Viewport>
          </RS.Content>
        </RS.Portal>
      </RS.Root>
      {error ? <span className={field.error}>{error}</span> : hint ? <span className={field.hint}>{hint}</span> : null}
    </div>
  );
}
