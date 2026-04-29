# 🛡️ DroidGuard Quest

> *"From vulnerability to fortress — your Android security journey, gamified."*

**Live → <https://droidguard.vercel.app>**

---

## Principle

DroidGuard Quest is a free, study-only single-page app that turns Android security knowledge into a Duolingo-style journey. The goal is to take a developer or aspiring pentester from **Junior** to **Senior** through ten themed levels, one topic at a time, with quick feedback and a memorable shape — not another wall of text.

**What the experience looks like.** The map is a winding path with ten circular nodes. Tapping the next unlocked node opens a short knowledge briefing, then five randomly-drawn questions from a pool of eight to ten per level. Each correct answer is worth 100 XP and the result screen shows stars (1–5), a badge, the running streak, and a level-up celebration when a new tier unlocks. A bonus **Codex** library — six themed areas, twenty books, sixty short chapters — pays out extra XP for off-quiz reading, and a reading history page tracks what you've gone through.

**What it teaches.** Across the ten levels you cover Android architecture and the APK internals (classes.dex, META-INF, res/), data storage and EncryptedSharedPreferences, the Keystore and modern crypto, HTTPS and certificate pinning, IPC and component exploitation (WebView XSS/LFI, ContentProvider SQL injection, Activity hijacking, tapjacking), authentication with BiometricPrompt and OAuth/PKCE, R8 and reverse engineering, the canonical pentest stack (Frida, Objection, MobSF, Drozer, Burp, QARK, AndroBugs, ClassyShark, APKLeaks, HTTP Toolkit, Pidcat), root and tamper detection, and the OWASP MASVS / Mobile Top 10 (2024) catalogue. The full pool sits at **121 quiz questions**, all sourced from the references in the Credits section.

**Design decisions you will notice in the code.**

