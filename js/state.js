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
    streakPerfect: 0           // streak of 5/5 levels
  };

  function fresh() { return { ...DEFAULT, completedLevels: {} }; }

  function load() {
    // Drop any legacy plaintext entries to avoid confusion / replay
    try {
      LEGACY_KEYS.forEach(k => localStorage.removeItem(k));
    } catch (_) { /* private mode */ }

    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return fresh();
      const parsed = window.DG_INTEGRITY.unpack(raw);
      if (!parsed || !window.DG_INTEGRITY.validate(parsed)) {
        // Tampered or invalid — start over
        return fresh();
      }
      return {
        level: parsed.level || 1,
        xp: parsed.xp || 0,
        completedLevels: parsed.completedLevels || {},
        streakPerfect: parsed.streakPerfect || 0
      };
    } catch (e) {
      return fresh();
    }
  }

  function save(s) {
    try { localStorage.setItem(KEY, window.DG_INTEGRITY.pack(s)); }
    catch (e) { /* ignore */ }
  }

  let state = load();

  function get() { return state; }

  function reset() {
    state = { ...DEFAULT, completedLevels: {} };
    save(state);
    return state;
  }

  function isUnlocked(levelId) {
    if (levelId === 1) return true;
    return !!state.completedLevels[levelId - 1];
  }

  function isCompleted(levelId) {
    return !!state.completedLevels[levelId];
  }

  function getLevelRecord(levelId) {
    return state.completedLevels[levelId] || null;
  }

  /**
   * Recompute the displayed "player level":
   * starts at 1; +1 per cleared level (capped at 10).
   */
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
      correct,
      total,
      lastPlayed: Date.now()
    };

    // XP only counts improvement on the personal best for that level
    const xpGain = Math.max(0, points - (prev.bestPoints || 0));
    state.xp += xpGain;

    // Streak of perfect runs (5/5)
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

  return {
    get, reset, isUnlocked, isCompleted, recordResult,
    getLevelRecord, totalStars
  };
})();
