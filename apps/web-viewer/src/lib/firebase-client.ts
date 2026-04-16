import { initializeApp, getApps } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize AppCheck to block non-verified traffic
let appCheck;
if (typeof window !== "undefined") {
  // Only initialize on the client side
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "dummy_key_for_dev"),
      // Optional: automatically refresh the AppCheck token
      isTokenAutoRefreshEnabled: true
    });
    console.log("[Security] Real-time Firebase Perimeter hardened via AppCheck & reCAPTCHA v3");
  } catch (err) {
    console.error("[Security] AppCheck Initialization failure:", err);
  }
}

export { app, appCheck };
