# Bulletproof Security

Companion notes to *"Building a Bulletproof Security System: Combining Attestation and Fingerprinting."*

## Why one signal is never enough

Attestation answers "is this device legitimate hardware running an unmodified OS?" Fingerprinting answers "have I seen this exact device before, and does its profile look consistent?" Each one alone is bypassable: a determined attacker can spoof attestation results in a hooked process; a legitimate user upgrading their phone breaks any single fingerprint.

Combine them and the failure modes complement: a clean Play Integrity verdict + a stable fingerprint + reasonable telemetry triangulates a genuine, returning user. Anomalies in any one dimension trigger step-up auth instead of an outright block.

## Building the verdict

A practical layered verdict:

1. **Hardware attestation** via Play Integrity (or DeviceCheck on iOS). Hardware-backed `STRONG_INTEGRITY` is the gold tier; `DEVICE` is acceptable; `BASIC` is suspect.
2. **App attestation**. The same Play Integrity response confirms the APK matches the signing cert you uploaded.
3. **Soft fingerprint**: a stable hash derived from `Build.*`, install ID, language, time zone, screen DPI, package list (where allowed).
4. **Behavioral telemetry**: typing cadence, gesture style, network paths used, battery drain pattern.

Send the bundle to the backend. The backend, not the client, decides risk.

## Wiring the response

Risk score → response. Don't gate every action — gate by sensitivity:

- **Low risk**: continue silently.
- **Medium risk**: re-prompt for biometric or PIN.
- **High risk**: degrade to read-only, lock money-moving features, request OTP.
- **Catastrophic**: invalidate session, force fresh login on a clean install.

Always give the legitimate user a recovery path. Cars-from-the-airport edge cases (new phone, new SIM, traveling) will trigger your step-ups; design for them.

The article includes a sample server-side scoring function and a state diagram for risk transitions. Worth a slow read.

→ [Read the full article on Medium ↗](https://medium.com/@jacksonfdam/building-a-bulletproof-security-system-combining-attestation-and-fingerprinting-2f4d65c02128)
