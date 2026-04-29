# Verifying Installer Source

A defense-in-depth pattern from *"Enhancing Android App Security: Verifying Installer Source and More."*

## What the installer-source check buys you

When your APK is installed, Android records who installed it: Play Store, Galaxy Store, Aurora, sideloaded ADB, or some other arbitrary package. You can read that value with:

```kotlin
val installer = context.packageManager.getInstallerPackageName(context.packageName)
```

Or, on API 30+, the more detailed `getInstallSourceInfo`. If an APK that should only be on Play Store reports an unknown installer, something is up — repacked clones, malware-bundled copies, or a user side-loading a tampered build.

This is a cheap signal worth checking on first launch and, optionally, on each session-start for sensitive apps.

## Reading the result correctly

The legitimate installer values you care about:

- `com.android.vending` — Google Play Store
- `com.amazon.venezia` — Amazon Appstore
- `com.huawei.appmarket` — Huawei AppGallery
- `com.sec.android.app.samsungapps` — Galaxy Store
- `com.aurora.store` — Aurora (privacy-focused Play mirror)
- `null` or `com.google.android.packageinstaller` — sideloaded

Calibrate your response. For a regulated finance app, anything outside `com.android.vending` might warrant a "you must install via Play Store" prompt. For a general-purpose app, that would be too aggressive.

## Layering with other checks

Installer source is one of many soft signals. Combine with:

- Signing certificate match: at runtime, verify your APK's signing cert hash matches an expected fingerprint.
- Play Integrity verdict's `appRecognitionVerdict` — `PLAY_RECOGNIZED` confirms the binary is the Play Store version.
- Install referrer (via Play Install Referrer API) for attribution.

Each layer is bypassable on its own — together, they catch most casual repackagers. The article closes with a sample `IntegrityChecker` class that combines all three.

→ [Read the full article on Medium ↗](https://medium.com/@jacksonfdam/enhancing-android-app-security-verifying-installer-source-and-more-466d9240a605)
