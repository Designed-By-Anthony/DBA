import { getApps, initializeApp, applicationDefault, getApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin once per cold start using Application Default Credentials.
// On Firebase App Hosting, the runtime service account provides ADC automatically —
// no JSON key file needed. The SA must have `roles/datastore.user` on the project.
if (!getApps().length) {
  initializeApp({ credential: applicationDefault() });
}

export const db = getFirestore(getApp(), 'lighthouse');
export { Timestamp, FieldValue };

export const REPORTS_COLLECTION = 'audit_reports';
