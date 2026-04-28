/* DroidGuard Quest — Map view
 * Renders a sinuous SVG path (Duolingo / Candy Crush style) with
 * absolutely-positioned circular nodes. Locked / current / done states.
 */
window.DG_MAP = (function () {
  // Relative coordinates (0..100) for 10 nodes — tuned for a nice winding feel
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

  /** Build a smooth path through the nodes, mapped to viewBox */
  function buildPathD(width, height) {
    if (NODES.length === 0) return "";
    const pts = NODES.map(p => ({ x: (p.x / 100) * width, y: (p.y / 100) * height }));

    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0.x + p1.x) / 2;
      const cy = (p0.y + p1.y) / 2;
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const len = Math.hypot(dx, dy);
      const nx = -dy / (len || 1);
      const ny = dx / (len || 1);
      const wave = (i % 2 === 0 ? 1 : -1) * Math.min(40, len * 0.18);
      const ctrlX = cx + nx * wave;
      const ctrlY = cy + ny * wave;
      d += ` Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return d;
  }

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

  function render(host) {
    const W = 700;
    const H = 1100;
    const pathD = buildPathD(W, H);

    host.innerHTML = `
      <section class="section">
        <h1 class="title">🗺️ Journey Map</h1>
        <p class="subtitle">From vulnerability to fortress — tap a level to begin.</p>

        <div class="path-stage" id="pathStage" style="aspect-ratio: ${W} / ${H};">
          <svg class="path-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="pathGrad" x1="0" y1="100%" x2="0" y2="0">
                <stop offset="0%"  stop-color="#00FF88" stop-opacity="0.0"/>
                <stop offset="50%" stop-color="#00FF88" stop-opacity="0.45"/>
                <stop offset="100%" stop-color="#00D4FF" stop-opacity="0.6"/>
              </linearGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <path d="${pathD}"
                  fill="none"
                  stroke="url(#pathGrad)"
                  stroke-width="14"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-dasharray="2 18"
                  filter="url(#glow)" />
          </svg>
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
