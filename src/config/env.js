/**
 * SINGLE USER-CONFIGURABLE FILE
 * Change API_BASE_URL to your deployed SFL BACKEND's root HTTPS URL.
 * Examples: https://your-backend.vercel.app
 * DO NOT include /api/admin and DO NOT paste JWT_SECRET, MONGO_URI,
 * ADMIN_SIGNUP_KEY, Resend, Paynow, Cloudinary or Meta secrets here.
 * Those belong only in the server environment, never in a mobile app.
 *
 * For an Android emulator talking to your laptop: http://10.0.2.2:8000
 * For a real phone on Wi-Fi: http://YOUR_LAN_IP:8000 (development only)
 * For an installable production app use HTTPS.
 */
export const ENV = {
  API_BASE_URL: 'https://api.supremeleague.app/',
  REQUEST_TIMEOUT_MS: 30000,
};
