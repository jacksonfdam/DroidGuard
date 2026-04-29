# Mobile Security Dumpster Fire

A plain-English tour of the OWASP Mobile Top 10 (2024), based on *"So Your Mobile App is a Security Dumpster Fire."*

## What the Top 10 actually is

OWASP's Mobile Top 10 is a community-maintained list of the most common, most damaging mistakes shipped in production mobile apps. It is **not** a checklist of every threat, and it is **not** ranked by exploit difficulty — it is ranked by how often these things show up in real assessments. The 2024 edition refreshed the list to track how attacks have evolved since 2016.

The new categories are:

- M1 Improper Credential Usage
- M2 Inadequate Supply Chain Security
- M3 Insecure Authentication / Authorization
- M4 Insufficient Input / Output Validation
- M5 Insecure Communication
- M6 Inadequate Privacy Controls
- M7 Insufficient Binary Protections
- M8 Security Misconfiguration
- M9 Insecure Data Storage
- M10 Insufficient Cryptography

## The three "boring" wins (M5, M9, M10)

If you only fix three things this quarter, fix these.

**M5 — Insecure Communication.** TLS everywhere, with certificate pinning on sensitive endpoints, a strict `network_security_config.xml`, and HSTS upstream. No `usesCleartextTraffic="true"`, ever, in production.

**M9 — Insecure Data Storage.** Treat `SharedPreferences` as cleartext on disk (because it is). Use `EncryptedSharedPreferences` and `EncryptedFile` for anything sensitive, SQLCipher for SQLite, and the Android Keystore for keys. External storage is hostile.

**M10 — Insufficient Cryptography.** AES-GCM with random IVs, KDFs derived from passwords (PBKDF2/scrypt/Argon2 with salts), no DES, no MD5 or SHA-1 for security purposes. Don't roll your own — use the platform.

## The newer pain points (M1, M2, M7)

**M1 — Improper Credential Usage** is the 2024 way of saying "stop hard-coding API keys." Rotate them. Pin them to a backend. Let your CI catch them in commits.

**M2 — Inadequate Supply Chain Security** is the SDK problem. Every analytics, ad and fingerprint library you import is also exfiltrating data. Audit, vendor, version-pin, monitor advisories.

**M7 — Insufficient Binary Protections** is the obfuscation, anti-debug, anti-tamper, root-detection hill. Required for fintech, gaming and any vertical where the attacker is a paying user.

The article walks each item with examples, code snippets and "what your security audit will yell at you about." Very readable.

→ [Read the full article on Medium ↗](https://medium.com/@jacksonfdam/so-your-mobile-app-is-a-security-dumpster-fire-owasp-mobile-top-10-for-normal-humans-ddf1ae85f61d)
