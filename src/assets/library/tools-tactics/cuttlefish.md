# Cuttlefish 🦑

Field notes on *"Cuttlefish: The Android Emulator You Didn't Know You Needed."*

## What Cuttlefish is

Cuttlefish is Google's "next-generation" Android emulator, designed for **scaling**: spin up many virtual devices on a server, run them headless, drive them with `adb` over the network. It is the emulator the Android team itself uses for CI. You can run dozens of Cuttlefish instances on a single Linux box.

It is not a replacement for AVD when you are clicking through your app. It is a replacement for "we need to test on a thousand different device profiles overnight" when you have a CI farm.

## When to reach for it

Reach for Cuttlefish when:

- You are running automated test suites (Espresso, UI Automator, MacroBenchmark) at scale.
- You need to validate against many Android versions and form factors without a physical lab.
- You want a clean, reproducible image for security testing — Cuttlefish snapshots roll back instantly.
- You are doing fuzzing or large-scale dynamic analysis.

It is not a fit when you need to test biometric prompts (no fingerprint sensor sim), payments (no GMS by default), or anything that requires a real radio.

## Setting one up

The article walks through a minimal setup on Ubuntu:

```
sudo apt install android-cuttlefish-host-{base,frontend,user}
sudo usermod -aG cvdnetwork,kvm $USER
launch_cvd                      # spin a default device
adb connect 0.0.0.0:6520         # connect to it
```

From there, the device looks like any ADB-attached phone. Build farms run hundreds of these in parallel, fed by Bazel or Gradle test runners.

For local hacking, classic AVDs are still usually friendlier. For continuous testing, Cuttlefish wins on density and reproducibility.

→ [Read the full article on Medium ↗](https://medium.com/@jacksonfdam/cuttlefish-the-android-emulator-you-didnt-know-you-needed-94b86ccc23f3)
