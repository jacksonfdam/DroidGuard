/* DroidGuard Quest — Player State (localStorage persisted)
 *
 * State is wrapped through DG_INTEGRITY before being written to
 * localStorage so that hand-edits via the browser's storage editor
 * fail validation and silently reset to a fresh save.
 */
window.DG_STATE = (function () {
  const KEY = "dgq:state:v2";        // v2 = integrity-wrapped payload
  const LEGACY_KEYS = ["dgq:state:v1"]; // older plaintext keys to nuke

  const DEFAULT = {
    level: 1,                  // current player level (1..10)
    xp: 0,                     // total points
    completedLevels: {},       // { [levelId]: { stars, points, bestPoints, attempts } }
    streakPerfect: 0,          // streak of 5/5 levels
    codex: {                   // Bonus-quest reading library state
      chaptersRead: {},        // { [bookId]: [chapterIndex, ...] }
      booksCompleted: {}       // { [bookId]: timestamp }
    }
  };

  function fresh() {
    return {
      level: 1, xp: 0,
      completedLevels: {},
      streakPerfect: 0,
      codex: { chaptersRead: {}, booksCompleted: {} }
    };
  }

  function load() {
    try { LEGACY_KEYS.forEach(k => localStorage.removeItem(k)); } catch (_) {}

    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return fresh();
      const parsed = window.DG_INTEGRITY.unpack(raw);
      if (!parsed || !window.DG_INTEGRITY.validate(parsed)) {
        return fresh();
      }
      return {
        level: parsed.level || 1,
        xp: parsed.xp || 0,
        completedLevels: parsed.completedLevels || {},
        streakPerfect: parsed.streakPerfect || 0,
        codex: parsed.codex && typeof parsed.codex === "object"
          ? {
              chaptersRead:    parsed.codex.chaptersRead    || {},
              booksCompleted:  parsed.codex.booksCompleted  || {}
            }
          : { chaptersRead: {}, booksCompleted: {} }
      };
    } catch (e) {
      return fresh();
    }
  }

  function save(s) {
    if (window.__DG_TAMPER) return;
    try { localStorage.setItem(KEY, window.DG_INTEGRITY.pack(s)); }
    catch (e) { /* ignore */ }
  }

  let state = load();

  function get() { return state; }

  function reset() { state = fresh(); save(state); return state; }

  function isUnlocked(levelId) {
    if (levelId === 1) return true;
    return !!state.completedLevels[levelId - 1];
  }
  function isCompleted(levelId) { return !!state.completedLevels[levelId]; }
  function getLevelRecord(levelId) { return state.completedLevels[levelId] || null; }

  function recomputeLevel() {
    const completedCount = Object.keys(state.completedLevels).length;
    state.level = Math.min(10, 1 + completedCount);
    return state.level;
  }

  function recordResult(levelId, { correct, total, points, stars }) {
    const prev = state.completedLevels[levelId] || { bestPoints: 0, attempts: 0 };
    const isFirstClear = !state.completedLevels[levelId];

    state.completedLevels[levelId] = {
      stars: Math.max(prev.stars || 0, stars),
      points,
      bestPoints: Math.max(prev.bestPoints || 0, points),
      attempts: (prev.attempts || 0) + 1,
      correct, total,
      lastPlayed: Date.now()
    };
    const xpGain = Math.max(0, points - (prev.bestPoints || 0));
    state.xp += xpGain;

    if (correct === total) state.streakPerfect += 1;
    else state.streakPerfect = 0;

    if (isFirstClear) recomputeLevel();
    save(state);

    return { isFirstClear, xpGain, levelUp: isFirstClear };
  }

  function totalStars() {
    let total = 0;
    Object.values(state.completedLevels).forEach(r => total += (r.stars || 0));
    return total;
  }

  /* ── Codex (bonus library) ─────────────────────────────────────── */

  function _ensureCodex() {
    if (!state.codex) state.codex = { chaptersRead: {}, booksCompleted: {} };
    if (!state.codex.chaptersRead)   state.codex.chaptersRead = {};
    if (!state.codex.booksCompleted) state.codex.booksCompleted = {};
  }

  function isChapterRead(bookId, chapterIndex) {
    _ensureCodex();
    const arr = state.codex.chaptersRead[bookId];
    return !!(arr && arr.indexOf(chapterIndex) !== -1);
  }

  function isBookCompleted(bookId) {
    _ensureCodex();
    return !!state.codex.booksCompleted[bookId];
  }

  function chaptersReadCount(bookId) {
    _ensureCodex();
    const arr = state.codex.chaptersRead[bookId];
    return arr ? arr.length : 0;
  }

  /**
   * Record a chapter read. Awards POINTS_PER_CHAPTER on first read,
   * plus POINTS_PER_BOOK once every chapter of that book has been read.
   */
  function recordChapterRead(bookId, chapterIndex) {
    _ensureCodex();
    if (!state.codex.chaptersRead[bookId]) state.codex.chaptersRead[bookId] = [];
    if (state.codex.chaptersRead[bookId].indexOf(chapterIndex) !== -1) {
      return { alreadyRead: true, xpGain: 0, bookCompleted: false };
    }
    state.codex.chaptersRead[bookId].push(chapterIndex);

    let xpGain = (window.DG_LIBRARY && window.DG_LIBRARY.POINTS_PER_CHAPTER) || 25;
    let bookCompleted = false;
    const book = window.DG_LIBRARY && window.DG_LIBRARY.getBook(bookId);
    if (book && state.codex.chaptersRead[bookId].length >= book.chapters &&
        !state.codex.booksCompleted[bookId]) {
      state.codex.booksCompleted[bookId] = Date.now();
      xpGain += (window.DG_LIBRARY && window.DG_LIBRARY.POINTS_PER_BOOK) || 100;
      bookCompleted = true;
    }
    state.xp += xpGain;
    save(state);
    return { alreadyRead: false, xpGain, bookCompleted };
  }

  function totalCodexXp() {
    _ensureCodex();
    let xp = 0;
    const cps = (window.DG_LIBRARY && window.DG_LIBRARY.POINTS_PER_CHAPTER) || 25;
    const bps = (window.DG_LIBRARY && window.DG_LIBRARY.POINTS_PER_BOOK)    || 100;
    Object.values(state.codex.chaptersRead).forEach(arr => { xp += arr.length * cps; });
    xp += Object.keys(state.codex.booksCompleted).length * bps;
    return xp;
  }

  function readingHistory() {
    _ensureCodex();
    const out = [];
    const lib = window.DG_LIBRARY;
    if (!lib) return out;
    Object.keys(state.codex.chaptersRead).forEach(bookId => {
      const book = lib.getBook(bookId);
      if (!book) return;
      out.push({
        bookId,
        title: book.title,
        area: book.area.name,
        areaIcon: book.area.icon,
        chaptersRead: state.codex.chaptersRead[bookId].length,
        totalChapters: book.chapters,
        completedAt: state.codex.booksCompleted[bookId] || null
      });
    });
    out.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    return out;
  }

  return {
    get, reset, isUnlocked, isCompleted, recordResult,
    getLevelRecord, totalStars,
    isChapterRead, isBookCompleted, chaptersReadCount,
    recordChapterRead, totalCodexXp, readingHistory
  };
})();
