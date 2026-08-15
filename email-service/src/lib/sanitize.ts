import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

const { window } = new JSDOM("");
const purify = DOMPurify(window);

// §16 : le HTML des e-mails entrants doit être assaini avant tout affichage (XSS), et les
// images distantes / pixels de tracking bloqués par défaut. On retire les <img src="http..">
// et on neutralise tout ce qui pourrait exécuter du JS (script, on*, iframe, object, etc.).
export function sanitizeEmailHtml(rawHtml: string): string {
  const clean = purify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      "a", "b", "strong", "i", "em", "u", "p", "br", "ul", "ol", "li", "blockquote",
      "table", "thead", "tbody", "tr", "td", "th", "span", "div", "h1", "h2", "h3", "h4",
      "hr", "pre", "code", "img",
    ],
    ALLOWED_ATTR: ["href", "title", "alt", "src", "style", "colspan", "rowspan"],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "svg"],
  });

  // Bloque les images distantes (tracking pixels / traqueurs de lecture) : on remplace
  // src par un attribut inerte que le frontend peut choisir d'afficher à la demande.
  return clean.replace(/<img\b([^>]*?)\ssrc="https?:\/\/[^"]*"([^>]*)>/gi, '<img$1 data-blocked-src="1"$2>');
}

export function stripHtmlToText(html: string): string {
  const clean = purify.sanitize(html, { ALLOWED_TAGS: [] });
  return clean.replace(/\s+/g, " ").trim();
}
