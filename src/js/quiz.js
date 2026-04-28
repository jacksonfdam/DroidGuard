/* DroidGuard Quest — Quiz module
 * Picks 5 random questions from the level's pool and tracks scoring.
 */
window.DG_QUIZ = (function () {
  const QUESTIONS_PER_RUN = 5;
  const POINTS_PER_CORRECT = 100;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Pick 5 random distinct questions and shuffle each option set */
  function buildSession(level) {
    const pool = level.questions || [];
    const picked = shuffle(pool).slice(0, Math.min(QUESTIONS_PER_RUN, pool.length));
    return picked.map(q => {
      const indices = q.options.map((_, i) => i);
      const shuffled = shuffle(indices);
      const newOptions = shuffled.map(i => q.options[i]);
      const newCorrect = shuffled.indexOf(q.a);
      return {
        q: q.q,
        options: newOptions,
        a: newCorrect,
        why: q.why || ""
      };
    });
  }

  /** Star tier from correct count */
  function starsFor(correct, total) {
    if (correct >= total) return 5;
    if (correct === total - 1) return 4;
    if (correct === total - 2) return 3;
    if (correct === total - 3) return 2;
    if (correct === total - 4) return 1;
    return 0;
  }

  function badgeFor(correct, total) {
    if (correct === total) return "🏆 Perfect!";
    if (correct === total - 1) return "🚀 Almost there!";
    if (correct === total - 2) return "💪 Good job";
    if (correct === total - 3) return "📚 Keep studying";
    if (correct === total - 4) return "🔁 Try again";
    return "💀 Re-read the briefing!";
  }

  function pointsFor(correct) {
    return correct * POINTS_PER_CORRECT;
  }

  return {
    QUESTIONS_PER_RUN,
    POINTS_PER_CORRECT,
    buildSession,
    starsFor,
    badgeFor,
    pointsFor
  };
})();
