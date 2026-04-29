# Exploring Android Virtual Devices (AVDs) 🚀

The AVD deep-dive from *"Exploring Android Virtual Devices: More Than Just Emulators!"*

## Beyond the default Pixel

When most developers think "AVD" they think of Android Studio's wizard: pick Pixel 7, pick API 33, click create. That is the easy path; the article makes the case that AVDs are a rich tooling surface that most teams underuse.

What you can configure that the wizard hides:

- Custom hardware profiles: arbitrary RAM, screen density, sensors present, virtual cameras.
- System image variants: vanilla AOSP, Google APIs, Google Play, ATD (lightweight automated-testing image).
- ARM64 vs x86_64 vs x86 — matters for native-code testing.
- Cold-boot profiles to test fresh-install flows.
- Snapshots: save and restore device state in 2 seconds.

`avdmanager` and `emulator` accept all of this from the command line, which means CI can spin AVDs without touching the Studio UI.

## Snapshots are the secret weapon

Snapshot a clean state. Run a destructive test. Roll back. Run another destructive test. Each test starts from the exact same baseline.

```
emulator -avd Pixel_API_33 -snapshot clean -no-window
adb shell am start -n com.foo/.MainActivity
# … run your test …
emulator -avd Pixel_API_33 -snapshot clean -no-window  # reset
```

For security testing, this means you can run a "pristine install" against an APK over and over without state contamination from previous runs.

## ATD images and CI

The Android Testing Devices (ATD) images are stripped-down system images explicitly tuned for unit/UI tests in CI: smaller, faster, no animations, no Play Store. They boot in under a minute on a modest CI runner.

Pair ATDs with `gradle managed devices` blocks to declaratively spin emulators per build target. Gradle tears them down when the test run ends.

Worth standardising on across teams — replaces a lot of hand-rolled Docker-based emulator setups.

→ [Read the full article on Medium ↗](https://medium.com/@jacksonfdam/exploring-android-virtual-devices-avds-more-than-just-emulators-d93a0450ce53)
