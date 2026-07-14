// A lightweight Markdown editor: a textarea plus a formatting toolbar and a
// Write/Preview toggle. The value is a plain Markdown string, so it drops into
// the existing string-typed `description` field with no backend change.
//
// The toolbar operates on the current textarea selection (wrap for inline marks,
// line-prefix for lists/headings). Links get a small inline URL field so you
// never have to type Markdown syntax by hand. Preview renders via <RichText/>.

import {
  forwardRef,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import field from "./Field.module.css";
import { RichText } from "./RichText";
import styles from "./RichTextEditor.module.css";

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
  /** Which pane to show first — "write" to edit, "preview" to read. */
  defaultMode?: "write" | "preview";
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}

type Selection = { start: number; end: number };

export const RichTextEditor = forwardRef<HTMLTextAreaElement, RichTextEditorProps>(
  function RichTextEditor(
    { label, value, onChange, placeholder, rows = 5, autoFocus, defaultMode = "write", onKeyDown },
    ref,
  ) {
    const fieldId = useId();
    const areaRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => areaRef.current as HTMLTextAreaElement);

    const [mode, setMode] = useState<"write" | "preview">(defaultMode);
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const pendingSelection = useRef<Selection | null>(null);

    // Re-apply the caret/selection after a toolbar edit re-renders the textarea.
    useLayoutEffect(() => {
      const sel = pendingSelection.current;
      const el = areaRef.current;
      if (sel && el) {
        el.focus();
        el.setSelectionRange(sel.start, sel.end);
        pendingSelection.current = null;
      }
    }, [value]);

    const currentSelection = (): Selection => {
      const el = areaRef.current;
      return el ? { start: el.selectionStart, end: el.selectionEnd } : { start: 0, end: 0 };
    };

    const commit = (next: string, selection: Selection) => {
      pendingSelection.current = selection;
      onChange(next);
    };

    /** Wrap the current selection in `mark` on both sides (bold/italic/code). */
    const wrap = (mark: string, placeholder = "text") => {
      const { start, end } = currentSelection();
      const selected = value.slice(start, end) || placeholder;
      const next = value.slice(0, start) + mark + selected + mark + value.slice(end);
      const innerStart = start + mark.length;
      commit(next, { start: innerStart, end: innerStart + selected.length });
    };

    /** Prefix each selected line with `prefix` (headings, lists, quotes). */
    const prefixLines = (prefix: string) => {
      const { start, end } = currentSelection();
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const block = value.slice(lineStart, end);
      const prefixed = block
        .split("\n")
        .map((line) => (line.startsWith(prefix) ? line : prefix + line))
        .join("\n");
      const next = value.slice(0, lineStart) + prefixed + value.slice(end);
      const delta = prefixed.length - block.length;
      commit(next, { start: start + prefix.length, end: end + delta });
    };

    const insertLink = () => {
      const url = linkUrl.trim();
      if (!url) return;
      const { start, end } = currentSelection();
      const label = value.slice(start, end) || "link";
      const snippet = `[${label}](${url})`;
      const next = value.slice(0, start) + snippet + value.slice(end);
      const caret = start + snippet.length;
      commit(next, { start: caret, end: caret });
      setLinkUrl("");
      setLinkOpen(false);
    };

    const openLink = () => {
      setLinkOpen((o) => !o);
      setMode("write");
    };

    return (
      <div className={field.wrap}>
        {label && <label htmlFor={fieldId} className={field.label}>{label}</label>}

        <div className={styles.editor}>
          <div className={styles.toolbar} role="toolbar" aria-label="Formatting">
            <ToolButton label="Bold" onClick={() => wrap("**")} disabled={mode === "preview"}>
              <span style={{ fontWeight: 800 }}>B</span>
            </ToolButton>
            <ToolButton label="Italic" onClick={() => wrap("*")} disabled={mode === "preview"}>
              <span style={{ fontStyle: "italic" }}>I</span>
            </ToolButton>
            <ToolButton label="Inline code" onClick={() => wrap("`")} disabled={mode === "preview"}>
              <span style={{ fontFamily: "var(--font-mono)" }}>{"</>"}</span>
            </ToolButton>
            <span className={styles.divider} aria-hidden />
            <ToolButton label="Heading" onClick={() => prefixLines("## ")} disabled={mode === "preview"}>
              H
            </ToolButton>
            <ToolButton label="Bulleted list" onClick={() => prefixLines("- ")} disabled={mode === "preview"}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden>
                <rect x="3" y="5" width="3" height="3" /><rect x="9" y="5.5" width="12" height="2" />
                <rect x="3" y="10.5" width="3" height="3" /><rect x="9" y="11" width="12" height="2" />
                <rect x="3" y="16" width="3" height="3" /><rect x="9" y="16.5" width="12" height="2" />
              </svg>
            </ToolButton>
            <ToolButton label="Insert link" onClick={openLink} active={linkOpen} disabled={mode === "preview"}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" aria-hidden>
                <path d="M9 15l6-6" />
                <path d="M11 6.5l1.5-1.5a4 4 0 0 1 5.5 5.5L16.5 12" />
                <path d="M13 17.5L11.5 19a4 4 0 0 1-5.5-5.5L7.5 12" />
              </svg>
            </ToolButton>
            <div className={styles.spacer} />
            <button
              type="button"
              className={styles.modeToggle}
              onClick={() => setMode((m) => (m === "write" ? "preview" : "write"))}
              aria-pressed={mode === "preview"}
            >
              {mode === "write" ? "Preview" : "Edit"}
            </button>
          </div>

          {linkOpen && mode === "write" && (
            <div className={styles.linkBar}>
              <input
                className={styles.linkInput}
                placeholder="https://example.com"
                value={linkUrl}
                autoFocus
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    insertLink();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setLinkOpen(false);
                  }
                }}
              />
              <button type="button" className={styles.linkAdd} onClick={insertLink} disabled={!linkUrl.trim()}>
                Add
              </button>
            </div>
          )}

          {mode === "write" ? (
            <textarea
              ref={areaRef}
              id={fieldId}
              className={styles.area}
              value={value}
              placeholder={placeholder}
              rows={rows}
              autoFocus={autoFocus}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
            />
          ) : (
            <div className={styles.preview}>
              {value.trim() ? <RichText value={value} /> : <span className={styles.empty}>Nothing to preview</span>}
            </div>
          )}
        </div>

        <span className={field.hint}>
          Markdown supported — **bold**, *italic*, `code`, [links](url), lists. Click "Edit" to edit the description, click "Preview" to be able to click on links.
        </span>
      </div>
    );
  },
);

function ToolButton({
  label,
  onClick,
  children,
  active,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={styles.tool}
      onClick={onClick}
      aria-label={label}
      title={label}
      data-active={active ? "" : undefined}
      disabled={disabled}
      // Keep textarea selection intact — don't let the button steal focus first.
      onMouseDown={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}
