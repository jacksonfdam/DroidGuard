/* DroidGuard Quest — Integrity wrapper for localStorage
 *
 * Threat model: deter casual cheating via the browser's
 * localStorage editor. We are NOT trying to defeat someone
 * who is willing to read the (obfuscated) JS — that is impossible
 * in a static client-only app.
 *
 * Approach (sync, no Web Crypto roundtrip):
 *   - XOR-mask the serialized state with a baked-in constant
 *   - append an FNV-1a checksum salted with the same constant
 *   - base64-encode the whole thing
 *
 * Editing the localStorage entry by hand will almost always
 * break either the XOR layer or the checksum, and the app will
 * silently reset progress instead of trusting the bogus data.
 */
window.DG_INTEGRITY = (function () {
  // Baked-in salt. After javascript-obfuscator + string-array,
  // this is no longer a clean literal in the released bundle.
  const SECRET = "dgq.7f9a-4e21-bd8c.guard.quest.v1";

  function fnv1a(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
  }

  function xor(str) {
    let out = "";
    for (let i = 0; i < str.length; i++) {
      out += String.fromCharCode(
        str.charCodeAt(i) ^ SECRET.charCodeAt(i % SECRET.length)
      );
    }
    return out;
  }

  // utf-8 safe base64
  function b64encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function b64decode(b64) {
    return decodeURIComponent(escape(atob(b64)));
  }

  function pack(obj) {
    const json = JSON.stringify(obj);
    const sum = fnv1a(json + SECRET);
    const payload = sum + "|" + json;
    return b64encode(xor(payload));
  }

  function unpack(blob) {
    if (typeof blob !== "string" || !blob) return null;
    let payload;
    try { payload = xor(b64decode(blob)); } catch (_) { return null; }
    const sep = payload.indexOf("|");
    if (sep !== 8) return null;            // checksum is exactly 8 hex chars
    const sum  = payload.slice(0, 8);
    const json = payload.slice(9);
    if (fnv1a(json + SECRET) !== sum) return null;
    try { return JSON.parse(json); } catch (_) { return null; }
  }

  // Simple sanity gate: structure + value bounds
  function validate(state) {
    if (!state || typeof state !== "object") return false;
    if (typeof state.level !== "number" || state.level < 1 || state.level > 10) return false;
    if (typeof state.xp !== "number" || state.xp < 0 || state.xp > 100000) return false;
    if (typeof state.streakPerfect !== "number" || state.streakPerfect < 0 || state.streakPerfect > 1000) return false;
    if (!state.completedLevels || typeof state.completedLevels !== "object") return false;
    for (const id of Object.keys(state.completedLevels)) {
      const r = state.completedLevels[id];
      if (!r || typeof r !== "object") return false;
      if (typeof r.stars !== "number" || r.stars < 0 || r.stars > 5) return false;
      if (typeof r.points !== "number" || r.points < 0 || r.points > 500) return false;
      if (typeof r.bestPoints !== "number" || r.bestPoints < 0 || r.bestPoints > 500) return false;
    }
    // Codex shape check (lenient; absent codex is allowed)
    if (state.codex !== undefined) {
      if (typeof state.codex !== "object" || state.codex === null) return false;
      const cr = state.codex.chaptersRead;
      if (cr !== undefined) {
        if (typeof cr !== "object" || cr === null) return false;
        for (const k of Object.keys(cr)) {
          const arr = cr[k];
          if (!Array.isArray(arr) || arr.length > 50) return false;
          for (const i of arr) {
            if (typeof i !== "number" || i < 0 || i > 49 || !Number.isFinite(i)) return false;
          }
        }
      }
      const bc = state.codex.booksCompleted;
      if (bc !== undefined) {
        if (typeof bc !== "object" || bc === null) return false;
        for (const k of Object.keys(bc)) {
          const t = bc[k];
          if (typeof t !== "number" || t < 0 || !Number.isFinite(t)) return false;
        }
      }
    }
    // Achievements bag — { [id]: timestamp }, optional
    if (state.achievements !== undefined) {
      if (typeof state.achievements !== "object" || state.achievements === null) return false;
      for (const k of Object.keys(state.achievements)) {
        const t = state.achievements[k];
        if (typeof t !== "number" || t < 0 || !Number.isFinite(t)) return false;
      }
    }
    return true;
  }

  return { pack, unpack, validate };
})();
