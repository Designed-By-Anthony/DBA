import * as admin from 'firebase-admin';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let _initialized = false;

if (!admin.apps.length) {
  try {
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'dba-website-prod' });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, ''),
        }),
      });
    }
    if (admin.apps.length) {
      _initialized = true;
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.stack : String(error);
    console.error('Firebase admin initialization error', msg);
  }
} else {
  _initialized = true;
}

const FIRESTORE_DB_ID = process.env.FIRESTORE_DATABASE_ID || 'dba-studio';

let _db: Firestore | null = null;

function initDb(): Firestore {
  if (!_db) {
    if (!_initialized) {
      throw new Error('Firebase Admin SDK not initialized — check credentials env vars');
    }
    _db = getFirestore(FIRESTORE_DB_ID);
    try { _db.settings({ ignoreUndefinedProperties: true }); } catch { /* hot reload */ }
  }
  return _db;
}

/** Lazy Firestore accessor — safe to import at build time; throws at call time if unconfigured. */
export const db: Firestore = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    return Reflect.get(initDb(), prop, receiver);
  },
});
