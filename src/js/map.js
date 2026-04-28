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
  const NODES = [
    { x: 20, y: 96 },
    { x: 50, y: 88 },
    { x: 78, y: 80 },
    { x: 56, y: 70 },
    { x: 24, y: 62 },
    { x: 50, y: 53 },
    { x: 78, y: 44 },
    { x: 50, y: 33 },
    { x: 22, y: 24 },
    { x: 50, y: 12 }
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

  function nodeStateFor(level) {
    const id = level.id;
    if (DG_STATE.isCompleted(id)) return "done";
    if (DG_STATE.isUnlocked(id))  return "current";
    return "locked";
  }

  function renderStars(count) {
    let s = "";
    for (let i = 0; i < 5; i++) {
      s += `<span class="star ${i < count ? "on" : ""}">★</span>`;
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
            return `
              <button class="map-node is-${st}"
                      style="left:${pos.x}%; top:${pos.y}%;"
                      data-level-id="${lvl.id}"
                      ${st === "locked" ? "aria-disabled=\"true\"" : ""}
                      title="${lvl.name}">
                <span class="map-node__stars" aria-hidden="true">${renderStars(stars)}</span>
                <span class="map-node__num">${st === "done" ? "" : lvl.id}</span>
                <span class="map-node__lbl">${lvl.icon} ${lvl.name}</span>
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;

    loadPathArt(host.querySelector(".path-art"), sessionStyle);

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

  return { render };
})();
