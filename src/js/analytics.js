/* DroidGuard Quest — Vercel Web Analytics
 *
 * Inline replication of @vercel/analytics' inject() — the project ships
 * with no bundler, so we can't `import { inject } from '@vercel/analytics'`
 * at runtime. The package's only job is to (a) set up a queue stub on
 * window.va so calls made before the tracker script lands still flush,
 * and (b) drop a deferred <script src="/_vercel/insights/script.js"> into
 * <head>. That endpoint is auto-served by Vercel when Web Analytics is
 * enabled in the dashboard, no extra hosting required. CSP `script-src
 * 'self'` allows it because the URL is same-origin.
 *
 * No tracking on localhost — dev traffic shouldn't pollute the dashboard.
 */
(function () {
  const h = (location && location.hostname) || "";
  if (/^(localhost|127\.|\[::1\]|0\.0\.0\.0)$/.test(h) || h === "") return;

  // Queue stub. window.va('event', { … }) calls made before the real
  // tracker loads land in window.vaq and replay once the script attaches.
  if (!window.va) {
    window.va = function () { (window.vaq = window.vaq || []).push(arguments); };
  }

  const s = document.createElement("script");
  s.defer = true;
  s.src = "/_vercel/insights/script.js";
  document.head.appendChild(s);
})();
