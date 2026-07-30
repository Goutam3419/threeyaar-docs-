import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Firebase config is read entirely from environment variables.
// Never hardcode real values here or anywhere else in the codebase.
const rawConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missing = Object.entries(rawConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.warn(
    `[firebase] Missing environment variables: ${missing.join(', ')}. ` +
    `Set these in your deployment platform (e.g. Vercel Project Settings → ` +
    `Environment Variables) using the values from your Firebase project. ` +
    `Auth/Firestore/Storage calls will fail until they're set — but the ` +
    `rest of the app (landing page, etc.) still renders.`
  );
}

// Firebase's SDKs validate the shape of these values eagerly at
// initialization time (e.g. getAuth() throws `auth/invalid-api-key`
// immediately if apiKey is undefined). Next.js prerenders every page
// (including things like /_not-found) at build time, and this module is
// imported transitively via the root layout — so a missing env var would
// otherwise crash the *entire* production build, not just auth features.
// Safe placeholders let the build succeed; real auth still requires real
// env vars to actually work at runtime.
const firebaseConfig =
  missing.length > 0
    ? {
        apiKey: 'demo-api-key-not-configured',
        authDomain: 'demo.firebaseapp.com',
        projectId: 'demo-project',
        storageBucket: 'demo-project.appspot.com',
        messagingSenderId: '000000000000',
        appId: '1:000000000000:web:0000000000000000000000',
      }
    : rawConfig;

// Avoid re-initializing the app on hot reloads / multiple imports.
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig as Record<string, string>);

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

/** True once real Firebase env vars are configured — check before relying on auth/db/storage. */
export const isFirebaseConfigured = missing.length === 0;

export default app;

