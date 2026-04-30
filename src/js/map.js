/* DroidGuard Quest — Map view
 *
 * Loads one of three hand-authored path SVGs (chip-hub, hud-tactical
 * or circuit) into the journey-map background and tints it with the
 * player's current-level color from a 10-stop palette. The SVGs draw
 * the rich PCB / HUD decoration; the HTML buttons are absolute-
 * positioned, transparent click targets that overlay each milestone.
 */
window.DG_MAP = (function () {
  // Relative coordinates (0..100) for 10 nodes — match every SVG's viewBox.
  // Level 1 sits at the top so the player starts in view (Duolingo-style)
  // and progresses downward. The path SVGs are flipped at render time via a
  // CSS scaleY(-1) on .path-art svg so the artwork follows the new order
  // without having to rewrite each SVG file.
  const NODES = [
    { x: 20, y: 4 },
    { x: 50, y: 12 },
    { x: 78, y: 20 },
    { x: 56, y: 30 },
    { x: 24, y: 38 },
    { x: 50, y: 47 },
    { x: 78, y: 56 },
    { x: 50, y: 67 },
    { x: 22, y: 76 },
    { x: 50, y: 88 }
  ];

  // The three favorite styles.
  const PATH_STYLES = ["chip-hub", "hud-tactical", "circuit"];

  // Per-level color palette — kept in sync with assets/paths/preview.html.
  const PALETTE = [
    "#E6ECFF", // 1  Foundation   silver
    "#FFD24A", // 2  Data Vault   amber
    "#B57BFF", // 3  Cipher Gate  violet
    "#00D4FF", // 4  Net Shield   cyan
    "#5DE2A3", // 5  Intent Maze  teal
    "#FF5577", // 6  Auth Fortress red
    "#B8C0E0", // 7  Code Armor   steel
    "#FFB347", // 8  Pentest      orange
    "#00FF88", // 9  Root Detector neon
    "#FFD24A"  // 10 Guardian     gold
  ];

  // Pick once per session for visual consistency between renderMap calls.
  const sessionStyle = PATH_STYLES[Math.floor(Math.random() * PATH_STYLES.length)];

  // One-shot flag set by app.js after a perfect 5/5 — consumed on next render.
  let celebrateLevelId = null;

  function markCelebrate(levelId) { celebrateLevelId = levelId; }

  function nodeStateFor(level) {
    const id = level.id;
    if (DG_STATE.isCompleted(id)) return "done";
    if (DG_STATE.isUnlocked(id))  return "current";
    return "locked";
  }

  function renderStars(count) {
    let s = "";
    for (let i = 0; i < 5; i++) {
      // Inner span carries the glyph so the outer .star can keep its arc
      // transform while the glyph runs its own drop-bounce animation.
      s += `<span class="star ${i < count ? "on" : ""}"><span class="star__inner">★</span></span>`;
    }
    return s;
  }

  function loadPathArt(slot, name) {
    if (!slot) return;
    fetch("assets/paths/" + name + ".svg", { credentials: "omit" })
      .then(r => (r.ok ? r.text() : ""))
      .then(svg => { if (svg) slot.innerHTML = svg; })
      .catch(() => { /* leave slot empty — buttons still work */ });
  }

  function render(host) {
    const W = 700, H = 1100;
    const player = DG_STATE.get().level;
    const accent = PALETTE[Math.max(0, Math.min(player - 1, PALETTE.length - 1))];

    // Consume the celebration flag — fires only on the render right after
    // a perfect 5/5 score and never again until the player nails another one.
    const celebrate = celebrateLevelId;
    celebrateLevelId = null;

    host.innerHTML = `
      <section class="section">
        <h1 class="title">🗺️ Journey Map</h1>
        <p class="subtitle">From vulnerability to fortress — tap a level to begin.</p>

        <div class="path-stage"
             style="aspect-ratio: ${W} / ${H}; color: ${accent};"
             data-style="${sessionStyle}">
          <div class="path-art" aria-hidden="true"></div>
          ${DG_DATA.LEVELS.map((lvl, i) => {
            const pos = NODES[i];
            const st = nodeStateFor(lvl);
            const rec = DG_STATE.getLevelRecord(lvl.id);
            const stars = rec ? rec.stars : 0;
            // Cleared milestones display the level emoji; locked / current show
            // the level number so the player can map position to level easily.
            const glyph = st === "done" ? lvl.icon : lvl.id;
            // Per-node accent (the level's own palette colour) so done stars
            // can adopt the level's tone instead of a single shared gold.
            const nodeAccent = PALETTE[Math.max(0, Math.min(lvl.id - 1, PALETTE.length - 1))];
            return `
              <button class="map-node is-${st}"
                      style="left:${pos.x}%; top:${pos.y}%; --node-accent: ${nodeAccent};"
                      data-level-id="${lvl.id}"
                      ${st === "locked" ? "aria-disabled=\"true\"" : ""}
                      title="${lvl.name}">
                <span class="map-node__stars" aria-hidden="true">${renderStars(stars)}</span>
                <span class="map-node__plate" aria-hidden="true"></span>
                <span class="map-node__num">${glyph}</span>
                <span class="map-node__lbl">${lvl.icon} ${lvl.name}</span>
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;

    loadPathArt(host.querySelector(".path-art"), sessionStyle);

    // Apply celebration class via classList API so the rename pipeline picks
    // it up consistently from the CSS and JS sides.
    if (celebrate) {
      const target = host.querySelector('[data-level-id="' + celebrate + '"]');
      if (target) target.classList.add("is-celebrating");
    }

    host.querySelectorAll(".map-node").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.levelId, 10);
        if (btn.classList.contains("is-locked")) {
          DG_APP.toast("🔒 Clear the previous level to unlock this one.", "error");
          return;
        }
        DG_APP.openLevel(id);
      });
    });
  }

  return { render, markCelebrate };
})();
