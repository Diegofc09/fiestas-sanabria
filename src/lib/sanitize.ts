/**
 * Saneado de HTML sin dependencias del DOM: funciona igual en el navegador,
 * en SSR y en el runtime de servidor (donde jsdom/DOMPurify no está disponible).
 */

/** Etiquetas permitidas en el contenido enriquecido de los artículos. */
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "hr",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "code",
  "pre",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "figure",
  "figcaption",
  "span",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
]);

/** Etiquetas cuyo contenido completo se descarta. */
const DROP_CONTENT_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "noscript",
  "template",
  "svg",
  "math",
]);

const VOID_TAGS = new Set(["br", "hr", "img"]);

const ALLOWED_ATTR = new Set([
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "title",
  "width",
  "height",
  "class",
]);

const URL_ATTR = new Set(["href", "src"]);
const SAFE_URL = /^(?:https?:|mailto:|tel:|\/|#|data:image\/(?:png|jpe?g|gif|webp|avif);base64,)/i;

function escapeText(value: string): string {
  return value.replace(/&(?![a-zA-Z#0-9]+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return value
    .replace(/&(?![a-zA-Z#0-9]+;)/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

function sanitizeAttributes(raw: string): string {
  let out = "";
  ATTR_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ATTR_RE.exec(raw))) {
    const name = match[1].toLowerCase();
    const value = (match[2] ?? match[3] ?? match[4] ?? "").trim();
    if (!ALLOWED_ATTR.has(name)) continue;
    if (URL_ATTR.has(name)) {
      const decoded = value.replace(/[\u0000-\u0020]+/g, "");
      if (!SAFE_URL.test(decoded)) continue;
    }
    out += value ? ` ${name}="${escapeAttr(value)}"` : ` ${name}`;
  }
  return out;
}

/** Limpia HTML de artículos eliminando scripts, eventos y URLs peligrosas (anti stored XSS). */
export function sanitizeArticleHtml(html: string): string {
  if (!html) return "";

  let out = "";
  const openStack: string[] = [];
  let index = 0;
  let skipUntil: string | null = null;

  while (index < html.length) {
    const lt = html.indexOf("<", index);
    if (lt === -1) {
      if (!skipUntil) out += escapeText(html.slice(index));
      break;
    }
    if (lt > index && !skipUntil) out += escapeText(html.slice(index, lt));

    // Comentarios y declaraciones
    if (html.startsWith("<!--", lt)) {
      const end = html.indexOf("-->", lt + 4);
      index = end === -1 ? html.length : end + 3;
      continue;
    }
    if (html.startsWith("<!", lt) || html.startsWith("<?", lt)) {
      const end = html.indexOf(">", lt);
      index = end === -1 ? html.length : end + 1;
      continue;
    }

    const gt = html.indexOf(">", lt);
    if (gt === -1) {
      if (!skipUntil) out += escapeText(html.slice(lt));
      break;
    }

    const inner = html.slice(lt + 1, gt).trim();
    index = gt + 1;
    const isClosing = inner.startsWith("/");
    const body = isClosing ? inner.slice(1) : inner;
    const nameMatch = /^[a-zA-Z][a-zA-Z0-9-]*/.exec(body);
    if (!nameMatch) continue;
    const tag = nameMatch[0].toLowerCase();

    if (skipUntil) {
      if (isClosing && tag === skipUntil) skipUntil = null;
      continue;
    }

    if (DROP_CONTENT_TAGS.has(tag)) {
      if (!isClosing && !inner.endsWith("/")) skipUntil = tag;
      continue;
    }

    if (!ALLOWED_TAGS.has(tag)) continue;

    if (isClosing) {
      const pos = openStack.lastIndexOf(tag);
      if (pos === -1) continue;
      while (openStack.length > pos) out += `</${openStack.pop()}>`;
      continue;
    }

    const attrs = sanitizeAttributes(body.slice(tag.length));
    if (VOID_TAGS.has(tag)) {
      out += `<${tag}${attrs} />`;
      continue;
    }
    out += `<${tag}${attrs}>`;
    openStack.push(tag);
  }

  while (openStack.length) out += `</${openStack.pop()}>`;
  return out;
}
