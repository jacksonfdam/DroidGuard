# GhostTouch

A field guide based on the *GhostTouch* sample project — a hands-on demonstration of the overlay-attack family with a focus on tap-jacking and remote-screen abuse.

## What the demo proves

GhostTouch ships an attacker app and a victim app side by side. The attacker draws a transparent button on top of the victim's "Send" action; the victim taps "Cancel" but, from Android's perspective, "Send" was the topmost view in the touch stack. Money moves. The user blames themselves.

The reason this is a worthwhile teaching tool: it puts a working exploit in a controlled environment where you can poke `MotionEvent` flags, read logcat in real time, and watch how the framework reports obscured input. Reading about overlay attacks is one thing — actually running one against your own app is what makes the lesson stick.

## Reading the touch tape

When you replay the GhostTouch scenario with `filterTouchesWhenObscured="true"` enabled on the sensitive view, the victim's Activity now reports `MotionEvent.FLAG_WINDOW_IS_OBSCURED` and the system silently drops the malicious tap. From the attacker's side, the gesture was sent. From the user's side, nothing happened. The control plane sees a denial event your app can react to: warn, lock, or roll the user out of the flow.

The demo also illustrates `FLAG_WINDOW_IS_PARTIALLY_OBSCURED` — useful when an attacker overlays a small notch (like a "consent" checkbox) instead of the entire screen. Don't filter only the full-screen case.

## Mitigation playbook

Run through these checkpoints with the demo open:

- Toggle the obscured flags on critical buttons; verify the attack now fails.
- Check that you handle "obscured + ignored tap" gracefully — do not freeze the UI, do not silently swallow.
- Pair touch filtering with a runtime overlay scan when the user enters payment or biometric flows.
- For headless automation that simulates touches via Accessibility, use `setSecure` semantics on `Surface` and `WindowManager` flags so screen-recording assistants don't see the surface either.
- Keep a kill-switch: if `getInstallerPackageName()` is unexpected or the device fails Play Integrity, downgrade to read-only.

GhostTouch is a teaching prop, not a product. Use it on lab devices, never against real users.

→ [Source on GitHub ↗](https://github.com/jacksonmafra-umain/GhostTouch)
