/* DroidGuard Quest — Achievements
 *
 * Each achievement has an id, a title, a short flavour line, an emoji and
 * a `criterion(state)` function that returns true once the player has
 * earned it. On state changes (level cleared, chapter read, etc.), the
 * app calls DG_ACHIEVEMENTS.check() and the unlock list is diffed against
 * what was already saved in state.achievements. Newly unlocked entries
 * trigger an animated notification toast in the bottom-right corner.
 */
window.DG_ACHIEVEMENTS = (function () {
  const CATALOG = [
    {
      id: "first-clear",
      icon: "🎯", title: "First Steps",
      desc: "Cleared your first level — welcome to the journey.",
      criterion: (s) => Object.keys(s.completedLevels || {}).length >= 1
    },
    {
      id: "perfect-run",
      icon: "⭐", title: "Perfect Run",
      desc: "5/5 on a single level. Style points awarded.",
      criterion: (s) => Object.values(s.completedLevels || {}).some(r => r && r.stars === 5)
    },
    {
      id: "fire-streak",
      icon: "🔥", title: "On Fire",
      desc: "Three perfect 5/5 runs in a row.",
      criterion: (s) => (s.streakPerfect || 0) >= 3
    },
    {
      id: "halfway",
      icon: "🚀", title: "Halfway There",
      desc: "Five levels cleared. Senior tier in sight.",
      criterion: (s) => Object.keys(s.completedLevels || {}).length >= 5
    },
    {
      id: "guardian",
      icon: "👑", title: "Guardian Master",
      desc: "Reached LV 10. The journey is complete.",
      criterion: (s) => (s.level || 0) >= 10
    },
    {
      id: "all-stars",
      icon: "🌟", title: "Five Star General",
      desc: "5/5 on every single level. Hall of fame.",
      criterion: (s) => {
        const r = Object.values(s.completedLevels || {});
        return r.length >= 10 && r.every(x => x && x.stars === 5);
      }
    },
    {
      id: "first-book",
      icon: "📖", title: "First Read",
      desc: "Finished your first Codex book.",
      criterion: (s) => Object.keys((s.codex && s.codex.booksCompleted) || {}).length >= 1
    },
    {
      id: "scholar",
      icon: "📚", title: "Scholar",
      desc: "Read 30 chapters in the Codex.",
      criterion: (s) => {
        const cr = (s.codex && s.codex.chaptersRead) || {};
        let n = 0;
        for (const k in cr) n += (cr[k] || []).length;
        return n >= 30;
      }
    },
    {
      id: "librarian",
      icon: "🗺️", title: "Librarian",
      desc: "Cleared every book in any single Codex area.",
      criterion: (s) => {
        const lib = window.DG_LIBRARY;
        if (!lib) return false;
        const done = (s.codex && s.codex.booksCompleted) || {};
        return lib.AREAS.some(a => a.books.every(b => done[b.id]));
      }
    },
    {
      id: "complete",
      icon: "🏆", title: "Quest Complete",
      desc: "Cleared all 10 levels and read every Codex book.",
      criterion: (s) => {
        const lib = window.DG_LIBRARY;
        const allLevels = Object.keys(s.completedLevels || {}).length >= 10;
        if (!allLevels || !lib) return false;
        const done = (s.codex && s.codex.booksCompleted) || {};
        return lib.AREAS.every(a => a.books.every(b => done[b.id]));
      }
    }
  ];

  function getById(id) { return CATALOG.find(a => a.id === id) || null; }
  function unlocked() {
    const a = (DG_STATE.get().achievements) || {};
    return Object.keys(a).map(getById).filter(Boolean);
  }

  /* ── Notification toast ─────────────────────────────────────────── */
  function notify(ach) {
    if (!document.body) return;
    const t = document.createElement("div");
    t.className = "ach-toast";
    t.innerHTML =
      '<div class="ach-toast__icon">' + ach.icon + '</div>' +
      '<div class="ach-toast__body">' +
        '<div class="ach-toast__small">🏅 Achievement unlocked</div>' +
        '<div class="ach-toast__title">' + ach.title + '</div>' +
        '<div class="ach-toast__desc">' + ach.desc + '</div>' +
      '</div>';
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add("is-shown"));
    setTimeout(() => t.classList.remove("is-shown"), 4600);
    setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 5100);
  }

  /* ── Check + record ─────────────────────────────────────────────── */
  function check() {
    const state = DG_STATE.get();
    const newly = [];
    for (const a of CATALOG) {
      if (DG_STATE.isAchievementUnlocked(a.id)) continue;
      try {
        if (a.criterion(state) && DG_STATE.unlockAchievement(a.id)) newly.push(a);
      } catch (_) { /* ignore criterion errors */ }
    }
    if (newly.length) {
      newly.forEach((a, i) => setTimeout(() => notify(a), 200 + i * 700));
    }
    return newly;
  }

  return { CATALOG, getById, unlocked, check, notify };
})();
