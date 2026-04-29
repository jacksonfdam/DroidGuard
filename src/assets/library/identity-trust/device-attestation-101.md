# Device Attestation 101

The "intro to attestation" companion to *"Device Attestation 101: Making Sure Your Users Aren't Evil Robots."*

## What attestation is, in one paragraph

Attestation is a hardware-rooted statement signed by a chip vendor that says: *"this device is genuine, this OS is unmodified, this app's signing cert matches what was uploaded to Google Play."* The device provides a token; your backend verifies it against Google's (or another root's) public keys. If the verification passes, you know the request came from a real, unmodified device.

It exists because every other "is this real?" check on the client side is bypassable.

## The Android stack

Three things to know:

- **SafetyNet Attestation** (deprecated). Many older articles still reference this. Newer projects should not adopt it.
- **Play Integrity API** (current). Returns a verdict with three integrity tiers: `BASIC_INTEGRITY`, `DEVICE_INTEGRITY`, `STRONG_INTEGRITY`. Strong requires hardware-backed Keystore, locked bootloader, no Magisk-class hiding.
- **Hardware-backed Keystore**. Independently of Play Integrity, you can request a key with attestation challenge → the chip signs a certificate chain that proves the key lives in TEE/StrongBox.

In practice, fintech and gaming apps lean on Play Integrity for the request-by-request verdict, and use Keystore attestation when binding a session to a device.

## Verifying server-side

Attestation tokens are useless if the client also makes the trust decision. Send the token to your backend, then:

1. Decode the JWS / JWT structure.
2. Verify the signature against Google's public keys (rotate the key list daily).
3. Check `nonce` matches a value the backend issued in the last 60 seconds.
4. Inspect `appIntegrity.appRecognitionVerdict` and `deviceIntegrity.deviceRecognitionVerdict`.
5. Apply rules: which verdicts are acceptable for which actions?

Do not skip the nonce — without it, replay attacks trivialize the whole thing.

The full article walks the verification code top-to-bottom in Node and Kotlin.

→ [Read the full article on Medium ↗](https://medium.com/@jacksonfdam/device-attestation-101-making-sure-your-users-arent-evil-robots-75928cc1bd0c)
