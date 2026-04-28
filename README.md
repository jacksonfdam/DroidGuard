# 🛡️ DroidGuard Quest

> *"From vulnerability to fortress — your Android security journey, gamified."*

---

## Principle

DroidGuard Quest is a free, study-only single-page app that turns Android security knowledge into a Duolingo-style journey. The goal is to take a developer or aspiring pentester from **Junior** to **Senior** through ten themed levels, one topic at a time, with quick feedback and a memorable shape — not another wall of text.

**What the experience looks like.** The map is a winding path with ten circular nodes. Tapping the next unlocked node opens a short knowledge briefing, then five randomly-drawn questions from a pool of eight to ten per level. Each correct answer is worth 100 XP and the result screen shows stars (1–5), a badge, the running streak, and a level-up celebration when a new tier unlocks.

**What it teaches.** Across the ten levels you cover Android architecture and the APK internals (classes.dex, META-INF, res/), data storage and EncryptedSharedPreferences, the Keystore and modern crypto, HTTPS and certificate pinning, IPC and component exploitation (WebView XSS/LFI, ContentProvider SQL injection, Activity hijacking, tapjacking), authentication with BiometricPrompt and OAuth/PKCE, R8 and reverse engineering, the canonical pentest stack (Frida, Objection, MobSF, Drozer, Burp, QARK, AndroBugs, ClassyShark, APKLeaks, HTTP Toolkit, Pidcat), root and tamper detection, and the OWASP MASVS / Mobile Top 10 (2024) catalogue. The full pool sits at **121 questions** all sourced from the references at the end of this file.

**Design decisions you will notice in the code.**

- **Source vs. served.** Everything that lives in `src/` is the development source. Everything that lives in `public/` is the static, minified and obfuscated bundle that the local server (and Vercel) actually serves. Source is never reachable at runtime.
- **No build framework, no client framework.** Plain JavaScript, plain SVG, plain CSS. The entire bundle is around 67 KB gzipped and boots in well under a second on a cold connection.
- **App-side hardening.** The app is free for studies, but it is not for casual cheating. A small defensive layer ships with the bundle: localStorage payloads are XOR-masked, checksum-stamped and bounds-validated, the production bundle drops `console.*` to no-ops, runs a periodic debugger trap, and flags Frida-style hooks, DevTools and userscript injection. Localhost skips all of this so dev DX stays normal.
- **Privacy by default.** All progress lives in your browser's `localStorage`. Nothing leaves the device. There is no analytics, no tracking, no remote sync.

---

## How to run

You need Node.js 18 or newer.

```bash
# 1. install runtime + build dependencies
npm install

# 2. build the static bundle (src/ -> public/)
npm run build

# 3. serve the bundle on http://localhost:3000
npm start
```

Or in a single command for iterative work:

```bash
npm run dev          # build, then start
```

Other scripts:

| Script              | What it does                                       |
|---------------------|----------------------------------------------------|
| `npm run build`     | Minifies, obfuscates and compresses into `public/` |
| `npm start`         | Serves `public/` on port 3000 (Express)            |
| `npm run dev`       | `build` followed by `start`                        |
| `npm run preview`   | Alias of `start`, for post-build QA                |
| `npm run clean`     | Removes `public/`                                  |

### Project layout

```
DroidGuard Quest/
├── src/                       # source — never served
│   ├── index.html
│   ├── css/styles.css
│   ├── js/anti-tamper.js
│   ├── js/data.js             # 10 levels, 121 questions
│   ├── js/integrity.js        # XOR + FNV-1a localStorage wrapper
│   ├── js/state.js            # progression with bounds validation
│   ├── js/quiz.js             # session builder & scoring
│   ├── js/map.js              # winding SVG path map
│   ├── js/app.js              # views, modals, toast
│   └── assets/favicon.svg
├── api/
│   └── health.js              # /api/health serverless function
├── build.js                   # src/ → public/ pipeline
├── server.js                  # local server, public/ only
├── package.json
├── vercel.json
└── README.md
```

