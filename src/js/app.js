/* DroidGuard Quest — Application orchestration
 * Routes between views (map, level intro modal, quiz, score, credits)
 * and binds the HUD to player state.
 */
window.DG_APP = (function () {
  const view = document.getElementById("view");
  const modal = document.getElementById("modal");
  const modalPanel = document.getElementById("modalPanel");
  const toastEl = document.getElementById("toast");

  // ---------- HUD ----------
  function refreshHud() {
    // Defensive: anti-tamper may have nuked the DOM before this runs.
    const s = DG_STATE.get();
    const lvl   = document.getElementById("hudLevel");
    const xp    = document.getElementById("hudXp");
    const stars = document.getElementById("hudStars");
    if (lvl)   lvl.textContent   = s.level;
    if (xp)    xp.textContent    = s.xp;
    if (stars) stars.textContent = DG_STATE.totalStars();
  }

  // ---------- Modal helpers ----------
  function openModal(html) {
    modalPanel.innerHTML = html;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    modal.querySelectorAll("[data-close]").forEach(el => {
      el.onclick = () => closeModal();
    });
    document.addEventListener("keydown", escClose);
  }
  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modalPanel.innerHTML = "";
    document.removeEventListener("keydown", escClose);
  }
  function escClose(e) { if (e.key === "Escape") closeModal(); }

  // ---------- Toast ----------
  let toastTimer;
  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.className = "toast is-shown" + (kind ? " is-" + kind : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.className = "toast";
    }, 2200);
  }

  // ---------- View transitions ----------
  // Every view swap is decorated with a brief glitch + noise burst.
  function fxTransition() {
    if (window.DG_FX) {
      DG_FX.glitch(view, 500);
      DG_FX.noise(280);
    }
  }

  // ---------- Views ----------
  function renderMap() {
    DG_MAP.render(view);
    refreshHud();
    fxTransition();
  }

  function renderCredits() {
    const items = DG_DATA.SOURCES.map(s => `
      <div class="credit">
        <div class="credit__avatar">${(s.name || "?").charAt(0)}</div>
        <div>
          <p class="credit__name">${s.name}</p>
          <p class="credit__desc">${s.desc}</p>
          <div class="row">
            ${s.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label} ↗</a>`).join("")}
          </div>
        </div>
      </div>
    `).join("");

    view.innerHTML = `
      <section class="section">
        <h1 class="title">📚 Credits & Sources</h1>
        <p class="subtitle">This app is built on the knowledge generously shared by amazing folks
        in the security community. Thank you! 🙏</p>
        <div class="credits-list">${items}</div>

        <div style="margin-top: 28px; padding: 16px; border: 1px dashed var(--line); border-radius: 14px;">
          <p class="muted" style="margin: 0 0 10px;">Settings</p>
          <button class="btn btn--danger" id="btnReset">🗑️ Reset progress</button>
        </div>
      </section>
    `;

    fxTransition();

    document.getElementById("btnReset").addEventListener("click", () => {
      openModal(`
        <h2>Reset progress?</h2>
        <p>You will lose all stars, XP and completed levels. This cannot be undone.</p>
        <div class="modal__actions">
          <button class="btn btn--ghost" data-close>Cancel</button>
          <button class="btn btn--danger" id="confirmReset">Erase everything</button>
        </div>
      `);
      document.getElementById("confirmReset").addEventListener("click", () => {
        DG_STATE.reset();
        closeModal();
        toast("Progress wiped. Good luck on the new run! 🚀");
        renderMap();
      });
    });
  }

  // ---------- Level flow ----------
  function openLevel(id) {
    const level = DG_DATA.LEVELS.find(l => l.id === id);
    if (!level) return;
    if (!DG_STATE.isUnlocked(id)) { toast("🔒 Clear the previous level first.", "error"); return; }

    const rec = DG_STATE.getLevelRecord(id);
    const stars = rec ? rec.stars : 0;
    const best = rec ? rec.bestPoints : 0;

    openModal(`
      <div class="modal__hero">
        <div class="modal__hero-icon">${level.icon}</div>
        <div>
          <span class="tag">Level ${level.id} · ${level.tier}</span>
          <h2 style="margin-top: 6px;">${level.name}</h2>
          <p class="muted" style="margin: 2px 0 0;">${level.theme}</p>
        </div>
      </div>
      <h3>${level.info.title}</h3>
      <p>${level.info.body}</p>
      ${level.info.bullets && level.info.bullets.length ? `
        <ul style="color: var(--text-dim); padding-left: 18px; margin: 8px 0 4px;">
          ${level.info.bullets.map(b => `<li style="margin: 4px 0;">${b}</li>`).join("")}
        </ul>` : ""}

      <div class="row" style="margin-top: 14px; gap: 14px;">
        <div class="hud__chip"><strong>${level.questions.length}</strong>&nbsp;questions in pool</div>
        <div class="hud__chip"><strong>5</strong>&nbsp;drawn per attempt</div>
        ${rec ? `<div class="hud__chip">⭐ ${stars}/5 · ${best} pts</div>` : ""}
      </div>

      <div class="modal__actions">
        <button class="btn btn--ghost" data-close>Later</button>
        <button class="btn btn--primary" id="btnStartQuiz">I'm ready 🚀</button>
      </div>
    `);

    // Light glitch on the modal panel — "tuning the channel"
    if (window.DG_FX) DG_FX.glitch(modalPanel, 420);

    document.getElementById("btnStartQuiz").addEventListener("click", () => {
      closeModal();
      runQuiz(level);
    });
  }

  // ---------- Quiz runtime ----------
  function runQuiz(level) {
    const session = DG_QUIZ.buildSession(level);
    let idx = 0;
    let correctCount = 0;
    let answeredThisQuestion = false;

    function renderQuestion() {
      const q = session[idx];
      const pct = (idx / session.length) * 100;
      view.innerHTML = `
        <section class="section">
          <div class="quiz__top">
            <div class="progressbar"><div class="progressbar__fill" style="width:${pct}%"></div></div>
            <div class="quiz__counter">${idx + 1} / ${session.length}</div>
          </div>

          <div class="row" style="margin-bottom: 8px;">
            <span class="tag">${level.icon} Level ${level.id} · ${level.name}</span>
          </div>

          <p class="quiz__question">${q.q}</p>

          <div class="quiz__options" id="opts">
            ${q.options.map((opt, i) => `
              <button class="opt" data-i="${i}">
                <span class="opt__bullet">${String.fromCharCode(65 + i)}</span>
                <span>${opt}</span>
              </button>
            `).join("")}
          </div>

          <div class="quiz__feedback" id="fb"></div>

          <div class="modal__actions" style="margin-top: 18px;">
            <button class="btn btn--ghost" id="btnAbort">Quit</button>
            <button class="btn btn--primary" id="btnNext" disabled>Next ➜</button>
          </div>
        </section>
      `;

      answeredThisQuestion = false;

      view.querySelectorAll(".opt").forEach(btn => {
        btn.addEventListener("click", () => onAnswer(btn));
      });
      view.querySelector("#btnNext").addEventListener("click", onNext);
      view.querySelector("#btnAbort").addEventListener("click", () => {
        if (confirm("Quit the quiz? This attempt's progress will be lost.")) {
          renderMap();
        }
      });
    }

    function onAnswer(btn) {
      if (answeredThisQuestion) return;
      answeredThisQuestion = true;

      const chosen = parseInt(btn.dataset.i, 10);
      const q = session[idx];
      const correct = chosen === q.a;
      if (correct) correctCount++;

      view.querySelectorAll(".opt").forEach((el, i) => {
        el.disabled = true;
        if (i === q.a) el.classList.add("is-correct");
        if (i === chosen && !correct) el.classList.add("is-wrong");
      });

      const fb = view.querySelector("#fb");
      fb.classList.add("is-shown", correct ? "is-correct" : "is-wrong");
      fb.innerHTML = `
        <strong>${correct ? "✅ Correct!" : "❌ Not quite."}</strong><br/>
        ${q.why || ""}
      `;
      view.querySelector("#btnNext").disabled = false;
    }

    function onNext() {
      idx++;
      if (idx >= session.length) {
        finish();
      } else {
        renderQuestion();
      }
    }

    function finish() {
      const total = session.length;
      const stars = DG_QUIZ.starsFor(correctCount, total);
      const points = DG_QUIZ.pointsFor(correctCount);
      const badge = DG_QUIZ.badgeFor(correctCount, total);

      const result = DG_STATE.recordResult(level.id, {
        correct: correctCount,
        total,
        points,
        stars
      });
      refreshHud();

      // Tell the map view to drop+bounce the stars on this milestone the
      // next time it renders. Only fires on a perfect 5/5 finish.
      if (correctCount === total && window.DG_MAP && DG_MAP.markCelebrate) {
        DG_MAP.markCelebrate(level.id);
      }

      view.innerHTML = `
        <section class="section score">
          <span class="tag">${level.icon} Level ${level.id} · ${level.name}</span>
          <h1 class="title" style="margin-top: 10px;">Result</h1>

          <div class="score__stars" aria-label="${stars} of 5 stars">
            ${[0,1,2,3,4].map(i => `<span class="star ${i < stars ? "on" : ""}">★</span>`).join("")}
          </div>

          <div class="score__points">
            <span class="num" id="ptsNum">0</span><span style="color: var(--text-dim); font-size: 18px;"> pts</span>
          </div>

          <div class="score__badge">${badge}</div>

          <p class="muted">Correct: <strong style="color: var(--text)">${correctCount}/${total}</strong>
          ${result.xpGain > 0 ? ` · <span style="color: var(--neon)">+${result.xpGain} XP</span>` : " · No new record"}
          ${result.levelUp ? ` · <span style="color: var(--cyan)">🎉 LEVEL UP! You're now LV ${DG_STATE.get().level}</span>` : ""}
          ${DG_STATE.get().streakPerfect >= 3 ? ` · <span style="color: var(--gold)">🔥 On Fire (${DG_STATE.get().streakPerfect})</span>` : ""}
          </p>

          <div class="modal__actions" style="justify-content: center; margin-top: 24px;">
            <button class="btn" id="btnRetry">↻ Try again</button>
            <button class="btn btn--primary" id="btnBackMap">Back to map →</button>
          </div>
        </section>
      `;

      // Result reveal: stronger glitch + double noise burst.
      if (window.DG_FX) {
        DG_FX.glitch(view, 800);
        DG_FX.noise(420);
        setTimeout(() => DG_FX.noise(220), 260);
        if (result.levelUp) setTimeout(() => DG_FX.glitch(document.body, 500), 600);
      }

      const target = points;
      const numEl = document.getElementById("ptsNum");
      let cur = 0;
      const step = Math.max(1, Math.round(target / 30));
      const itv = setInterval(() => {
        cur += step;
        if (cur >= target) { cur = target; clearInterval(itv); }
        numEl.textContent = cur;
      }, 28);

      document.getElementById("btnRetry").addEventListener("click", () => runQuiz(level));
      document.getElementById("btnBackMap").addEventListener("click", () => {
        renderMap();
        if (result.levelUp) toast(`🎉 Level up! LV ${DG_STATE.get().level}`, "success");
      });
    }

    // Quiz start — channel-tune effect on the first question.
    if (window.DG_FX) DG_FX.noise(220);
    renderQuestion();
    if (window.DG_FX) DG_FX.glitch(view, 500);
  }

  /* ─────────────────────────────────────────────────────────────────
   *  ABOUT / GUIDE
   * ────────────────────────────────────────────────────────────── */
  function renderAbout() {
    const totalCh = window.DG_LIBRARY ? DG_LIBRARY.totalChapters() : 60;
    const totalBk = window.DG_LIBRARY ? DG_LIBRARY.totalBooks()    : 20;

    view.innerHTML = `
      <section class="section">
        <div class="about-hero">
          <svg class="about-hero__logo" viewBox="0 0 64 64" aria-hidden="true">
            <defs>
              <linearGradient id="abLogoGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stop-color="#00FF88"/>
                <stop offset="1" stop-color="#00D4FF"/>
              </linearGradient>
            </defs>
            <path d="M32 6 L54 14 V30 C54 44 44 56 32 60 C20 56 10 44 10 30 V14 Z"
                  fill="none" stroke="url(#abLogoGrad)" stroke-width="3.2" stroke-linejoin="round"/>
            <path d="M22 32 L29 39 L42 24"
                  fill="none" stroke="url(#abLogoGrad)" stroke-width="3.2"
                  stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="20" cy="14" r="1.6" fill="url(#abLogoGrad)"/>
            <circle cx="44" cy="14" r="1.6" fill="url(#abLogoGrad)"/>
          </svg>
          <h1 class="about-hero__title">DroidGuard Quest</h1>
          <p class="about-hero__sub">"From vulnerability to fortress — your Android security journey, gamified."</p>
        </div>

        <div class="about-grid">
          <div class="about-card">
            <h2>📖 What is this</h2>
            <p>A free, study-only single-page app that turns Android security knowledge into a Duolingo-style journey. Ten themed levels take you from <strong>Junior</strong> to <strong>Senior</strong>, plus a bonus <strong>Codex</strong> with longer-form reading.</p>
            <p>No accounts, no analytics, no servers. Everything lives in your browser. The app is open to read, the content is owned by the upstream authors listed in Credits.</p>
          </div>

          <div class="about-card about-card--score">
            <h2>🗺️ How the levels work</h2>
            <p>The map shows the 10 levels of the journey. Each level opens a short briefing, then asks you 5 random questions drawn from a pool of 9–17 per level.</p>
            <ul>
              <li><strong>Each correct answer</strong> = 100 points. A perfect run = 500.</li>
              <li><strong>Stars</strong>: 5/5 → ⭐⭐⭐⭐⭐, 4/5 → ⭐⭐⭐⭐, 0/5 → 💀.</li>
              <li><strong>Player level</strong> (LV in the HUD) = 1 + number of cleared levels.</li>
              <li><strong>XP</strong> only counts your <em>personal best</em> — repeating a level doesn't farm.</li>
              <li><strong>Streak</strong> of three perfect 5/5 runs = "🔥 On Fire" badge.</li>
              <li>Each level <strong>unlocks the next</strong>. Locked nodes show their number; current pulses neon; cleared show the level emoji + ✓.</li>
            </ul>
            <div class="score-table">
              <span class="key">5/5</span><span class="val">Perfect run</span><span class="pts">+500</span>
              <span class="key">4/5</span><span class="val">Almost there</span><span class="pts">+400</span>
              <span class="key">3/5</span><span class="val">Good job</span><span class="pts">+300</span>
              <span class="key">2/5</span><span class="val">Keep studying</span><span class="pts">+200</span>
              <span class="key">1/5</span><span class="val">Try again</span><span class="pts">+100</span>
            </div>
            <p>Tip: read the briefing on each level <em>before</em> starting the quiz — the questions cover the same concepts in shuffled order.</p>
          </div>

          <div class="about-card about-card--codex">
            <h2>📚 How the Codex works</h2>
            <p>The Codex is a parallel learning surface — short article companions you read on your own time for bonus XP. Open it from the <span class="kbd">📚</span> button in the HUD.</p>
            <ul>
              <li><strong>${totalBk} books</strong> across <strong>6 themed areas</strong>, ~${Math.round(totalCh / totalBk)} chapters each (<strong>${totalCh} chapters total</strong>).</li>
              <li>Each chapter reads in 1–2 minutes inside a modal.</li>
              <li><strong>+25 XP per chapter</strong>, plus <strong>+100 XP bonus</strong> when every chapter of a book is read.</li>
              <li>The "Mark as read" button unlocks after you scroll ~80% of the chapter (or after 2.5s for very short ones).</li>
              <li>Every chapter ends with a back-link to the original Medium article or repo — the Codex summarizes, the source has the full take.</li>
              <li><strong>📜 History</strong> tab inside Codex shows what you've read, newest first.</li>
            </ul>
          </div>

          <div class="about-card about-card--privacy">
            <h2>🛡️ Privacy & data</h2>
            <p>All progress (level state, stars, XP, Codex reading) lives in your browser's <code>localStorage</code> only. The payload is XOR-masked + checksum-stamped, so hand-edits via the storage editor either fail validation or trip the integrity check and reset progress.</p>
            <p>On non-localhost hosts the production bundle adds passive defenses: <strong>console blocking</strong>, a periodic <strong>debugger trap</strong>, <strong>DevTools heuristics</strong> and a <strong>screenshot veil</strong> on focus loss. These are deterrents, not a guarantee — see Credits for the full reasoning.</p>
            <p>You can <strong>reset your progress</strong> any time from the bottom of the Credits screen.</p>
          </div>

          <div class="about-card">
            <h2>⌨️ Tips & easter eggs</h2>
            <ul>
              <li>The path-art style is randomized per session: refresh to roll a new look from <em>chip-hub</em>, <em>hud-tactical</em> or <em>circuit</em>.</li>
              <li>The CRT scanlines + glitch effects use one of <strong>seven random presets</strong> per load — sometimes pristine, sometimes "bad signal."</li>
              <li>The map's accent color follows your current player level, so the journey shifts tone as you progress: silver → amber → violet → cyan → teal → red → steel → orange → neon → gold.</li>
              <li>First time you nail 5/5 on a level, the cleared milestone celebrates with a star drop-bounce + shockwave.</li>
              <li>Use <span class="kbd">Esc</span> to close any modal. <span class="kbd">Tab</span> traps work for keyboard navigation.</li>
              <li>Want to re-roll the random style? Just refresh the page.</li>
            </ul>
          </div>
        </div>
      </section>
    `;
    fxTransition();
  }

  /* ─────────────────────────────────────────────────────────────────
   *  CODEX (bonus library)
   * ────────────────────────────────────────────────────────────── */

  function fmtDate(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    const pad = n => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function renderCodex() {
    const lib = window.DG_LIBRARY;
    const totalRead = Object.values(DG_STATE.get().codex.chaptersRead || {})
      .reduce((s, arr) => s + (arr ? arr.length : 0), 0);
    const totalChapters = lib.totalChapters();
    const booksDone = Object.keys(DG_STATE.get().codex.booksCompleted || {}).length;
    const codexXp = DG_STATE.totalCodexXp();

    const areaCards = lib.AREAS.map(a => {
      const totalAreaCh = a.books.reduce((s, b) => s + b.chapters, 0);
      const readAreaCh = a.books.reduce((s, b) => s + DG_STATE.chaptersReadCount(b.id), 0);
      const areaDone = a.books.every(b => DG_STATE.isBookCompleted(b.id));
      const pct = totalAreaCh ? Math.round((readAreaCh / totalAreaCh) * 100) : 0;
      return `
        <button class="codex-area" data-area-id="${a.id}" style="--area-color: ${a.color};">
          <div class="codex-area__icon">${a.icon}</div>
          <div class="codex-area__body">
            <div class="codex-area__name">${a.name}${areaDone ? " <span class=\"codex-area__check\">✓</span>" : ""}</div>
            <div class="codex-area__desc">${a.desc}</div>
            <div class="codex-area__progress">
              <div class="codex-area__bar"><div class="codex-area__fill" style="width:${pct}%"></div></div>
              <span class="codex-area__count">${readAreaCh} / ${totalAreaCh} ch.</span>
            </div>
          </div>
        </button>
      `;
    }).join("");

    view.innerHTML = `
      <section class="section">
        <h1 class="title">📚 Codex</h1>
        <p class="subtitle">Bonus knowledge — read short chapters in your own time and earn extra XP.</p>
        <div class="codex-stats">
          <div class="hud__chip"><strong>${totalRead}</strong>/${totalChapters} chapters</div>
          <div class="hud__chip"><strong>${booksDone}</strong>/${lib.totalBooks()} books</div>
          <div class="hud__chip">⚡ <strong>${codexXp}</strong> XP from Codex</div>
          <button class="btn btn--ghost" id="btnHistory">📜 History</button>
        </div>
        <div class="codex-grid">${areaCards}</div>
      </section>
    `;

    view.querySelectorAll("[data-area-id]").forEach(btn => {
      btn.addEventListener("click", () => renderArea(btn.dataset.areaId));
    });
    document.getElementById("btnHistory").addEventListener("click", () => renderHistory());
    fxTransition();
  }

  function renderArea(areaId) {
    const area = window.DG_LIBRARY.getArea(areaId);
    if (!area) return renderCodex();

    const bookCards = area.books.map(b => {
      const read = DG_STATE.chaptersReadCount(b.id);
      const done = DG_STATE.isBookCompleted(b.id);
      const pct = b.chapters ? Math.round((read / b.chapters) * 100) : 0;
      return `
        <button class="codex-book ${done ? "is-done" : ""}" data-book-id="${b.id}">
          <div class="codex-book__title">${b.title}${done ? " <span class=\"codex-book__check\">✓</span>" : ""}</div>
          <div class="codex-book__tagline">${b.tagline}</div>
          <div class="codex-area__progress">
            <div class="codex-area__bar"><div class="codex-area__fill" style="width:${pct}%; background: ${area.color};"></div></div>
            <span class="codex-area__count">${read} / ${b.chapters} ch.</span>
          </div>
        </button>
      `;
    }).join("");

    view.innerHTML = `
      <section class="section">
        <button class="btn btn--ghost codex-back" id="btnBack">← Back to Codex</button>
        <h1 class="title" style="margin-top: 12px;">${area.icon} ${area.name}</h1>
        <p class="subtitle">${area.desc}</p>
        <div class="codex-grid codex-grid--books" style="--area-color: ${area.color};">${bookCards}</div>
      </section>
    `;

    document.getElementById("btnBack").addEventListener("click", () => renderCodex());
    view.querySelectorAll("[data-book-id]").forEach(btn => {
      btn.addEventListener("click", () => renderBook(btn.dataset.bookId));
    });
    fxTransition();
  }

  function renderBook(bookId) {
    const book = window.DG_LIBRARY.getBook(bookId);
    if (!book) return renderCodex();

    fetch("assets/" + book.file, { credentials: "omit" })
      .then(r => (r.ok ? r.text() : ""))
      .then(md => {
        const chapters = md ? DG_MD.chapters(md) : [];
        const list = chapters.length
          ? chapters.map((ch, i) => {
              const read = DG_STATE.isChapterRead(book.id, i);
              return `
                <button class="codex-chapter ${read ? "is-read" : ""}" data-chapter-index="${i}">
                  <span class="codex-chapter__num">${i + 1}</span>
                  <span class="codex-chapter__title">${DG_MD.escape(ch.title)}</span>
                  <span class="codex-chapter__state">${read ? "✓ read" : "Read →"}</span>
                </button>
              `;
            }).join("")
          : `<p class="muted">Chapters not available — open the original article instead.</p>`;

        view.innerHTML = `
          <section class="section">
            <button class="btn btn--ghost codex-back" id="btnBack">← Back to ${book.area.name}</button>
            <h1 class="title" style="margin-top: 12px;">${book.title}</h1>
            <p class="subtitle">${book.tagline}</p>
            <div class="row" style="margin-bottom: 14px;">
              <a class="btn" href="${book.source}" target="_blank" rel="noopener noreferrer">↗ Read original</a>
            </div>
            <div class="codex-chapters">${list}</div>
          </section>
        `;

        document.getElementById("btnBack").addEventListener("click", () => renderArea(book.area.id));
        view.querySelectorAll("[data-chapter-index]").forEach(btn => {
          btn.addEventListener("click", () => openChapter(book, chapters, parseInt(btn.dataset.chapterIndex, 10)));
        });
      })
      .catch(() => toast("Failed to load chapter content.", "error"));
    fxTransition();
  }

  function openChapter(book, chapters, idx) {
    const ch = chapters[idx];
    if (!ch) return;
    const html = DG_MD.render(ch.body);
    const isLast = idx === chapters.length - 1;

    openModal(`
      <div class="modal__hero">
        <div class="modal__hero-icon">${book.area.icon}</div>
        <div>
          <span class="tag">Codex · ${book.area.name}</span>
          <h2 style="margin-top: 6px;">${book.title}</h2>
          <p class="muted" style="margin: 2px 0 0;">Chapter ${idx + 1} of ${chapters.length} · ${DG_MD.escape(ch.title)}</p>
        </div>
      </div>
      <div class="codex-reader" id="codexReader">
        ${html}
        <p class="muted" style="margin-top: 18px; padding-top: 14px; border-top: 1px dashed var(--line);">
          Want the full article? <a href="${book.source}" target="_blank" rel="noopener noreferrer">Read it on the original source ↗</a>
        </p>
      </div>
      <div class="codex-reader__progress" id="codexProgress">
        <div class="codex-reader__bar"></div>
      </div>
      <div class="modal__actions">
        <button class="btn btn--ghost" data-close>Close</button>
        <button class="btn btn--primary" id="btnMarkRead" disabled>Scroll to enable</button>
      </div>
    `);

    const reader = document.getElementById("codexReader");
    const bar = document.querySelector("#codexProgress .codex-reader__bar");
    const btnMark = document.getElementById("btnMarkRead");
    const already = DG_STATE.isChapterRead(book.id, idx);
    let unlocked = false;

    function unlockMark() {
      if (unlocked) return;
      unlocked = true;
      btnMark.disabled = false;
      btnMark.textContent = already
        ? "Already read — close"
        : (isLast ? "Mark as read & finish book →" : "Mark as read · next chapter →");
    }

    function onScroll() {
      const max = reader.scrollHeight - reader.clientHeight;
      const pct = max > 0 ? Math.min(1, reader.scrollTop / max) : 1;
      if (bar) bar.style.width = (pct * 100).toFixed(1) + "%";
      if (pct >= 0.8) unlockMark();
    }
    reader.addEventListener("scroll", onScroll);
    setTimeout(onScroll, 0);
    // For very short chapters that don't scroll, unlock after 2.5s.
    setTimeout(() => { if (!unlocked) unlockMark(); }, 2500);

    btnMark.addEventListener("click", () => {
      if (already) { closeModal(); return; }
      const result = DG_STATE.recordChapterRead(book.id, idx);
      refreshHud();
      const nextIdx = idx + 1;
      if (result.bookCompleted) {
        toast(`📚 Book completed: ${book.title} · +${result.xpGain} XP`, "success");
        if (window.DG_FX) DG_FX.glitch(modalPanel, 500);
      } else if (result.xpGain > 0) {
        toast(`✅ Chapter read · +${result.xpGain} XP`, "success");
      }
      if (nextIdx < chapters.length) {
        closeModal();
        setTimeout(() => openChapter(book, chapters, nextIdx), 220);
      } else {
        closeModal();
        renderBook(book.id);
      }
    });
  }

  function renderHistory() {
    const items = DG_STATE.readingHistory();
    const list = items.length
      ? items.map(it => `
          <div class="codex-history__item">
            <div class="codex-history__icon">${it.areaIcon}</div>
            <div class="codex-history__body">
              <div class="codex-history__title">${it.title}</div>
              <div class="codex-history__meta">
                ${it.area} · ${it.chaptersRead}/${it.totalChapters} chapters
                ${it.completedAt ? ` · completed ${fmtDate(it.completedAt)}` : ""}
              </div>
            </div>
            <button class="btn btn--ghost codex-history__open" data-book-id="${it.bookId}">Open →</button>
          </div>
        `).join("")
      : `<p class="muted">No chapters read yet — pick an area to begin.</p>`;

    view.innerHTML = `
      <section class="section">
        <button class="btn btn--ghost codex-back" id="btnBack">← Back to Codex</button>
        <h1 class="title" style="margin-top: 12px;">📜 Reading History</h1>
        <p class="subtitle">What you've read so far, newest first.</p>
        <div class="codex-history">${list}</div>
      </section>
    `;
    document.getElementById("btnBack").addEventListener("click", () => renderCodex());
    view.querySelectorAll(".codex-history__open").forEach(btn => {
      btn.addEventListener("click", () => renderBook(btn.dataset.bookId));
    });
    fxTransition();
  }

  // ---------- Boot ----------
  function init() {
    // If the anti-tamper layer nuked the DOM before we got here, the HUD
    // buttons no longer exist — bail silently rather than throw on null.
    if (window.__DG_TAMPER) return;
    if (!document.getElementById("hudLevel")) return;

    refreshHud();
    renderMap();

    // Each getElementById call must be a literal — the build's class/id
    // renamer rewrites the string in place, but only on direct
    // getElementById("…") syntax. Indirect calls via a helper that
    // forwards a variable would NOT be renamed, breaking every button.
    const btnHome    = document.getElementById("btnHome");
    const btnCodex   = document.getElementById("btnCodex");
    const btnAbout   = document.getElementById("btnAbout");
    const btnCredits = document.getElementById("btnCredits");
    if (btnHome)    btnHome.addEventListener("click",    () => renderMap());
    if (btnCodex)   btnCodex.addEventListener("click",   () => renderCodex());
    if (btnAbout)   btnAbout.addEventListener("click",   () => renderAbout());
    if (btnCredits) btnCredits.addEventListener("click", () => renderCredits());
  }

  return { init, openLevel, toast };
})();

document.addEventListener("DOMContentLoaded", () => DG_APP.init());
