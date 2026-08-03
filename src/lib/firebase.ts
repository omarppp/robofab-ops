import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Next.js only inlines NEXT_PUBLIC_* vars when referenced as a static
// `process.env.NEXT_PUBLIC_X` member expression — looping over a list of
// names and reading `process.env[name]` would silently resolve to
// `undefined` in the browser bundle, so every var is named explicitly here.
const requiredEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY:             process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID:          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID:              process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const missingEnvVars = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  throw new Error(
    [
      'Firebase configuration is missing required environment variables:',
      ...missingEnvVars.map(key => `  - ${key}`),
      '',
      'Create a ".env.local" file in the project root (copy ".env.example" and fill in your',
      'Firebase project config — see README.md "Environment Setup"), then restart the dev server.',
    ].join('\n')
  );
}

const firebaseConfig = {
  apiKey:            requiredEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        requiredEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         requiredEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     requiredEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: requiredEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             requiredEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:     requiredEnv.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

// Analytics must only run on the client — never import firebase/analytics at module level.
export async function initAnalytics() {
  if (typeof window === 'undefined') return null;
  try {
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    if (await isSupported()) return getAnalytics(app);
  } catch {
    // Analytics not available in this environment
  }
  return null;
}

export default app;
