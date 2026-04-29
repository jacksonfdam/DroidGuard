# Android Command-Line Tools

The terminal-friendly walkthrough from *"Android Command-Line Tools: A Guide for the Terminally Confused."*

## ADB is your scalpel

`adb` (Android Debug Bridge) is the Swiss-army knife. The commands you actually use:

```
adb devices                       # list connected devices
adb -s SERIAL shell                # open a shell on a specific device
adb install -r app.apk             # reinstall an APK
adb uninstall com.foo.bar          # uninstall by package
adb logcat -s "MyTag"              # filter logs by tag
adb shell pm list packages -3      # third-party packages only
adb shell dumpsys window           # window manager dump (for overlay debugging)
adb shell setprop log.tag.X DEBUG  # bump log level at runtime
adb push / pull                    # move files in either direction
```

`adb` works through USB or wirelessly (`adb tcpip 5555` then `adb connect IP`). For lab work, wireless is enough. For perf or low-level debug, USB is more reliable.

## aapt and apksigner for static work

`aapt` (Android Asset Packaging Tool) and its successor `aapt2` read APK metadata — package name, version code, permissions, signing scheme:

```
aapt dump badging app.apk
aapt2 dump permissions app.apk
apksigner verify --print-certs app.apk
```

Use these in CI to sanity-check release artifacts: confirm the right version code, the right minSdk, the right signing cert before promoting to Play.

## bundletool, profman and the big-binaries crew

For modern App Bundle workflows:

- `bundletool build-apks --bundle app.aab` to generate device-specific APKs.
- `bundletool install-apks` to install on a connected device.
- `profman` to inspect baseline profiles for cold-start performance.
- `tracecmd` and `simpleperf` for runtime profiling.

These live under `Android SDK / cmdline-tools` once you've run `sdkmanager`.

The article concludes with a one-page "I forgot the command" cheatsheet. Print it, tape it to the wall.

→ [Read the full article on Medium ↗](https://medium.com/@jacksonfdam/android-command-line-tools-a-guide-for-the-terminally-confused-d5367df1b3c6)
