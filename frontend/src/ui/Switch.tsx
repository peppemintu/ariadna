import * as RSwitch from "@radix-ui/react-switch";
import { useId } from "react";
import styles from "./Switch.module.css";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}

/** Ariadna toggle — hard-edged track, ink thumb that stamps across. */
export function Switch({ checked, onChange, label, hint, disabled }: SwitchProps) {
  const id = useId();
  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <label htmlFor={id} className={styles.label}>{label}</label>
        {hint && <span className={styles.hint}>{hint}</span>}
      </div>
      <RSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className={styles.track}
      >
        <RSwitch.Thumb className={styles.thumb} />
      </RSwitch.Root>
    </div>
  );
}
