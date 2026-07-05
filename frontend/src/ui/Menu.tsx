import * as RM from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";
import styles from "./Menu.module.css";

export interface MenuItem {
  label: ReactNode;
  onSelect: () => void;
  danger?: boolean;
}

interface MenuProps {
  trigger: ReactNode; // rendered asChild — pass a Button
  items: MenuItem[];
  align?: "start" | "end";
}

/** Ariadna dropdown menu. Item actions run a tick after close so dialogs
 *  opened from an item don't fight the closing menu for focus. */
export function Menu({ trigger, items, align = "end" }: MenuProps) {
  return (
    <RM.Root>
      <RM.Trigger asChild>{trigger}</RM.Trigger>
      <RM.Portal>
        <RM.Content className={styles.content} align={align} sideOffset={6}>
          {items.map((item, i) => (
            <RM.Item
              key={i}
              className={styles.item}
              data-danger={item.danger ? "" : undefined}
              onSelect={() => setTimeout(item.onSelect, 0)}
            >
              {item.label}
            </RM.Item>
          ))}
        </RM.Content>
      </RM.Portal>
    </RM.Root>
  );
}
