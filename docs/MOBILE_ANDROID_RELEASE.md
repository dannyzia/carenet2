# CareNet Android release checklist (D008 / Play Store)

This repo uses **Capacitor** with `appId` `com.carenet.app`. Web assets are built with Vite into `dist/`, then synced into `android/` via `npm run cap:sync`.

## Prerequisites

- Android Studio (current AGP from Capacitor template)
- JDK 21 (matches Capacitor 8 Android plugin)
- Node/npm; run `npm run build` before `npx cap sync android`

## Day-to-day commands

| Command | Purpose |
|---------|---------|
| `npm run cap:sync` | Production web build + copy into Android project |
| `npm run cap:open` | Open Android Studio |
| `npm run cap:run:android` | Build + run on connected device/emulator |

## Firebase Cloud Messaging (FCM)

1. Create a Firebase project and add an **Android app** with package name `com.carenet.app`.
2. Download **google-services.json** and place it at `android/app/google-services.json` (this path is gitignored).
3. Use `android/app/google-services.json.example` as a structural reference.
4. The Gradle `google-services` plugin applies automatically when that file is present (`android/app/build.gradle`).
5. `@capacitor/push-notifications` already pulls in `firebase-messaging`; notification **channels** are created in `CareNetApplication` (D021 IDs).

## Deep links and App Links

- **Custom scheme:** `carenet://…` — intent filter is in `AndroidManifest.xml`.
- **HTTPS:** `https://app.carenet.com.bd/…` — `android:autoVerify="true"` requires a live **Digital Asset Links** file at `https://app.carenet.com.bd/.well-known/assetlinks.json` listing your signing cert SHA-256 and package `com.carenet.app`.
- JS handling: `registerAppUrlOpenListener` in `src/frontend/native/deepLinks.ts` and push tap → `router.navigate` via `notification.data.route` in `App.tsx`.

## Signing and Play Console

1. Create an **upload key** and enable **Play App Signing** in Google Play Console.
2. In Android Studio: **Build → Generate Signed App Bundle** (AAB) for release, or configure `signingConfigs` in `android/app/build.gradle` (do not commit keystore passwords).
3. Store listing assets (D008 §12.6): 512×512 PNG icon, 1024×500 feature graphic, short/full descriptions, privacy policy URL.
4. Complete **Data safety** and **Health** declarations as applicable.
5. Ship to **internal testing** first, then production.

## PWA (parallel track)

- `vite-plugin-pwa` generates the web manifest and service worker on `npm run build`.
- Install prompt is `registerType: 'prompt'`; users can add to home screen from the browser without the Play Store.

## Version bumps

- Increment `versionCode` / `versionName` in `android/app/build.gradle` for each Play upload.
- Optional later: Play In-App Updates API (D008 §12.5) and server-side minimum-version gate.
