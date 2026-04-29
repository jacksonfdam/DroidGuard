# Hackers Gonna Hack

A condensed take on *"Hackers Gonna Hack: Common Bypass Techniques and How to Fight Back."* Three chapters, three families of bypass.

## SSL pinning bypass

Pinning is the single most common control attackers neutralize first. The classic recipe: install a Burp / mitmproxy CA into the user trust store, run the app, watch traffic. Pinning blocks this — until Frida or Objection hooks `TrustManager` and `CertificatePinner` and replaces them with trust-all stubs at runtime.

Defenses:

- Implement pinning in **native code**, not just Java/Kotlin. Method hooks reach Java first.
- Combine declarative `network_security_config.xml` pinning with a runtime `OkHttp.CertificatePinner` check, plus a tertiary handshake validation in JNI.
- Validate certificate transparency log inclusion to spot mass-issued rogue certs.
- Treat one bypassed layer as a fast-fail — assume the rest is also touched.

## Root and emulator detection bypass

Detection that lives in plain Kotlin is one Frida script away from being defeated. Magisk Hide, Zygisk and Shamiko hide root from `getprop` queries and from the file-system scan for `su`. Detection that polls only `Build.FINGERPRINT` is fooled by changing one string.

Workable approach: combine *many* weak signals (file paths, props, package list, mount table, bootloader state, Play Integrity verdict) and never rely on a single positive. Re-check during the session, not only at boot, because Magisk Hide can be turned on after launch. And keep the logic native + obfuscated so a casual hook misses the joint check.

## RASP, attestation and the long game

Runtime Application Self-Protection (RASP) frames the right ambition: detect tampering and react during execution, not at startup. The toolkit:

- Frida-server detection (open ports 27042/27043, `re.frida.server` package, suspicious thread names).
- Repacking detection via signing-cert comparison at runtime.
- Debug detection (`Debug.isDebuggerConnected`, native `ptrace` self-attach trick).
- Server-side anomaly detection: a request that arrives with a known-good signature but unusual telemetry (no sensors, no battery, no SIM) is suspect.

No single layer wins. Stack them, expect each to be peeled, and design your backend to fail safe when the stack lights up red.

→ [Read the full article on Medium ↗](https://medium.com/@jacksonfdam/hackers-gonna-hack-common-bypass-techniques-and-how-to-fight-back-43eb21e1c8f0)
