# Quick start — build Supreme Admin APK

**A real installable APK is created by Expo EAS cloud build.** The source archive contains no compiled APK or server credentials.

1. Extract this folder. Install **Node.js 22.13+**. Open a terminal in `SupremeAdminMobile/`.
2. Open `src/config/env.js`, replace `API_BASE_URL` with your **backend's actual HTTPS base URL**. Keep all JWT, database, signup key and payment secrets on your backend, NOT in the app.
3. Run:

```bash
npm install
npm run check
npm run smoke
npx eas-cli@latest login
npm run build:android
```

4. Allow EAS to create/link your Expo project and its managed Android keystore. It builds an APK under the preconfigured `preview` profile.
5. Open the completed EAS download link on your Android phone, install the `.apk`, open **Supreme Admin**, sign in with your existing **admin-role** credentials. The installed APK does **not** need Expo Go.

**Try before building:** `npx expo start` opens development mode/Expo Go.

**Apple:** `npm run build:ios` requires Apple signing/Developer credentials and is intended for App Store Connect/TestFlight; iOS cannot install Android APKs.

**Need more details, backend deployment, or troubleshooting?** Read the full `README.md`.
