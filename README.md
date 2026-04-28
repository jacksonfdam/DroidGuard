# 🛡️ DroidGuard Quest

> *"From vulnerability to fortress — your Android security journey starts here."*

A gamified single-page app (Duolingo / Candy Crush style) that teaches Android security from Junior to Senior across 10 stages. Every level opens a knowledge modal, draws 5 random questions from a curated pool, and ends with a score screen with stars and level-up.

Built with **vanilla JavaScript + SVG + a tiny Express server**. No build step. Vercel-ready as a static site or as a serverless function.

---

## 🗺️ The 10 levels

| #  | Name              | Theme                                       | Tier      |
|----|-------------------|---------------------------------------------|-----------|
| 1  | The Foundation    | Android Security Basics & Architecture      | Intern    |
| 2  | Data Vault        | Data Storage & SharedPreferences            | Junior I  |
| 3  | Cipher Gate       | Encryption, Keystore & Cryptography         | Junior II |
| 4  | Net Shield        | Network Security & SSL/TLS Pinning          | Mid I     |
| 5  | Intent Maze       | Intents, Deep Links & IPC                   | Mid II    |
| 6  | Auth Fortress     | Authentication, Biometrics & Sessions       | Mid III   |
| 7  | Code Armor        | Obfuscation, R8/ProGuard & Reverse Eng.     | Senior I  |
| 8  | Pentest Arena     | Pentesting, Frida, Objection & MobSF        | Senior II |
| 9  | Root Detector     | Root, Tamper Detection & RASP               | Senior III|
| 10 | Guardian Master   | OWASP MASVS, Compliance & Secure SDLC       | Master    |

Scoring: 5/5 = ⭐⭐⭐⭐⭐ + 500 XP, plus a badge per result tier. A streak of three perfect runs unlocks "🔥 On Fire".

---

## 🚀 Run locally

```bash
npm install
npm run dev          # http://localhost:3000  (source, no minify)
npm run build        # writes ./dist
npm run preview      # serves the built bundle
```

The Express server (`server.js`) serves the SPA from the project root and auto-mounts every file under `api/` as a route at `/api/<filename>`. It applies the same security headers as `vercel.json` so local QA mirrors production.

---

## 🏗️ Build pipeline

`npm run build` produces a hardened static bundle in `dist/`:

| Stage | Tool | Notes |
|-------|------|-------|
| JS minify | `terser` | drops `console.*`, mangles names |
| JS obfuscate | `javascript-obfuscator` | heavy profile (string-array, control-flow flattening, self-defending) on the files that hold answer keys: `data`, `integrity`, `state`, `quiz`. Light profile elsewhere. |
| HTML minify | `html-minifier-terser` | collapses whitespace, minifies inline CSS/JS |
| CSS minify | `csso` | restructured, compressed |
| Assets | (verbatim copy) | `assets/`, `api/`, `vercel.json` |

Hidden files (`.DS_Store`, dotfiles) never ship.

---

## 🛡️ Anti-tamper layer

The app is free and educational. To deter casual cheating without claiming bulletproof protection, the bundle ships a small defensive layer:

- **State integrity** (`js/integrity.js`): every save is XOR-masked with a baked-in salt, stamped with an FNV-1a checksum and base64-encoded. Hand-edits via the browser's storage editor break either layer and the app silently resets. Value bounds are enforced on load (level 1..10, stars 0..5, points 0..500 per level).
- **Console blocking** (`js/anti-tamper.js`, production only): `console.{log,info,warn,error,debug,trace,table,...}` are replaced with no-ops via `Object.defineProperty` (writable + configurable false).
- **Debugger trap**: a 1.5 s `setInterval` runs a `debugger;` statement so step-through in DevTools becomes painful.
- **DevTools heuristics**: window outer/inner-size delta + the `console.log` toString-getter trick.
- **Native-toString check**: detects Frida-style monkey-patches by verifying that built-ins still serialize to `[native code]`.
- **Userscript/extension scan**: looks for `GM_*`, `unsafeWindow`, dataset markers and `chrome-extension://` script srcs.

On any signal, the runtime sets `window.__DG_TAMPER`, renders a sticky banner and `state.save()` refuses to persist further changes.

> Localhost and `127.*` hosts skip these checks so dev DX stays normal.

---

## ☁️ Deploy to Vercel

`vercel.json` already wires `buildCommand: npm run build` and `outputDirectory: dist`, so Vercel runs the full pipeline on every deploy and serves the obfuscated bundle. The files under `api/` are auto-detected as serverless functions.

```bash
npm i -g vercel
vercel             # preview
vercel --prod      # production
```

For local QA before deploy: `npm run build && npm run preview`.

---

## 📁 Layout

```
DroidGuard Quest/
├── api/
│   └── health.js              # /api/health serverless endpoint
├── assets/
│   └── favicon.svg
├── css/
│   └── styles.css             # dark / neon theme
├── js/
│   ├── anti-tamper.js         # console block, devtools/Frida/userscript checks
│   ├── data.js                # 10 levels + 121 questions
│   ├── integrity.js           # XOR + FNV-1a wrapper for localStorage
│   ├── state.js               # progression with integrity validation
│   ├── quiz.js                # quiz logic & scoring
│   ├── map.js                 # winding SVG path map
│   └── app.js                 # views, modals, toast
├── build.js                   # minify + obfuscate pipeline -> dist/
├── server.js                  # Express dev server (Vercel-compatible)
├── index.html
├── package.json
├── vercel.json
└── README.md
```

---

## 📚 Credits

Educational content based on:

- **Karishma Agrawal** — *Android Security Deep Dive: 100 Questions to Build Secure Apps* (Parts 1, 2 & 3)
  - [Part 1](https://levelup.gitconnected.com/android-security-deep-dive-100-questions-to-build-secure-apps-part-1-60e1e665bd46)
  - [Part 2](https://karishma-agr1996.medium.com/android-security-deep-dive-100-questions-to-build-secure-apps-part-2-7b48ecf92847)
  - [Part 3](https://karishma-agr1996.medium.com/android-security-deep-dive-100-questions-to-build-secure-apps-part-3-a1ae2f776c17)
- **Shuuubhraj** — [Android Pentesting Mindmap](https://github.com/Shuuubhraj/Android-Pentesting-Mindmap) ([online](https://android-mindmap.vercel.app/))
- **m14r41** — [PentestingEverything: Mobile Pentesting](https://github.com/m14r41/PentestingEverything/tree/main/Mobile%20Pentesting)
- **OWASP** — [MASVS](https://mas.owasp.org/MASVS/) and [MSTG](https://mas.owasp.org/MASTG/)

---

## 🎨 Design prompt (to generate extra screens)

> Dark-theme mobile SPA, cybersecurity gamification aesthetic, neon green (#00FF88) and cyan (#00D4FF) accents on dark navy (#0A0E27), subtle circuit-board grid overlay, shield iconography, flat illustrations with glow effects, rounded corners, modern sans-serif typography, winding path map with circular numbered nodes (locked greyed-out / current pulsing neon green / done with cyan checkmark), star ratings floating above completed nodes, soft particle ambience, mobile-first portrait orientation.

---

## 🔐 App-side security notes

- Strict CSP configured in `vercel.json` (no `unsafe-eval`, no external origins).
- `X-Frame-Options: DENY` (no clickjacking).
- `Permissions-Policy` disables camera, microphone and geolocation.
- All progress lives in browser `localStorage` — no data leaves the device.

> DroidGuard Quest is educational. For real-world apps with high security requirements, follow MASVS-L2 + Resilience and pentest regularly. 💪