- **Source vs. served.** Everything that lives in `src/` is the development source. Everything that lives in `public/` is the static, minified and obfuscated bundle that the local server (and the live host) actually serves. Source is never reachable at runtime.
- **No build framework, no client framework.** Plain JavaScript, plain SVG, plain CSS. The entire bundle is around 67 KB gzipped and boots in well under a second on a cold connection.
- **App-side hardening.** The app is free for studies, but it is not for casual cheating. A small defensive layer ships with the bundle: localStorage payloads are XOR-masked, checksum-stamped and bounds-validated, the production bundle drops `console.*` to no-ops, runs a periodic debugger trap, and flags Frida-style hooks, DevTools and userscript injection. Localhost skips all of this so dev DX stays normal. A `?dev=1` query string opens a session-scoped bypass for the maintainer.
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
│   ├── js/library.js          # Codex catalog
│   ├── js/markdown.js         # tiny markdown renderer
│   ├── js/integrity.js        # XOR + FNV-1a localStorage wrapper
│   ├── js/state.js            # progression with bounds validation
│   ├── js/quiz.js             # session builder & scoring
│   ├── js/fx.js               # CRT + glitch presets
│   ├── js/map.js              # winding SVG path map
│   ├── js/app.js              # views, modals, toast
│   └── assets/
│       ├── favicon.svg
│       ├── library/           # 20 .md books across 6 areas
│       └── paths/             # six themeable journey-path SVGs + preview
├── api/
│   └── health.js              # /api/health serverless function
├── build.js                   # src/ → public/ pipeline
├── server.js                  # local Express server, public/ only
├── package.json
├── vercel.json
└── README.md
```

### Build pipeline

`npm run build` reads `src/` and writes `public/`:

| Stage       | Tool                       | Notes                                                                                                  |
|-------------|----------------------------|--------------------------------------------------------------------------------------------------------|
| JS minify   | `terser`                   | drops `console.*`, mangles names, two passes                                                           |
| JS obfuscate| `javascript-obfuscator`    | heavy profile (string-array, control-flow flattening, self-defending) on `data`, `library`, `integrity`, `state`, `quiz`; light profile elsewhere |
| HTML        | `html-minifier-terser`     | `removeOptionalTags`, `collapseBooleanAttributes`, `removeAttributeQuotes`, inline CSS/JS minified     |
| CSS         | `csso`                     | restructured + compressed                                                                              |
| Names       | (custom rename pass)       | every CSS class and id is rewritten to `_a`-style aliases across CSS, HTML and JS                      |
| Static      | (verbatim copy)            | `src/assets/` (path SVGs, library `.md`)                                                               |

OS metadata such as `.DS_Store` is filtered out. The HTML ends up around 2.4 KB raw / under 1 KB gzipped.

### App-side security

- Strict CSP (`default-src 'self'`, no `unsafe-eval`, no external origins).
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- `localStorage` payloads are XOR-masked with a baked-in salt and stamped with an FNV-1a checksum; tampered or out-of-range values trigger a silent reset.
- In production hosts: `console.*` no-op'd, periodic `debugger;` trap, DevTools and Frida heuristics, userscript / extension scan. Soft signals (window-size delta, console probe) need correlation; strong signals (Frida toString-tamper, userscript globals, extension script srcs) replace the entire DOM with a warning stub. Localhost / `127.*` hosts skip the layer; `?dev=1` opens a per-session bypass for the maintainer.

---

## Credits

DroidGuard Quest is built on top of work generously shared by people in the security community. If the content here helped you, please go read the originals.

### Quiz curriculum

- **Karishma Agrawal** — *Android Security Deep Dive: 100 Questions to Build Secure Apps* (Parts 1, 2 and 3)
  - [Part 1](https://levelup.gitconnected.com/android-security-deep-dive-100-questions-to-build-secure-apps-part-1-60e1e665bd46)
  - [Part 2](https://karishma-agr1996.medium.com/android-security-deep-dive-100-questions-to-build-secure-apps-part-2-7b48ecf92847)
  - [Part 3](https://karishma-agr1996.medium.com/android-security-deep-dive-100-questions-to-build-secure-apps-part-3-a1ae2f776c17)
- **Shuuubhraj** — [Android Pentesting Mindmap](https://github.com/Shuuubhraj/Android-Pentesting-Mindmap) ([online](https://android-mindmap.vercel.app/))
- **m14r41** — [PentestingEverything · Mobile Pentesting](https://github.com/m14r41/PentestingEverything/tree/main/Mobile%20Pentesting)
- **OWASP** — [MASVS](https://mas.owasp.org/MASVS/) and [MASTG / MSTG](https://mas.owasp.org/MASTG/)

### Codex sources — Jackson Mafra

Every book in the in-app Codex is a companion summary of one of these original articles or repos.

| Book                                | Source                                                                                                                                                                |
|-------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Android Overlay Attacks             | [Medium](https://medium.com/@jacksonfdam/android-overlay-attacks-how-they-work-and-how-to-stop-them-f3dbea3d215f)                                                       |
| GhostTouch                          | [GitHub](https://github.com/jacksonmafra-umain/GhostTouch)                                                                                                             |
| Hackers Gonna Hack                  | [Medium](https://medium.com/@jacksonfdam/hackers-gonna-hack-common-bypass-techniques-and-how-to-fight-back-43eb21e1c8f0)                                                |
| Mobile Security Dumpster Fire (Top 10) | [Medium](https://medium.com/@jacksonfdam/so-your-mobile-app-is-a-security-dumpster-fire-owasp-mobile-top-10-for-normal-humans-ddf1ae85f61d)                          |
| Bulletproof Security                | [Medium](https://medium.com/@jacksonfdam/building-a-bulletproof-security-system-combining-attestation-and-fingerprinting-2f4d65c02128)                                  |
| Fingerprinting Android Devices      | [Medium](https://medium.com/@jacksonfdam/fingerprinting-android-devices-like-csi-but-for-your-app-e99a1aeff248)                                                         |
| Device Attestation 101              | [Medium](https://medium.com/@jacksonfdam/device-attestation-101-making-sure-your-users-arent-evil-robots-75928cc1bd0c)                                                  |
| Trust No One                        | [Medium](https://medium.com/@jacksonfdam/trust-no-one-why-your-android-app-needs-to-verify-devices-1228f186a941)                                                        |
| Attestation & Fingerprinting Series | [Medium](https://medium.com/@jacksonfdam/android-security-series-device-attestation-and-fingerprinting-887aafde3e60)                                                    |
| Privacy vs. Security                | [Medium](https://medium.com/@jacksonfdam/privacy-vs-security-walking-the-tightrope-of-user-trust-c29e69199191)                                                          |
| Mobile Security: Hackers Need Hobbies | [Medium](https://medium.com/@jacksonfdam/mobile-security-because-hackers-need-hobbies-too-6b84b0ab52d8)                                                              |
| Custom ROMs and Rooted Devices      | [Medium](https://medium.com/@jacksonfdam/custom-roms-and-rooted-devices-the-security-wild-west-c5de72851582)                                                            |
| Android Goes Undercover             | [Medium](https://medium.com/@jacksonfdam/googles-android-goes-undercover-the-not-so-open-source-saga-626c30a7a507)                                                      |
| The Manufacturer's Dilemma          | [Medium](https://medium.com/@jacksonfdam/the-manufacturers-dilemma-how-samsung-huawei-and-others-handle-security-c898bdc02775)                                          |
| Android Command-Line Tools          | [Medium](https://medium.com/@jacksonfdam/android-command-line-tools-a-guide-for-the-terminally-confused-d5367df1b3c6)                                                   |
| Cuttlefish 🦑                        | [Medium](https://medium.com/@jacksonfdam/cuttlefish-the-android-emulator-you-didnt-know-you-needed-94b86ccc23f3)                                                        |
| Exploring AVDs 🚀                    | [Medium](https://medium.com/@jacksonfdam/exploring-android-virtual-devices-avds-more-than-just-emulators-d93a0450ce53)                                                  |
| Automating Input Events             | [Medium](https://medium.com/@jacksonfdam/automating-input-events-on-android-a-comprehensive-guide-c2a1927217ce)                                                         |
| Verifying Installer Source          | [Medium](https://medium.com/@jacksonfdam/enhancing-android-app-security-verifying-installer-source-and-more-466d9240a605)                                               |
| Hackdroid (vulnerable lab app)      | [GitHub](https://github.com/jacksonfdam/hackdroid)                                                                                                                     |

### Practice apps for hands-on labs

[DIVA](https://github.com/payatu/diva-android) · [InsecureBankv2](https://github.com/dineshshetty/Android-InsecureBankv2) · [Injured Android](https://github.com/B3nac/InjuredAndroid) · [OWASP UnCrackable](https://github.com/OWASP/owasp-mastg/tree/master/Crackmes) · [InsecureShop](https://github.com/optiv/InsecureShop) · [AndroGoat](https://github.com/satishpatnayak/AndroGoat) · [DVHMA](https://github.com/logicalhacking/DVHMA) · [Vuldroid](https://github.com/jaiswalakshansh/Vuldroid) · [ovaa](https://github.com/oversecured/ovaa)

---

DroidGuard Quest is licensed under the MIT License. It is intended for **education only**.
