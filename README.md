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
npm start            # http://localhost:3000
```

The Express server (`server.js`) serves the SPA from the project root and auto-mounts every file under `api/` as a route at `/api/<filename>`.

---

## ☁️ Deploy to Vercel

The project is Vercel-ready in two compatible ways:

**As a static site (default):** `vercel.json` declares headers, caching and SPA rewrites. The files under `api/` are auto-detected as serverless functions.

**As a Node server:** the same `server.js` exports an Express app and starts a listener locally. It mirrors the platform behavior: identical security headers, same routing logic. Useful for local QA before deploy.

```bash
npm i -g vercel
vercel             # preview
vercel --prod      # production
```

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
│   ├── data.js                # 10 levels + question pools
│   ├── state.js               # progression (localStorage)
│   ├── quiz.js                # quiz logic & scoring
│   ├── map.js                 # winding SVG path map
│   └── app.js                 # views, modals, toast
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
