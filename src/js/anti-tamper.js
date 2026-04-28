/* DroidGuard Quest — Anti-tamper layer
 *
 * Goal: deter casual exploitation (DevTools editing, console-driven cheats,
 * userscript injection, screenshot capture) on a free-for-study app.
 * We are not pretending this is bulletproof — a determined attacker reading
 * the obfuscated bundle will eventually win. The aim is to raise cost above
 * the value of cheating.
 *
 * Layers:
 *   1. console blocking (no-op in production hosts)
 *   2. periodic debugger trap (slows step-through in DevTools)
 *   3. DevTools open heuristics (window-size delta, console.log getter trick)
 *   4. native-toString tamper detection (Frida / monkey-patches)
 *   5. userscript / extension marker scan
 *   6. DOM nuke when DevTools is detected (replace documentElement entirely)
 *   7. Screenshot deterrence: hide content on blur / visibilitychange,
 *      clear clipboard on PrintScreen
 *
 * Tampering signal:
 *   - sets window.__DG_TAMPER = true so the rest of the app refuses
 *     to record progress.
 */
(function () {
  if (window.__DG_AT_LOADED) return;
  window.__DG_AT_LOADED = true;

  const isLocalhost = (function () {
    const h = (location && location.hostname) || "";
    return /^(localhost|127\.|\[::1\]|0\.0\.0\.0)$/.test(h) || h === "";
  })();

  const PROD = !isLocalhost;
  let tamperReason = null;
  let domNuked = false;

  /* ── DOM nuke (irreversible until reload) ──────────────────────── */
  function nukeDom() {
    if (domNuked) return;
    domNuked = true;
    try {
      const html = document.documentElement;
      const replacement = document.createElement("html");
      const body = document.createElement("body");
      body.style.cssText = [
        "margin:0", "padding:48px 16px",
        "min-height:100vh", "background:#0A0E27",
        "color:#FF5577",
        "font:600 16px/1.5 ui-sans-serif,system-ui,-apple-system,sans-serif",
        "text-align:center"
      ].join(";");
      const h1 = document.createElement("div");
      h1.textContent = "🛡️ DroidGuard Quest";
      h1.style.cssText = "font-size:22px;color:#00FF88;margin-bottom:14px";
      const p = document.createElement("div");
      p.textContent = "Inspection detected. Reload in a clean browser profile (no DevTools, no extensions) to keep playing.";
      p.style.cssText = "max-width:520px;margin:0 auto";
      body.appendChild(h1);
      body.appendChild(p);
      replacement.appendChild(body);
      html.parentNode.replaceChild(replacement, html);
    } catch (_) { /* document gone */ }
    try {
      const blocker = function () { throw new Error("blocked"); };
      Object.defineProperty(window, "fetch", { value: blocker });
      Object.defineProperty(window, "XMLHttpRequest", { value: blocker });
    } catch (_) { /* sealed earlier */ }
  }

  function flag(reason) {
    if (tamperReason) return;
    tamperReason = reason;
    window.__DG_TAMPER = true;
    if (PROD) {
      if (/^devtools|toString_|userscript|ext_script|dom_marker/.test(reason)) {
        nukeDom();
        return;
      }
    }
    try {
      let banner = document.getElementById("__dg_tb");
      if (!banner && document.body) {
        banner = document.createElement("div");
        banner.id = "__dg_tb";
        banner.textContent = "⚠️ Tampering detected — progress is paused. Reload in a clean profile to keep playing.";
        banner.style.cssText = [
          "position:fixed", "top:0", "left:0", "right:0",
          "z-index:99999", "padding:12px 16px",
          "background:#FF5577", "color:#0A0E27", "font-weight:700",
          "text-align:center", "font-family:ui-sans-serif,system-ui,sans-serif",
          "box-shadow:0 4px 16px rgba(0,0,0,.35)"
        ].join(";");
        document.body.appendChild(banner);
      }
    } catch (_) { /* DOM not ready */ }
  }
  window.__DG_AT = { flag, get reason() { return tamperReason; }, get isProd() { return PROD; } };

  /* ── 1. Console blocking ─────────────────────────────────────────── */
  if (PROD && window.console) {
    const noop = function () { };
    const methods = ["log","info","warn","error","debug","trace","dir","table","group","groupCollapsed","groupEnd","time","timeEnd","timeLog","assert","count","clear","profile","profileEnd"];
    methods.forEach(m => {
      try { Object.defineProperty(console, m, { value: noop, writable: false, configurable: false }); }
      catch (_) { try { console[m] = noop; } catch (__) {} }
    });
  }

  /* ── 2. Debugger trap ────────────────────────────────────────────── */
  if (PROD) {
    setInterval(function trap() {
      (function () { debugger; }());
    }, 1500);
  }

  /* ── 3. DevTools open heuristics ─────────────────────────────────── */
  function checkDevtoolsBySize() {
    if (!PROD) return;
    const dx = Math.abs(window.outerWidth - window.innerWidth);
    const dy = Math.abs(window.outerHeight - window.innerHeight);
    if (dx > 220 || dy > 240) flag("devtools_size");
  }

  function checkDevtoolsByConsoleProbe() {
    if (!PROD) return;
    const probe = /./;
    let hit = false;
    Object.defineProperty(probe, "toString", {
      configurable: true,
      get: function () { hit = true; return function () { return ""; }; }
    });
    try { console.log("%c", probe); } catch (_) { /* console blocked */ }
    if (hit) flag("devtools_probe");
  }

  /* ── 4. Native-toString tamper (Frida / monkey-patch) ────────────── */
  function checkNativeToString() {
    if (!PROD) return;
    const samples = [Function.prototype.bind, Array.prototype.push, Object.defineProperty];
    for (const fn of samples) {
      try {
        const s = Function.prototype.toString.call(fn);
        if (!/\[native code\]/.test(s)) { flag("toString_tampered"); return; }
      } catch (_) { flag("toString_throws"); return; }
    }
  }

  /* ── 5. Userscript / extension marker scan ───────────────────────── */
  function checkUserscriptMarkers() {
    if (!PROD) return;
    const markers = ["GM", "GM_info", "GM_setValue", "GM_getValue", "unsafeWindow",
                     "_$_dgq_inject_$_", "__greasemonkey__", "__tampermonkey__"];
    for (const m of markers) {
      try { if (m in window) { flag("userscript:" + m); return; } } catch (_) {}
    }
    if (document.documentElement && document.documentElement.dataset) {
      const ds = document.documentElement.dataset;
      if (ds.tampermonkey || ds.greasemonkey) flag("dom_marker");
    }
    const scripts = document.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src || "";
      if (/^(chrome|moz|safari)-extension:\/\//.test(src)) { flag("ext_script"); return; }
    }
  }

  /* ── 6. Screenshot deterrence ─────────────────────────────────────
   * No browser surface lets us *prevent* screenshots, but we can make
   * them inconvenient: hide the canvas as soon as focus or visibility
   * changes (Cmd+Shift+3 / snipping tools usually flip focus first)
   * and intercept the PrintScreen key to clear the clipboard.
   */
  function applyScreenshotShield() {
    try {
      const s = document.createElement("style");
      s.textContent = [
        "html,body{",
          "-webkit-user-select:none;-ms-user-select:none;user-select:none;",
          "-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;",
        "}",
        "@media print{html,body{display:none!important;visibility:hidden!important}}"
      ].join("");
      document.head.appendChild(s);
    } catch (_) {}

    let veil = null;
    function showVeil() {
      if (veil) return;
      veil = document.createElement("div");
      veil.id = "__dg_veil";
      veil.textContent = "👁️ paused — tap to resume";
      veil.style.cssText = [
        "position:fixed", "inset:0", "z-index:2147483646",
        "display:flex", "align-items:center", "justify-content:center",
        "background:#0A0E27", "color:#9AA3CC",
        "font:600 14px/1.5 ui-sans-serif,system-ui,sans-serif",
        "letter-spacing:.04em"
      ].join(";");
      document.body && document.body.appendChild(veil);
    }
    function hideVeil() {
      if (veil && veil.parentNode) veil.parentNode.removeChild(veil);
      veil = null;
    }
    if (PROD) {
      window.addEventListener("blur", showVeil, true);
      window.addEventListener("focus", hideVeil, true);
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") showVeil();
        else hideVeil();
      });
    }
    document.addEventListener("keydown", function (e) {
      const k = (e.key || "").toLowerCase();
      const isShot = k === "printscreen" || (e.metaKey && e.shiftKey && (k === "3" || k === "4" || k === "5"));
      if (!isShot) return;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText("").catch(() => {});
        }
      } catch (_) {}
      try { showVeil(); setTimeout(hideVeil, 1200); } catch (_) {}
    }, true);
  }

  /* ── Wiring ──────────────────────────────────────────────────────── */
  function runAllChecks() {
    checkDevtoolsBySize();
    checkDevtoolsByConsoleProbe();
    checkNativeToString();
    checkUserscriptMarkers();
  }

  function start() {
    runAllChecks();
    setInterval(runAllChecks, 2500);
    applyScreenshotShield();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
  window.addEventListener("resize", checkDevtoolsBySize);
})();
