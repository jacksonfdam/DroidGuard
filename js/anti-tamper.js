/* DroidGuard Quest — Anti-tamper layer
 *
 * Goal: deter casual exploitation (DevTools editing, console-driven cheats,
 * userscript injection) in a free-for-study app. We are not pretending this
 * is bulletproof — a determined attacker reading the obfuscated bundle will
 * eventually win. The aim is to raise cost above the value of cheating.
 *
 * Layers:
 *   1. console blocking (no-op in production hosts)
 *   2. periodic debugger trap (slows step-through in DevTools)
 *   3. DevTools open heuristics (window size delta, console.log getter trick)
 *   4. native-toString tamper detection (Frida / monkey-patches)
 *   5. userscript / extension marker scan (Tampermonkey, Greasemonkey, etc.)
 *
 * Tampering signal:
 *   - sets window.__DG_TAMPER = true so the rest of the app can refuse to
 *     record progress / show a red banner.
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

  function flag(reason) {
    if (tamperReason) return;
    tamperReason = reason;
    window.__DG_TAMPER = true;
    try {
      const banner = document.getElementById("dgTamperBanner");
      if (!banner && document.body) {
        const b = document.createElement("div");
        b.id = "dgTamperBanner";
        b.textContent = "⚠️ Tampering detected — progress is paused. Reload in a clean profile to keep playing.";
        b.style.cssText = [
          "position:fixed", "top:0", "left:0", "right:0",
          "z-index:99999", "padding:12px 16px",
          "background:#FF5577", "color:#0A0E27", "font-weight:700",
          "text-align:center", "font-family:ui-sans-serif,system-ui,sans-serif",
          "box-shadow:0 4px 16px rgba(0,0,0,.35)"
        ].join(";");
        document.body.appendChild(b);
      }
    } catch (_) { /* DOM not ready */ }
    // Optional structured log to a beacon endpoint could go here.
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
      // The presence of an open debugger pauses execution at this statement.
      // The empty function call ensures minifiers don't drop the body.
      (function () { debugger; }());
    }, 1500);
  }

  /* ── 3. DevTools open heuristics ─────────────────────────────────── */
  function checkDevtoolsBySize() {
    if (!PROD) return;
    const dx = Math.abs(window.outerWidth - window.innerWidth);
    const dy = Math.abs(window.outerHeight - window.innerHeight);
    // Generous threshold to avoid false positives on extension toolbars
    if (dx > 220 || dy > 240) flag("devtools_size");
  }

  function checkDevtoolsByConsoleProbe() {
    if (!PROD) return;
    // The browser only stringifies an object passed to console.log when the
    // DevTools console panel is open. We exploit that side-effect.
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
    // Common globals injected by userscript managers
    const markers = ["GM", "GM_info", "GM_setValue", "GM_getValue", "unsafeWindow",
                     "_$_dgq_inject_$_", "__greasemonkey__", "__tampermonkey__"];
    for (const m of markers) {
      try { if (m in window) { flag("userscript:" + m); return; } } catch (_) {}
    }
    // DOM markers some extensions leave behind
    if (document.documentElement && document.documentElement.dataset) {
      const ds = document.documentElement.dataset;
      if (ds.tampermonkey || ds.greasemonkey) flag("dom_marker");
    }
    // Suspicious script tags injected into the head/body
    const scripts = document.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src || "";
      if (/^(chrome|moz|safari)-extension:\/\//.test(src)) { flag("ext_script"); return; }
    }
  }

  /* ── Wiring ──────────────────────────────────────────────────────── */
  function runAllChecks() {
    checkDevtoolsBySize();
    checkDevtoolsByConsoleProbe();
    checkNativeToString();
    checkUserscriptMarkers();
  }

  // Initial pass once the DOM exists, then poll quietly
  function start() {
    runAllChecks();
    setInterval(runAllChecks, 2500);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
  window.addEventListener("resize", checkDevtoolsBySize);
})();
