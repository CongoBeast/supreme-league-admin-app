# Supreme Admin — React Native mobile app

**Admin-only** native client for the provided Supreme Fantasy League web application, built with **React Native + Expo SDK 57**. It uses the **existing** `sfl-backend-main` server; this mobile project does **not** include, copy, or replace the server, database, payments infrastructure, or public/player frontend.

## Fastest route to a real Android APK

You need:
- A computer with **Node.js 22.13 or newer** and npm (`node --version`).
- An internet connection for dependency installation and Expo Application Services (EAS) cloud builds.
- A free [Expo account](https://expo.dev/signup), and your **running/deployed HTTPS backend**.
- A real administrator account on that backend (or the backend's `ADMIN_SIGNUP_KEY` to enrol one).

**1. Extract** `SupremeAdminMobile.zip` and open the extracted `SupremeAdminMobile` folder in VS Code or a terminal.

**2. Edit just one configuration file:** `src/config/env.js`.

```js
export const ENV = {
  API_BASE_URL: 'https://YOUR-ACTUAL-BACKEND-DOMAIN.vercel.app',
  REQUEST_TIMEOUT_MS: 30000,
};
```

The URL is the **backend base address** (where `/api/admin/session` exists), not your frontend website and not a full `/api/admin` route. Delete the placeholder and paste your actual backend domain. Use **HTTPS** for release builds. If you redeploy with a different URL, rebuild the APK (it is a bundled configuration, not a dynamically editable setting).

**3. Install and verify** in the app directory:

```bash
npm install
npm run check
npm run smoke
```

`npm run smoke` checks that your backend responds on `/api/admin/session`. HTTP **401** for the unauthenticated check is normal: this endpoint must refuse a user who has not logged in. If you haven't deployed the backend yet, skip `smoke` until you have.

**4. Sign into Expo** (once per computer):

```bash
npx eas-cli@latest login
```

**5. Produce the installable Android application:**

```bash
npm run build:android
```

On your first build, Expo may ask you to link/create an Expo project and generate a signing keystore. Say yes to the managed credentials unless you already have your own. If it asks to initialise Git for the app source, allow it; the archive intentionally does not contain a `.git` repository. The `preview` build profile in `eas.json` is configured to output an **`.apk`**, not an `.aab`. EAS executes the actual Android native build on its servers; you don't need Android Studio just to build this way.

**6. Install:** Open the completed EAS build URL on an Android phone, download the `.apk`, approve installation from that trusted source if Android requests it, and launch **Supreme Admin**. You can also use `adb install path/to/app.apk`. It is a standalone APK: Expo Go is **not** required on the installed phone.

> **Important:** An APK is not included with this source archive, because EAS build, account access, signing, Android toolchains and a networked native build have not been executed here. These steps generate one in your Expo account. A successful static check is not a guarantee of real-device correctness—test all critical admin flows against a staging server before authorising real financial actions.

## Preview instantly during development

```bash
npm install
npx expo start
```

Scan the QR code using Expo Go on a compatible phone, or open an Android/iOS simulator. The Expo Go client must support **SDK 57**. Run this command from the app folder, not the backend folder. Expo Go is convenient for visual checks; the `preview` APK is how you test the actual standalone app.

When developing against your local backend, `http://10.0.2.2:8000` points an **Android emulator** to your computer; for a physical device on the same Wi-Fi use your computer's LAN IP. Production Android builds require HTTPS and you may need to allow cleartext HTTP explicitly for local-only Android builds. The supported release path is a deployed HTTPS API.

## iOS

```bash
npm run build:ios
```

This config creates a production iOS build for App Store Connect/TestFlight workflows. **Apple Developer Program membership, signing credentials and Apple's distribution rules apply.** Android `.apk` files cannot install on iPhones. For internal iOS distribution, the `preview` profile already has internal distribution specified, but iOS requires provisioned devices / appropriate Apple signing. After your Apple configuration, you can run:

```bash
npx eas-cli@latest build -p ios --profile preview
```

## Exactly what is ported

The new native design follows the **admin-only** colors from `src/admin/admin.css` in your supplied web project: dark sidebar `#101828`, background `#f4f6fa`, surfaces `#ffffff`, text `#172033`, border `#e6eaf0`, primary blue `#0d6efd`. The tablet UI keeps the persistent sidebar; on phones the same sections are in the slide-out menu. Tables are rendered as native, touch-friendly records, not webview screenshots.

| Admin area | Native features |
|---|---|
| Sign in / enrolment | Admin login, cookie session verification, sign out, backend-protected admin enrolment with key |
| Dashboard | Users, active subscriptions, league KPIs, cash received/paid, recent transactions, operations status, Meta Ads, analytics |
| Leagues | Search/filter/paginate, league details, leaderboard, FPL score refresh, status changes, add/remove members, automatic retry/manual settlement with confirmation |
| Users | Search/filter/paginate, profile, wallet status and balances, FPL squad, subscriptions and league entries, financial history, status changes |
| User actions | Credit/debit wallet, performance bonus, end subscription, partial/full wallet refund (requires confirmation and an explanation) |
| WhatsApp outreach | Priority and contact filters, contact tracking, open WhatsApp, links to user details |
| Marketing | Draft campaigns, activate/pause, send batches, test admin emails, marketing metrics |
| Finances | Cash accounting, transaction filters, records and detail view, payout destination review, withdrawal processing/paid/rejected/cancelled |
| Support tickets | Search/filter, open ticket, view history, reply, change status and priority, closure record |

All admin requests are wired to the existing `/api/admin/...` endpoints and the login uses the backend's HttpOnly session cookie (`credentials: 'include'`). The server—not the phone—handles authorisation, business rules, database updates, payments, FPL sync, email and audits. This is deliberately **not** a customer-facing player app.

**Visual fidelity note:** This is a native, responsive *reconstruction* of the admin experience. It preserves the color tokens, hierarchy, content and operations, but React Native controls and small-screen layouts are not pixel-for-pixel HTML/Bootstrap copies. Production parity requires verification on your target phone(s) and server instance.

## Environment variables and security

**The only mobile environment file is `src/config/env.js`.** It is appropriate to paste a **public** backend URL there. Do **not** paste any server secrets into a mobile app: `MONGO_URI`, `JWT_SECRET`, `ADMIN_SIGNUP_KEY`, Meta tokens, Paynow integration keys, Cloudinary keys or Resend keys. Mobile application code can be decompiled; it cannot safely hold server-side secrets.

Your supplied backend repo, `sfl-backend-main.zip`, must be configured *separately* on the backend host. The backend's own deployment documentation lists required `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`/`CLIENT_ORIGINS`, and optional feature-specific environment variables. Set `ADMIN_SIGNUP_KEY` only on the server if you need to enrol a new admin. You type it into the protected enrolment screen at runtime; it is never hardcoded in the app. If you already have an admin account, just log in.

## Troubleshooting

| Symptom | What to do |
|---|---|
| App says configure backend URL | Replace `API_BASE_URL` in `src/config/env.js` and restart/rebuild |
| Backend smoke test gets a 401 | Expected without a session cookie; means endpoint exists |
| “Cannot reach backend” | Check HTTPS, deployment status, backend URL, actual device internet and server logs |
| Admin login refused | Confirm you have an account with `role: admin` and `status: active` on **this** backend |
| Login succeeded but session not retained | Check the `Set-Cookie` response, HTTPS, domain, cookie flags, and React Native's platform cookie jar; test an APK, not only Expo Go |
| Native build rejects package versions | Run `npx expo install --fix`, `npm run doctor`, then build again |
| EAS asks to configure the project | Accept linking an EAS project, or run `npx eas-cli@latest build:configure` once |
| Node version error | Upgrade to Node.js 22.13+ (SDK 57 requirement) |
| Android APK says 'App not installed' | Uninstall a previous package with a different signing key, or adjust `android.package` in `app.json` and rebuild |
| `npm install` cannot connect | Your local PC needs npm registry access; generated archive intentionally excludes huge platform node_modules |
| Need to change bundle ID | Update `android.package` and `ios.bundleIdentifier` in `app.json` *before your first distribution build* |

## Project layout

```text
SupremeAdminMobile/
  app.json                  Expo app identity, icon, Android/iOS settings
  eas.json                  EAS preview APK and store profiles
  package.json              Dependencies and build scripts
  index.js                  Native app entry point
  App.js                    Sign-in, responsive navigation, session handling
  assets/                   Reused brand icon assets
  src/config/env.js         <-- YOUR ONE MOBILE CONFIG FILE
  src/services/api.js       Cookie-authenticated backend API client
  src/components/UI.js      Mobile components and original admin color palette
  src/components/Analytics.js  Native charts and Meta Ads
  src/hooks/useApiData.js    Data loading and pull-to-refresh
  src/screens/              11 admin/auth screens
  scripts/verify.mjs        Static source checker
  scripts/smoke-test.mjs    Backend reachability check
```

The included source contains no customer/mobile-player routes. Do not remove backend admin role checks or confirmation gates to make the app easier to use.
