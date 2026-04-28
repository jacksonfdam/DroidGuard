/* DroidGuard Quest — CRT + Glitch FX
 *
 * Public surface:
 *   DG_FX.boot()                        - random preset on page load + boot bloom
 *   DG_FX.glitch(target, durationMs?)   - 600ms glitch shake on target (or body)
 *   DG_FX.noise(durationMs?)            - quick noise/static burst overlay
 *   DG_FX.preset(name)                  - force a specific preset (debug)
 *
 * Presets randomize the CRT custom properties so each load *feels*
 * a little different — sometimes the screen is crisp, sometimes the
 * scanlines are heavy, sometimes the vignette is brutal.
 *
 * The level-change wiring lives in app.js; this module exposes the
 * primitives.
 */
window.DG_FX = (function () {
  const PRESETS = {
    pristine:   { scan: 0.18, vignette: 0.30, flicker: 0.015, rgb: 0.3 },
    soft:       { scan: 0.30, vignette: 0.45, flicker: 0.025, rgb: 0.5 },
    standard:   { scan: 0.42, vignette: 0.55, flicker: 0.040, rgb: 0.7 },
    crunchy:    { scan: 0.55, vignette: 0.65, flicker: 0.060, rgb: 0.9 },
    badSignal:  { scan: 0.62, vignette: 0.75, flicker: 0.090, rgb: 1.2 },
    arcade:     { scan: 0.50, vignette: 0.40, flicker: 0.030, rgb: 1.0 },
    midnight:   { scan: 0.35, vignette: 0.85, flicker: 0.050, rgb: 0.6 }
  };
  const PRESET_NAMES = Object.keys(PRESETS);

  function pickPreset() {
    // Weight 'standard'/'soft' a bit higher so most loads feel polished.
    const pool = ["pristine", "soft", "standard", "standard", "soft",
                  "crunchy", "arcade", "badSignal", "midnight"];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function applyPreset(name) {
    const p = PRESETS[name] || PRESETS.standard;
    const root = document.documentElement;
    root.style.setProperty("--crt-scan-opacity", String(p.scan));
    root.style.setProperty("--crt-vignette-opacity", String(p.vignette));
    root.style.setProperty("--crt-flicker-strength", String(p.flicker));
    root.style.setProperty("--crt-rgb-shift", p.rgb + "px");
    root.dataset.fx = name;
  }

  function preset(name) { applyPreset(name); }

  function bootBloom() {
    const root = document.documentElement;
    root.classList.add("is-boot");
    setTimeout(() => root.classList.remove("is-boot"), 950);
  }

  function glitch(target, ms) {
    const node = target || document.body;
    if (!node || !node.classList) return;
    ms = ms || 600;
    // Restart the animation if already glitching
    node.classList.remove("is-glitch");
    // Force a reflow so the animation replays cleanly
    void node.offsetWidth;
    node.classList.add("is-glitch");
    setTimeout(() => node.classList.remove("is-glitch"), ms);
  }

  function noise(ms) {
    ms = ms || 350;
    const layer = document.createElement("div");
    layer.className = "is-noise";
    document.body.appendChild(layer);
    setTimeout(() => {
      if (layer.parentNode) layer.parentNode.removeChild(layer);
    }, ms + 30);
  }

  /* Ambient micro-glitches — every 14-32s, a quick noise burst.
   * Cheap, signals "something is alive" without being annoying. */
  function startAmbient() {
    function tick() {
      noise(220 + Math.random() * 180);
      if (Math.random() < 0.3) glitch(document.body, 280);
      const next = 14000 + Math.floor(Math.random() * 18000);
      setTimeout(tick, next);
    }
    setTimeout(tick, 8000 + Math.random() * 6000);
  }

  function boot() {
    applyPreset(pickPreset());
    bootBloom();
    // Ambient effects respect reduced-motion preference automatically
    // because the CSS animations are gated by the media query, but we
    // also skip scheduling the ambient ticker.
    const reduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) startAmbient();
  }

  return { boot, glitch, noise, preset, PRESET_NAMES };
})();

document.addEventListener("DOMContentLoaded", () => DG_FX.boot());
