# Android Goes Undercover

The geopolitical-product backstory from *"Google's Android Goes Undercover: The Not-So-Open Source Saga."*

## "Open source" with a footnote

Android the **AOSP project** is genuinely open source: source, build system, default apps, security framework. Android the **product** that ships on most phones in your country is not. Google Mobile Services (GMS) — the Play Store, Play Services, Maps, YouTube, Play Integrity — is proprietary, license-required, and the gateway through which the real-world Android security model flows.

Most modern attestation, push notifications, location, and account services run on GMS. Without it, you have a phone that runs Android *the OS* but not Android *the platform*. This split is largely invisible to consumers and largely invisible to dev teams until the day they ship to a market without GMS.

## What changes outside GMS

Two large markets matter: China (Huawei post-2019 sanctions, Xiaomi forks, OPPO/Vivo regional builds) and pure AOSP devices (development boards, /e/OS, GrapheneOS, LineageOS).

Without GMS:

- No Play Integrity. Your attestation strategy must include vendor alternatives (HUAWEI Safety Detect, Samsung Knox SDK) or pure-AOSP fallbacks (Keystore attestation only).
- No FCM. Use HMS Push, vendor pushes, or self-hosted (this is where most teams burn time).
- No Play Store install source. `getInstallerPackageName()` returns null or a vendor store.
- No Google Sign-In. OAuth must run through your own provider.

The article walks through each gap and what alternatives exist, market by market.

## Practical guidance

If your app must ship outside GMS, design the security plumbing to be platform-agnostic from day one. That usually means:

- Wrapping attestation behind a single backend interface that accepts Play Integrity, HMS Safety Detect, or pure Keystore certificates and produces one normalized verdict.
- Server-side push abstraction with FCM and HMS adapters.
- A device-binding flow that does not assume Play Services exists.

Treat GMS as a high-quality default, not a load-bearing dependency.

→ [Read the full article on Medium ↗](https://medium.com/@jacksonfdam/googles-android-goes-undercover-the-not-so-open-source-saga-626c30a7a507)
