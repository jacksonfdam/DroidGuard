# Fingerprinting Android Devices

A practitioner's view of mobile fingerprinting from *"Fingerprinting Android Devices: Like CSI, But for Your App."*

## Stable enough, unique enough

A useful fingerprint balances two opposing forces. It must be **stable** across legitimate use (app updates, OS minor versions, new SIM, restored backup) and **unique** enough to distinguish two "identical" devices in your fleet. Pure hardware IDs are no longer accessible without privileged permissions; you build your fingerprint by composing many low-entropy signals.

The classic recipe: one large concatenated hash of `Build.MANUFACTURER`, `Build.MODEL`, `Build.BRAND`, `Build.HARDWARE`, `Build.FINGERPRINT`, default locale, time zone, screen density, supported ABIs, sensor list and a stable per-install token (`Settings.Secure.ANDROID_ID` is per-app, per-user since Android 8 — perfect for this).

## Sources to mix in

Each signal contributes a few bits of entropy:

- `TelephonyManager` (carrier name, country) — stable, low entropy.
- Sensor inventory (which sensors exist, vendors, max ranges) — moderate entropy, very stable.
- Installed system packages snapshot at first run — high entropy, but legally sensitive on Android 11+.
- Battery and charging characteristics over time — *behavioral* fingerprint.
- WebView default User-Agent (still a thing!) — useful for session continuity.

Hash and salt the bundle on-device, send only the hash. Never ship the raw signals to the server unless you have a clear consent + purpose statement.

## When fingerprints break (and what to do)

A factory reset, an OEM update, even a system theme change can flip enough fields that your fingerprint hash no longer matches. Plan for this:

- Store *several* fingerprints per user (current + previous N). Match against any.
- Allow self-rebinding: a user authenticated by another factor (email + OTP) can register a new fingerprint and retire the old.
- Decay weight over time — a 3-year-old fingerprint shouldn't carry as much trust as a 1-day-old one.
- Track *deltas*. A user whose fingerprint changes one field at a time across releases is normal. A user whose fingerprint flips wildly is suspicious.

The article has a worked example with a reference fingerprint helper class — useful to crib from.

→ [Read the full article on Medium ↗](https://medium.com/@jacksonfdam/fingerprinting-android-devices-like-csi-but-for-your-app-e99a1aeff248)
