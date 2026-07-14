// User settings, stored client-side (see lib/settings). Grouped into sections so
// new preferences slot in without redesigning the dialog.

import { Dialog, Switch } from "@/ui";
import { useSettings } from "@/lib/settings";
import styles from "./SettingsDialog.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: Props) {
  const { settings, update } = useSettings();

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Settings"
      width={480}
    >
      <div className={styles.groups}>
        <section className={styles.group}>
          <h3 className={styles.groupTitle}>Cards</h3>
          <Switch
            label="Truncate long card titles"
            hint="Clamp titles to two lines on the board. Turn off to always show the full title."
            checked={settings.truncateCardTitles}
            onChange={(v) => update({ truncateCardTitles: v })}
          />
        </section>

        <p className={styles.note}>
          Settings are saved on this device for now.
        </p>
      </div>
    </Dialog>
  );
}
