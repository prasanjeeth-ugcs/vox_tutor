import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function adminApp() {
  const existing = getApps().find(a => a.name === 'admin');
  if (existing) return existing;
  return initializeApp(
    {
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
      }),
    },
    'admin'
  );
}

// Firebase Admin Auth — used for session cookie verification only
export const adminAuth = () => getAuth(adminApp());
