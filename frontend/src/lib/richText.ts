// A small, safe Markdown renderer for card descriptions.
//
// Card `description` is stored as a plain string (backend-compatible). We treat
// that string as a constrained Markdown dialect and render it to HTML for
// display. Old plain-text descriptions still render fine — they're just Markdown
// with no formatting.
//
// SECURITY: we escape ALL HTML first, then apply a fixed set of transforms on
// the escaped text. No user input ever reaches the DOM as markup, so there's no
// XSS surface — even link URLs are scheme-checked. This is deliberately a
// *subset* of Markdown; it's easy to extend one rule at a time.
//
// Supported: # / ## / ### headings, **bold** / *italic*, `code`, [text](url),
// bare-URL autolink, - / * bullet lists, 1. ordered lists, > blockquote,
// paragraphs and line breaks.

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}

/** Only http(s) and mailto links are allowed; everything else is dropped. */
function safeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) return trimmed;
  // Bare domains like "example.com" become https:// links.
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(trimmed)) return `https://${trimmed}`;
  return null;
}

function anchor(href: string, text: string): string {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow">${text}</a>`;
}

/** Inline transforms applied to already-escaped text within a single line. */
function renderInline(escaped: string): string {
  let out = escaped;

  // Inline code first so its contents aren't touched by other rules.
  const codeSlots: string[] = [];
  out = out.replace(/`([^`]+)`/g, (_m, code) => {
    codeSlots.push(`<code>${code}</code>`);
    return `\u0000${codeSlots.length - 1}\u0000`;
  });

  // [text](url) — validate the URL scheme.
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, rawUrl) => {
    const href = safeUrl(rawUrl);
    return href ? anchor(href, label) : m;
  });

  // Bare URL autolink (skip ones already inside an <a> we just made).
  out = out.replace(/(^|[\s(])((?:https?:\/\/)[^\s<]+)/g, (_m, pre, url) => {
    const href = safeUrl(url);
    return href ? `${pre}${anchor(href, url)}` : `${pre}${url}`;
  });

  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, "$1<em>$2</em>");
  out = out.replace(/(^|[^_])_([^_\s][^_]*?)_/g, "$1<em>$2</em>");

  // Restore code slots.
  out = out.replace(/\u0000(\d+)\u0000/g, (_m, i) => codeSlots[Number(i)]);
  return out;
}

/** Render the constrained Markdown to a safe HTML string. */
export function renderMarkdown(source: string | null | undefined): string {
  if (!source) return "";
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${paragraph.join("<br />")}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const escaped = escapeHtml(line.trim());

    if (line.trim() === "") {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line.trim());
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(escapeHtml(heading[2]))}</h${level}>`);
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line.trim());
    if (bullet) {
      flushParagraph();
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${renderInline(escapeHtml(bullet[1]))}</li>`);
      continue;
    }

    const ordered = /^\d+\.\s+(.*)$/.exec(line.trim());
    if (ordered) {
      flushParagraph();
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${renderInline(escapeHtml(ordered[1]))}</li>`);
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line.trim());
    if (quote) {
      flushParagraph();
      closeList();
      html.push(`<blockquote>${renderInline(escapeHtml(quote[1]))}</blockquote>`);
      continue;
    }

    closeList();
    paragraph.push(renderInline(escaped));
  }

  flushParagraph();
  closeList();
  return html.join("");
}

/**
 * Flatten Markdown to plain text for compact previews (kanban card body).
 * Strips syntax but keeps link labels and content readable.
 */
export function stripMarkdown(source: string | null | undefined): string {
  if (!source) return "";
  return source
    .replace(/\r\n?/g, "\n")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "• ")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\n{2,}/g, "  ")
    .replace(/\n/g, " ")
    .trim();
}

/** True when the description contains any Markdown formatting worth rendering. */
export function hasMarkdown(source: string | null | undefined): boolean {
  if (!source) return false;
  return /\[[^\]]+\]\([^)]+\)|https?:\/\/|[*_`#>]|^\s*[-\d]/m.test(source);
}
