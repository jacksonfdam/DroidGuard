# Android Overlay Attacks

A study companion to *"Android Overlay Attacks: How They Work and How to Stop Them."* This summary reframes the article's key takeaways for quick reference; for the full piece, follow the link at the bottom of the last chapter.

## How the trick works

An overlay attack draws a malicious window on top of a legitimate one. The user thinks they are tapping "Approve" on their banking app — they are actually tapping a transparent button that authorizes a fund transfer to the attacker. Two technical pieces enable this: `SYSTEM_ALERT_WINDOW` (or, post-Android 8, `TYPE_APPLICATION_OVERLAY`) and the user's installed accessibility services that inflate touch reach.

The malicious window is usually invisible or visually identical to a system prompt. The attack succeeds because Android lets foreground apps render on top of others by design — that's how chat heads, screen recorders and translation pop-ups work. Defenders cannot simply ban overlays without breaking legitimate UX.

> Rule of thumb: anything that *can* draw on top of you *will* draw on top of you. Treat your sensitive screens like aircraft cockpits — fail closed, refuse input under suspicious conditions.

## Detection signals

The Android framework hands developers two helpful flags: `MotionEvent.FLAG_WINDOW_IS_OBSCURED` and `FLAG_WINDOW_IS_PARTIALLY_OBSCURED`. They light up when another window is sitting on top of yours during a touch event. The `View` API mirrors this with `filterTouchesWhenObscured`. The trick is **enabling them on every sensitive view**: confirmation dialogs, biometric prompts, money-moving screens.

Beyond the touch flags you can poll for active overlays via `WindowManager` and `accessibility` system services. A short-lived check on Activity start is usually enough — if a transparent rectangle is sitting in front of your login form, refuse to render the form and explain why.

These signals do produce false positives (system caption bars, "Show on top" assistants the user *wanted*). Whitelist trusted package signatures rather than denying all overlays.

## Hardening checklist

Layer the defenses so a single bypass doesn't unlock the keep:

- Set `android:filterTouchesWhenObscured="true"` on every privileged view and `requestDisallowInterceptTouchEvent` where appropriate.
- Refuse to start sensitive flows when `WindowManager` reports active foreign overlays. Re-check on `onResume`.
- For payments and biometric-gated actions, prefer system-driven sheets (BiometricPrompt, Confirm Credentials) which are rendered above your process and are not overlayable.
- Use Play Integrity API to hint that the device may be compromised when accessibility automation is suspicious.
- Educate users with a one-time onboarding that warns about "Display over other apps" permissions.

The article goes deeper into a worked exploit, sample detection code and the FTC cases that put real teeth behind this category.

→ [Read the full article on Medium ↗](https://medium.com/@jacksonfdam/android-overlay-attacks-how-they-work-and-how-to-stop-them-f3dbea3d215f)
