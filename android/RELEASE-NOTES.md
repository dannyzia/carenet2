# CareNet — release notes

## Android 1.0.0 (versionCode 2)

**Release date:** _(set when you publish)_  

### Summary

First Play Store release of the CareNet Android app. The app wraps the CareNet web experience in a native shell with deep links, push notification hooks, and device integrations (camera, location, storage, and more) where you grant permissions.

### What’s included

- **Accounts & roles:** Sign in and use CareNet as guardian, caregiver, agency, patient, moderator, or admin—according to your account.
- **Care coordination:** Search and book care, view schedules and placements, and keep key information in one place.
- **Messaging & notifications:** In-app messaging; device notifications when configured (FCM requires `google-services.json` on the device build).
- **Payments & wallet:** Access billing and wallet flows where enabled for your region and account.
- **Offline-aware web layer:** The app ships the production web bundle; connectivity is required for most live data and auth.

### Notes for testers and users

- Use the **latest** build from the Play track you were invited to.
- If push notifications do not appear, check system notification settings and that the release was built with Firebase configuration for your package name.

### Known limitations

- Some features depend on **backend availability**, **account verification**, and **region**.
- Emergency care: CareNet is **not** a substitute for calling your local emergency number.

---

### Short “What’s new” (Play Console — keep under ~500 characters per locale if the form limits you)

```
CareNet 1.0.0 — first Android release.

• Native app for guardians, caregivers, agencies, and families
• Book and coordinate care, messaging, schedules, and billing where available
• Deep links (carenet://) and optional push notifications
• Camera, location, and file access when you allow permissions

We’ll keep improving stability and performance—thank you for installing CareNet.
```

Character count (for reference): ~320 characters.

---

### Internal / Git tag message (optional)

```
CareNet Android v1.0.0 (versionCode 2)

Initial Play release: Capacitor 8, minSdk 24, targetSdk 34, signed AAB pipeline.
See android/PLAY-STORE-RELEASE.md for build and signing.
```
