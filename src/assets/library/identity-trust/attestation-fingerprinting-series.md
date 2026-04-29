# Attestation & Fingerprinting (Series)

The series introduction in *"Android Security Series: Device Attestation and Fingerprinting."* Three chapters that together set up the rest of the identity-and-trust track.

## The big picture

Mobile security boils down to two questions that you need to answer for every privileged request:

- **Who** is making this request? (authentication / authorization)
- **What** is making this request? (device verification)

Most teams overinvest in the first and underinvest in the second. The series argues that "what" should be a first-class concern, with its own architecture, its own metrics and its own SLAs. The next chapters build that architecture piece by piece.

## A risk-graded API

Once you have device-level claims, you can grade endpoints by required confidence. The pattern:

- **Public** endpoints (catalog, status): no device claim required.
- **Authenticated** endpoints (read user data): standard auth token.
- **Privileged** endpoints (write user data, settings): device-bound signature on the request.
- **Sensitive** endpoints (money, profile changes, authentication settings): device signature **and** a current Play Integrity verdict at `DEVICE_INTEGRITY` or higher.

The backend enforces this. Don't let the client decide.

## What the rest of the series covers

The full series walks through:

- Generating and persisting a device-bound key in the Keystore.
- Hashing a soft fingerprint with stable inputs.
- Verifying Play Integrity on the server with proper nonce flow.
- Combining the two into a single risk score.
- Operationalising the signal: dashboards, alerting, rolling-back when a verdict drops.

The point is to leave you with a mental model — *attestation is not a one-shot checkbox; it is a continuous control plane.*

→ [Read the series intro on Medium ↗](https://medium.com/@jacksonfdam/android-security-series-device-attestation-and-fingerprinting-887aafde3e60)
