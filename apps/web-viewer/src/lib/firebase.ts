import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize the Firebase Admin SDK if it hasn't been initialized yet.
if (!admin.apps.length) {
  try {
    // Method 0: Emulated Sandbox (No credentials required)
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'dba-website-prod' });
      console.log('[Firebase] Connected to local Firetore Emulator.');
    }
    // Method 1: Use service account JSON file (most reliable for local dev)
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } else {
      // Method 2: Use individual env vars
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, ''),
        }),
      });
    }
    console.log('[Firebase] Admin SDK initialized for project:', process.env.FIREBASE_PROJECT_ID || '(from credentials file)');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.stack : String(error);
    console.error('Firebase admin initialization error', msg);
  }
}

// Connect to the named 'dba-studio' database
const FIRESTORE_DB_ID = process.env.FIRESTORE_DATABASE_ID || 'dba-studio';
export const db = getFirestore(FIRESTORE_DB_ID);

try { 
  db.settings({ ignoreUndefinedProperties: true }); 
} catch { 
  // Next.js hot reload duplicate execution block handling
}
