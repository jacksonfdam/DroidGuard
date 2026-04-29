# The Manufacturer's Dilemma

The OEM-by-OEM tour from *"The Manufacturer's Dilemma: How Samsung, Huawei, and Others Handle Security."*

## Why every Android isn't "the same Android"

Samsung, Xiaomi, Huawei, OPPO and the rest each ship a customized Android with their own security additions, forks of the framework, and battery-saving "optimizations" that may break legitimate background work. As a developer, your app runs on top of all of them and must behave reasonably on each.

The security profile of an OEM is shaped by three factors: the markets it serves, its relationship with Google, and its hardware platform (Samsung's StrongBox vs Qualcomm's QSEE vs MediaTek's TEE). Each combination produces different attestation paths, different default screen-recording rules and different trust assumptions about pre-installed apps.

## Three OEMs, three postures

**Samsung Knox** is the gold standard in commercial mobile security: hardware-backed key attestation, a mature container model (Knox Workspace), Knox SDK for enterprises. If your app is Knox-aware, you can ask the system to refuse running on devices below a certain Knox attestation level. Worth it for fintech and regulated apps.

**Huawei post-Trump** ships HMS Core in place of GMS. Safety Detect plays Play Integrity's role; Push Kit plays FCM's. Your attestation layer needs an HMS adapter or you are blind on a market that ships ~100M devices a year.

**Xiaomi / OPPO / Vivo** historically ship aggressive task-killers, custom theme engines that intercept Activity transitions, and pre-installed apps with system-level privileges. Your defenses must assume the OS is not entirely on your side: re-check FLAG_SECURE on resume, validate signing on every boot, log telemetry about unexpected `onPause` patterns.

## What this means for your roadmap

Three questions to answer before shipping to a new market:

1. Which OEMs dominate? (Local market share data, not global.)
2. What attestation paths exist for those OEMs?
3. Which OEM-specific quirks (battery, theme, pre-installed apps) will my UX run into?

The article includes a compatibility matrix you can copy. Worth keeping pinned in the security wiki.

→ [Read the full article on Medium ↗](https://medium.com/@jacksonfdam/the-manufacturers-dilemma-how-samsung-huawei-and-others-handle-security-c898bdc02775)
