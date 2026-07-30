import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

// Server-only. Never import this file from a client component.
//
// Requires a Firebase service account (Project Settings → Service Accounts
// → Generate new private key in the Firebase console). Set:
//   FIREBASE_ADMIN_PROJECT_ID
//   FIREBASE_ADMIN_CLIENT_EMAIL
//   FIREBASE_ADMIN_PRIVATE_KEY   (keep the \n escapes when pasting into .env)

function buildAdminApp(): App | null {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    // eslint-disable-next-line no-console
    console.warn(
      '[firebase-admin] Missing FIREBASE_ADMIN_* environment variables. ' +
      'Connection API routes will return a 500 until these are set.'
    );
    return null;
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

const adminApp = buildAdminApp();

export const adminDb: Firestore | null = adminApp ? getFirestore(adminApp) : null;
export const adminAuth: Auth | null = adminApp ? getAuth(adminApp) : null;

/** Verifies a Firebase ID token sent from the client. Throws if invalid/missing. */
export async function verifyRequestAuth(request: Request): Promise<{ uid: string }> {
  if (!adminAuth) {
    throw new Error('Server auth is not configured (missing FIREBASE_ADMIN_* env vars).');
  }
  const header = request.headers.get('authorization') || '';
  const idToken = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!idToken) {
    throw new Error('Missing Authorization: Bearer <idToken> header.');
  }
  const decoded = await adminAuth.verifyIdToken(idToken);
  return { uid: decoded.uid };
}
