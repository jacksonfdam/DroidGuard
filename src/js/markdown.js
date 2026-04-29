/* DroidGuard Quest — Tiny markdown renderer
 *
 * Hand-rolled because we only need a small, well-known feature set:
 *   - Headings (#, ##, ###)
 *   - Bold (**…**), italic (_…_), inline code (`…`)
 *   - Fenced code blocks (```…```)
 *   - Unordered lists (- …)
 *   - Links [text](url)
 *   - Blockquotes (> …)
 *   - Paragraphs separated by blank lines
 *
 * It also splits a book.md into its chapters on H2 boundaries.
 *
 * No external dependency — keeps the bundle tiny and the CSP strict.
 */
window.DG_MD = (function () {
  function escape(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function inline(s) {
    return escape(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(?<![*\w])\*([^*]+)\*(?!\w)/g, "<em>$1</em>")
      .replace(/_([^_]+)_/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, txt, url) {
        // Only allow http(s)/mailto in production output.
        if (!/^(https?:|mailto:)/i.test(url)) return txt;
        return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + txt + "</a>";
      });
  }

  function render(md) {
    const lines = md.split(/\r?\n/);
    let html = "";
    let inList = false;
    let inQuote = false;
    let inCode = false;
    let codeBuf = [];

    function closeBlocks() {
      if (inList) { html += "</ul>"; inList = false; }
      if (inQuote) { html += "</blockquote>"; inQuote = false; }
    }

    for (let i = 0; i < lines.length; i++) {
      let l = lines[i];
      if (/^```/.test(l)) {
        if (inCode) {
          html += "<pre><code>" + escape(codeBuf.join("\n")) + "</code></pre>";
          codeBuf = []; inCode = false;
        } else {
          closeBlocks(); inCode = true;
        }
        continue;
      }
      if (inCode) { codeBuf.push(l); continue; }

      if (/^\s*-\s+/.test(l)) {
        if (inQuote) { html += "</blockquote>"; inQuote = false; }
        if (!inList) { html += "<ul>"; inList = true; }
        html += "<li>" + inline(l.replace(/^\s*-\s+/, "")) + "</li>";
        continue;
      }
      if (/^>\s+/.test(l)) {
        if (inList) { html += "</ul>"; inList = false; }
        if (!inQuote) { html += "<blockquote>"; inQuote = true; }
        html += "<p>" + inline(l.replace(/^>\s+/, "")) + "</p>";
        continue;
      }
      closeBlocks();

      if (/^### /.test(l)) { html += "<h3>" + inline(l.slice(4)) + "</h3>"; continue; }
      if (/^## /.test(l))  { html += "<h2>" + inline(l.slice(3)) + "</h2>"; continue; }
      if (/^# /.test(l))   { html += "<h1>" + inline(l.slice(2)) + "</h1>"; continue; }

      if (/^\s*$/.test(l)) continue;
      html += "<p>" + inline(l) + "</p>";
    }
    closeBlocks();
    if (inCode) html += "<pre><code>" + escape(codeBuf.join("\n")) + "</code></pre>";
    return html;
  }

  /** Split a book.md into chapters on H2 boundaries.
   *  Returns: [{ title, body }] — body is markdown for that chapter.
   */
  function chapters(md) {
    const parts = md.split(/^## /m);
    if (parts.length < 2) return [{ title: "Introduction", body: md.trim() }];
    return parts.slice(1).map(function (p) {
      const nl = p.indexOf("\n");
      const title = (nl >= 0 ? p.slice(0, nl) : p).trim();
      const body  = nl >= 0 ? p.slice(nl + 1).trim() : "";
      return { title: title, body: body };
    });
  }

  return { render, chapters, inline, escape };
})();
