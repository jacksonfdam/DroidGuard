/* DroidGuard Quest — preview.html companion script.
 * Loaded via <script src="preview.js"> so the page works under the
 * server's strict CSP (script-src 'self', no inline scripts allowed).
 */
(function () {
  const PALETTE = [
    { id: 1,  name: "Foundation",  color: "#E6ECFF" },
    { id: 2,  name: "Data Vault",  color: "#FFD24A" },
    { id: 3,  name: "Cipher Gate", color: "#B57BFF" },
    { id: 4,  name: "Net Shield",  color: "#00D4FF" },
    { id: 5,  name: "Intent Maze", color: "#5DE2A3" },
    { id: 6,  name: "Auth Fort.",  color: "#FF5577" },
    { id: 7,  name: "Code Armor",  color: "#B8C0E0" },
    { id: 8,  name: "Pentest",     color: "#FFB347" },
    { id: 9,  name: "Root Det.",   color: "#00FF88" },
    { id: 10, name: "Guardian",    color: "#FFD24A" }
  ];

  function applyAccent(color) {
    document.documentElement.style.setProperty("--accent", color);
    document.querySelectorAll(".card").forEach(c => { c.style.color = color; });
  }

  function buildSwatches() {
    const palBox = document.getElementById("palette");
    if (!palBox) return;
    PALETTE.forEach((p, i) => {
      const b = document.createElement("button");
      b.className = "swatch" + (i === 8 ? " active" : "");
      b.style.background = p.color;
      b.title = p.id + " · " + p.name;
      b.textContent = p.id;
      b.addEventListener("click", () => {
        document.querySelectorAll(".swatch").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        applyAccent(p.color);
      });
      palBox.appendChild(b);
    });
    applyAccent(PALETTE[8].color);  // Root Det. neon as default
  }

  function loadSvgs() {
    document.querySelectorAll("[data-svg]").forEach(async slot => {
      const url = slot.getAttribute("data-svg");
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error("HTTP " + r.status);
        slot.innerHTML = await r.text();
      } catch (e) {
        slot.innerHTML =
          "<p style='padding:14px;color:#FF5577;font-size:13px'>" +
          "Failed to load " + url + ".<br>" +
          "Open this preview through the dev server (<code>npm start</code>) " +
          "rather than via file://, so fetch can reach the SVG." +
          "</p>";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildSwatches();
    loadSvgs();
  });
})();
