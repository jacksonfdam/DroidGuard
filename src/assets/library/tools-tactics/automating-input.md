# Automating Input Events on Android

A practical reference based on *"Automating Input Events on Android: A Comprehensive Guide."*

## Three layers of automation

You can drive an Android device's input from three altitudes:

1. **`adb shell input`** — the lowest-friction layer. One-shot taps, swipes and key events. Good for scripts and CI smoke tests.
2. **UI Automator / Espresso** — proper test frameworks. They wait for views, validate state, and integrate with Gradle. UI Automator is cross-app; Espresso is intra-app.
3. **Accessibility services** — runtime automation that any installed app can use *if* the user grants Accessibility permission. Powers many real-world automation tools (and, sadly, many malware families).

Pick the right one for the job. Use `input` for prototypes, the test frameworks for repeatable verification, and Accessibility for end-user-facing automation features.

## The `input` cheatsheet

The commands you'll use over and over:

```
adb shell input tap X Y
adb shell input swipe X1 Y1 X2 Y2 DURATION_MS
adb shell input keyevent KEYCODE_HOME       # 3
adb shell input keyevent KEYCODE_BACK       # 4
adb shell input keyevent KEYCODE_POWER      # 26
adb shell input text "hello%sworld"          # %s = space
adb shell input roll DX DY                   # trackball
```

Combine with `dumpsys window` to know where to tap on a given screen, and `screencap -p` to capture state for visual diffs.

## Espresso is for engineers, UI Automator is for users

Espresso assertions are tightly coupled to your view tree (`onView(withId(R.id.button)).perform(click())`). When the UI changes, the test changes. This is a feature: it forces test maintenance to track product changes.

UI Automator selectors are accessibility-tree based — `By.text("Sign in")`, `By.descContains("Profile")`. They survive UI rewrites better but rely on accessibility labels being good. Maintain those labels for both A11y and tests in one pass.

The article closes with a sample CI pipeline that runs both: smoke `input` script for boot health, Espresso for unit verification, UI Automator for end-to-end flows.

→ [Read the full article on Medium ↗](https://medium.com/@jacksonfdam/automating-input-events-on-android-a-comprehensive-guide-c2a1927217ce)