### Build pipeline

`npm run build` reads `src/` and writes `public/`:

| Stage       | Tool                       | Notes                                                                                                  |
|-------------|----------------------------|--------------------------------------------------------------------------------------------------------|
| JS minify   | `terser`                   | drops `console.*`, mangles names, two passes                                                           |
| JS obfuscate| `javascript-obfuscator`    | heavy profile (string-array, control-flow flattening, self-defending) on `data`, `integrity`, `state`, `quiz`; light profile elsewhere |
| HTML        | `html-minifier-terser`     | `removeOptionalTags`, `collapseBooleanAttributes`, `removeAttributeQuotes`, inline CSS/JS minified     |
| CSS         | `csso`                     | restructured + compressed                                                                              |
| Static      | (verbatim copy)            | `assets/`, `api/`                                                                                      |

OS metadata such as `.DS_Store` is filtered out. The HTML ends up around 2.4 KB raw / under 1 KB gzipped.

### Deploy to Vercel

`vercel.json` already wires `buildCommand: npm run build` and `outputDirectory: public`, so Vercel runs the full pipeline on every push and serves the obfuscated bundle. Files under `api/` are auto-detected as serverless functions.

```bash
npm i -g vercel
vercel             # preview deploy
vercel --prod      # production deploy
```

### App-side security

- Strict CSP (`default-src 'self'`, no `unsafe-eval`, no external origins).
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- `localStorage` payloads are XOR-masked with a baked-in salt and stamped with an FNV-1a checksum; tampered or out-of-range values trigger a silent reset.
- In production hosts: `console.*` no-op'd, periodic `debugger;` trap, DevTools and Frida heuristics, userscript / extension scan. On detection the app pauses progress and shows a sticky banner.

---

## Credits

DroidGuard Quest is built on top of work generously shared by people in the security community. If the content here helped you, please go read the originals.

- **Karishma Agrawal** — *Android Security Deep Dive: 100 Questions to Build Secure Apps* (Parts 1, 2 and 3)
  - [Part 1](https://levelup.gitconnected.com/android-security-deep-dive-100-questions-to-build-secure-apps-part-1-60e1e665bd46)
  - [Part 2](https://karishma-agr1996.medium.com/android-security-deep-dive-100-questions-to-build-secure-apps-part-2-7b48ecf92847)
  - [Part 3](https://karishma-agr1996.medium.com/android-security-deep-dive-100-questions-to-build-secure-apps-part-3-a1ae2f776c17)
- **Shuuubhraj** — [Android Pentesting Mindmap](https://github.com/Shuuubhraj/Android-Pentesting-Mindmap) ([online](https://android-mindmap.vercel.app/))
- **m14r41** — [PentestingEverything · Mobile Pentesting](https://github.com/m14r41/PentestingEverything/tree/main/Mobile%20Pentesting)
- **OWASP** — [MASVS](https://mas.owasp.org/MASVS/) and [MASTG / MSTG](https://mas.owasp.org/MASTG/)
- **Practice apps** referenced in the in-app credits screen — [DIVA](https://github.com/payatu/diva-android), [InsecureBankv2](https://github.com/dineshshetty/Android-InsecureBankv2), [Injured Android](https://github.com/B3nac/InjuredAndroid), [OWASP UnCrackable](https://github.com/OWASP/owasp-mastg/tree/master/Crackmes), [InsecureShop](https://github.com/optiv/InsecureShop), [AndroGoat](https://github.com/satishpatnayak/AndroGoat), [DVHMA](https://github.com/logicalhacking/DVHMA), [Vuldroid](https://github.com/jaiswalakshansh/Vuldroid), [ovaa](https://github.com/oversecured/ovaa).

DroidGuard Quest is licensed under the MIT License. It is intended for **education only**.
