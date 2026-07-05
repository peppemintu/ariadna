import * as RT from "@radix-ui/react-tabs";
import type { ReactNode } from "react";
import styles from "./Tabs.module.css";

export interface TabItem {
  value: string;
  label: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** Segmented tabs — active tab is an ink pill (paper text). List-only;
 *  render panels yourself keyed off `value` for full layout control. */
export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <RT.Root value={value} onValueChange={onChange}>
      <RT.List className={[styles.list, className].filter(Boolean).join(" ")}>
        {tabs.map((t) => (
          <RT.Trigger key={t.value} value={t.value} className={styles.trigger}>
            {t.label}
          </RT.Trigger>
        ))}
      </RT.List>
    </RT.Root>
  );
}
