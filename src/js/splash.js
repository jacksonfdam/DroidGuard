/* DroidGuard Quest — Splash + PWA install prompt
 *
 *   - shows a full-screen brand splash on every load (skip on click)
 *   - registers the service worker for installability
 *   - captures beforeinstallprompt and exposes DG_PWA.promptInstall()
 *   - shows an "Add to Home" hint on the splash on first visit, with
 *     iOS-specific copy when the OS doesn't support the install API
 */
window.DG_PWA = (function () {
  let deferredPrompt = null;
  const HAS_FIRST = "dgq:welcomed";

  function isStandalone() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
      || window.navigator.standalone === true;
  }
  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent || "")
        && !window.MSStream;
  }

  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }

  // capture install prompt as soon as it fires; the user clicks the splash
  // CTA later to actually trigger it.
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
  });

  function promptInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
      });
      return Promise.resolve(true);
    }
    // No native prompt — show iOS instructions or fall back to a hint.
    showIosHint();
    return Promise.resolve(false);
  }

  function showIosHint() {
    const m = document.createElement("div");
    m.className = "splash__ioshint";
    m.innerHTML =
      "<strong>Add to Home Screen</strong><br>" +
      "Tap <span style=\"font-size:18px\">⬆️</span> Share, then <em>" +
      (isIOS() ? "Add to Home Screen" : "Install / Add to Home") +
      "</em> to keep DroidGuard one tap away.";
    document.body.appendChild(m);
    setTimeout(function () { m.classList.add("is-shown"); }, 30);
    setTimeout(function () { m.classList.remove("is-shown"); }, 5500);
    setTimeout(function () { if (m.parentNode) m.parentNode.removeChild(m); }, 5900);
  }

  /* ── Splash ─────────────────────────────────────────────────────── */
  function buildSplash(firstTime) {
    const el = document.createElement("div");
    el.className = "splash";
    el.innerHTML =
      '<svg class="splash__logo" viewBox="0 0 64 64" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="splashGrad" x1="0" x2="1" y1="0" y2="1">' +
            '<stop offset="0" stop-color="#00FF88"/>' +
            '<stop offset="1" stop-color="#00D4FF"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<path d="M32 6 L54 14 V30 C54 44 44 56 32 60 C20 56 10 44 10 30 V14 Z" ' +
              'fill="none" stroke="url(#splashGrad)" stroke-width="3.2" stroke-linejoin="round"/>' +
        '<path d="M22 32 L29 39 L42 24" fill="none" stroke="url(#splashGrad)" ' +
              'stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<circle cx="20" cy="14" r="1.6" fill="url(#splashGrad)"/>' +
        '<circle cx="44" cy="14" r="1.6" fill="url(#splashGrad)"/>' +
      '</svg>' +
      '<h1 class="splash__title">DroidGuard <span>Quest</span></h1>' +
      '<p class="splash__sub">From vulnerability to fortress — your Android security journey, gamified.</p>' +
      (firstTime
        ? '<button class="splash__cta" id="dgInstallBtn">📲 Add to Home Screen</button>'
        : '') +
      '<p class="splash__hint">Tap anywhere to begin</p>';
    return el;
  }

  function start() {
    if (isStandalone()) {
      // Already running as installed PWA — skip splash + welcome.
      try { localStorage.setItem(HAS_FIRST, "1"); } catch (_) {}
      registerSW();
      return;
    }
    let firstTime = false;
    try { firstTime = !localStorage.getItem(HAS_FIRST); } catch (_) {}

    const splash = buildSplash(firstTime);
    document.body.appendChild(splash);
    requestAnimationFrame(function () { splash.classList.add("is-shown"); });

    let dismissed = false;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      splash.classList.remove("is-shown");
      splash.classList.add("is-leaving");
      setTimeout(function () {
        if (splash.parentNode) splash.parentNode.removeChild(splash);
      }, 480);
      try { localStorage.setItem(HAS_FIRST, "1"); } catch (_) {}
    }

    splash.addEventListener("click", function (ev) {
      if (ev.target && ev.target.id === "dgInstallBtn") {
        ev.stopPropagation();
        promptInstall();
        return;
      }
      dismiss();
    });
    setTimeout(dismiss, firstTime ? 4500 : 1700);

    registerSW();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  return { promptInstall, isStandalone, isIOS };
})();
