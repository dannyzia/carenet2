# CareNet Android — Google Play release

## What you upload

- **Google Play (new apps / updates):** upload an **Android App Bundle (`.aab`)**, not a raw APK, unless you use a legacy flow.
- **Output path after `npm run android:release`:** under the **external app build dir** (see below),  
  `outputs/bundle/release/app-release.aab`
- **Optional APK** (sideload / testers): `npm run android:release:apk` →  
  `outputs/apk/release/app-release.apk` in that same root.

The `:app` module’s Gradle `buildDirectory` is **not** `android/app/build/` (avoids OneDrive/Explorer locks on `app-release.apk` during `packageRelease`):

- **Windows:** `%LOCALAPPDATA%\CareNet2-Android-app-build\`
- **Else:** repo root `.carenet-android-build/`
- **Override:** set env `CARENET_ANDROID_BUILD_DIR` to an absolute path.

## One-time: upload keystore

1. Copy `keystore.properties.example` to `keystore.properties` in this `android/` folder (both files stay **out of git** for real secrets).
2. Generate an upload keystore (run once, back it up safely):

   ```bash
   keytool -genkeypair -v -keystore carenet-upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias carenet
   ```

3. Place `carenet-upload-key.jks` in `android/` (or set `storeFile` to an absolute path in `keystore.properties`).
4. Fill `storePassword`, `keyPassword`, and `keyAlias` in `keystore.properties`.

## Build machine

- **JDK 21** is required for Capacitor 8 (Java 21 source level). The repo sets `org.gradle.java.home` in `android/gradle.properties` to **Android Studio’s bundled JBR** (`C:/Program Files/Android/Android Studio/jbr`). If Gradle reports **invalid source release: 21**, either install Android Studio at that path or edit `gradle.properties` to point at **Temurin 21** / your JDK 21 install (or comment the line out and set **`JAVA_HOME`** to JDK 21).
- **Foojay toolchain resolver** is enabled in `settings.gradle` so Gradle can auto-download a **JDK 21 toolchain** when needed (first run may require network).

## Build commands (from repo root)

| Command | Result |
|--------|--------|
| `npm run android:release` | Web build → Capacitor sync → **signed AAB** (requires `keystore.properties`) |
| `npm run android:release:apk` | Same → **signed APK** |
| `npm run android:release:debug-sign` | AAB signed with **debug** key — **local testing only**, not for Play |

## Before each Play upload

1. Bump **`versionCode`** (integer, must increase every upload) and **`versionName`** in `android/app/build.gradle` `defaultConfig`.
2. Run `npm run android:release`.
3. In [Play Console](https://play.google.com/console), create a release and upload the `.aab`.

## Firebase / FCM (optional)

- Add `android/app/google-services.json` from your Firebase Android app (package `com.carenet.app`) so push notifications can register. The project builds without it; push will not work until the file is present.

## Store listing (Play Console)

- Privacy policy URL, app category, content rating questionnaire, Data safety form, and screenshots are configured in Play Console, not in this repo.
