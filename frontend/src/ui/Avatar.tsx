import styles from "./Avatar.module.css";

const AVATAR_COLORS = [
  "var(--signal-500)",
  "var(--flare-500)",
  "var(--go-500)",
  "var(--hold-500)",
  "var(--ink-700)",
];

function pickColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

interface AvatarProps {
  name: string;
  src?: string;
  size?: number;
  /** Override the seeded color. */
  color?: string;
  title?: string;
}

/** Square brutalist user mark — initials on a seeded color, or an image. */
export function Avatar({ name, src, size = 36, color, title }: AvatarProps) {
  const bg = color ?? pickColor(name);
  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size, background: src ? "var(--paper-100)" : bg, fontSize: Math.round(size * 0.36) }}
      title={title ?? name}
    >
      {src ? <img className={styles.img} src={src} alt={name} /> : initials(name)}
    </span>
  );
}
