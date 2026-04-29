# Hackdroid

Lab notes for the *Hackdroid* practice app — an intentionally vulnerable Android target for security presentations and self-study.

## What Hackdroid contains

Hackdroid bundles a curated set of intentional vulnerabilities, each isolated in its own Activity so you can drill the topic without the rest of the app getting in the way. Topics covered include insecure storage (cleartext SharedPreferences, file system writes to external storage), broken cryptography (hard-coded AES keys, MD5 hashing), exposed components (over-exported Activities and ContentProviders), and misconfigured WebViews (file access on, JS interface exposed, no input validation).

Use it the way you would use DIVA, InsecureBank or AndroGoat — not as the *only* practice app, but as a focused complement.

## Suggested learning order

The article suggests the following progression for someone new to Android security:

1. **Storage flaws first** — they are the easiest to exploit and the most representative of real production bugs. You'll grep `/data/data/<pkg>/shared_prefs` and find treasure.
2. **WebView flaws** — open Burp, intercept the WebView, see the JS bridge in action. This category trips up senior engineers as often as junior ones.
3. **Component exposure** — fire Drozer, enumerate exported components, exploit the unsafe ContentProvider with SQL injection.
4. **Crypto** — understand why hard-coded keys and short IVs fail; reproduce the decryption from the leaked key.

Each lab takes 20–60 minutes. Done in this order, you build the muscle memory you need before tackling more open-ended targets.

## Building it into your team practice

Run it as a workshop:

- Distribute the APK pre-built. Do not let participants compile from source — that wastes the first hour.
- Provide a *target* (e.g., "extract the user's stored token"). Don't just say "find vulnerabilities."
- Time-box each station to 25 minutes; rotate.
- After: 15 minutes of group debrief on each station's techniques.

It works best with 6–12 participants and one person familiar with the answers walking the room.

→ [Source on GitHub ↗](https://github.com/jacksonfdam/hackdroid)
