# Custom ROMs and Rooted Devices

The wild-west tour from *"Custom ROMs and Rooted Devices: The Security Wild West."*

## What you're actually dealing with

A "rooted" device gives the user — and any process they consent to — root permissions. A "custom ROM" replaces the OS the OEM shipped, often disabling security features (`ro.secure=0`, unlocked bootloader, no Play Integrity). Both populations exist for legitimate reasons: enthusiasts, developers, kept-alive hardware, niche markets where OEM support is gone.

For your app, both populations are higher-risk. They can hook your code at runtime. They can read your private storage. They can clone your APK into a sandbox. None of this is unusual; the question is what to do about it.

## Detect, don't decide

Your app's job is to **detect** the modified-environment state and pass it to the backend, which **decides** what to allow. Detection signals:

- `su` binary on path, in `/system/xbin/su`, `/sbin/su`, `/system/bin/su`, `/system/app/Superuser.apk`.
- Magisk packages: `com.topjohnwu.magisk`, `eu.chainfire.supersu`, `com.kingouser.com`.
- Mount table: `/system` mounted rw, partitions remounted, custom recovery hints.
- Build props: `ro.debuggable=1`, `ro.secure=0`, `ro.build.tags=test-keys`, `ro.bootmode=` non-default.
- Play Integrity verdict drops below `DEVICE`.

Hide your detection in native code where Frida hooks have a harder time, and re-check during the session — Magisk Hide can flip on after launch.

## Calibrating the response

Do not blanket-block. Many users on rooted devices are fine; many devices flagged as risky belong to legitimate developers. Match response to risk:

- **Read-only sensitive features** if root is detected.
- **Block money-movement and authentication changes** if root + suspicious behavioral signal.
- **Notify the user** with a meaningful message; "your device is rooted, here's what we restrict."
- **Allow appeals** through a verified channel (email + KYC).

The article details how Banco Inter, Nubank and others publicly handle these cases — the answer is rarely "ban," it is "raise the bar with steps."

→ [Read the full article on Medium ↗](https://medium.com/@jacksonfdam/custom-roms-and-rooted-devices-the-security-wild-west-c5de72851582)
