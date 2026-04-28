/* DroidGuard Quest — Player State (localStorage persisted) */
window.DG_STATE = (function () {
  const KEY = "dgq:state:v1";

  const DEFAULT = {
    level: 1,                  // current player level (1..10)
    xp: 0,                     // total points
    completedLevels: {},       // { [levelId]: { stars, points, bestPoints, attempts } }
    streakPerfect: 0           // streak of 5/5 levels
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...DEFAULT, completedLevels: {} };
      const parsed = JSON.parse(raw);
      return {
        level: parsed.level || 1,
        xp: parsed.xp || 0,
        completedLevels: parsed.completedLevels || {},
        streakPerfect: parsed.streakPerfect || 0
      };
    } catch (e) {
      console.warn("State load failed, resetting", e);
      return { ...DEFAULT, completedLevels: {} };
    }
  }

  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
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
