# Trust No One

The argument from *"Trust No One: Why Your Android App Needs to Verify Devices."*

## The premise

A request arriving at your API came from somewhere. Without device verification, you cannot tell if "somewhere" is a real customer's phone, a Selenium automation farm, an emulator running on a bot net, or a repackaged copy of your APK. Your authentication tokens prove a *user identity*; they do not prove a device.

This is fine for low-stakes apps. It is catastrophic for banking, ride hailing, marketplaces and games. The fix is to attach a cryptographic claim about the device to every privileged request.

## What "verify the device" looks like

Three components, in order of strength:

1. A device-bound asymmetric key, generated in the Keystore the first time the user authenticates, and pinned to the user's account on the backend. Every request signs a server-issued nonce with that key. Rotation only happens through a verified flow (re-login + biometric).
2. Play Integrity verdict, attached to high-risk actions (login, password reset, money movement, profile changes).
3. Soft signals (device fingerprint, behavioral telemetry) used as risk modifiers.

The first one is the workhorse — cheap to verify, hard to spoof, and it gives you device-level revocation: lose the device, the key disappears.

## Failure modes you must plan for

If you ship device verification poorly, your support load explodes:

- **New device** flow must be smooth. The user just bought a Pixel; they expect it to work.
- **Account recovery** without the old device must exist (email + OTP + cooldown).
- **Multiple devices per user** is the norm, not the exception. Allow N tokens.
- **Frozen devices** (banks block iOS 12 etc.) need an explicit "you must update" path, not a generic error.

The article finishes with a checklist of UX patterns that keep verification tight without driving legitimate users into your support queue.

→ [Read the full article on Medium ↗](https://medium.com/@jacksonfdam/trust-no-one-why-your-android-app-needs-to-verify-devices-1228f186a941)
