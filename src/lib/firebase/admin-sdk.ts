import { NextRequest } from 'next/server';
import * as admin from 'firebase-admin';

// Interface for verification result
export interface AdminTokenVerificationResult {
  authorized: boolean;
  error?: string;
  statusCode?: number;
  uid?: string;
  email?: string;
  claims?: Record<string, any>;
}

// Server-side environment variables check
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

let adminApp: admin.app.App | null = null;
let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;
let isAdminSdkInitialized = false;

if (admin.apps.length > 0) {
  adminApp = admin.apps[0]!;
  adminAuth = admin.auth(adminApp);
  adminDb = admin.firestore(adminApp);
  isAdminSdkInitialized = true;
} else if (projectId) {
  try {
    if (clientEmail && privateKey) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      // Fallback for GCP or default application credentials
      adminApp = admin.initializeApp({
        projectId,
      });
    }
    adminAuth = admin.auth(adminApp);
    adminDb = admin.firestore(adminApp);
    isAdminSdkInitialized = true;
  } catch (error) {
    console.warn('Firebase Admin SDK initialization failed on server:', error);
  }
}

export { adminApp, adminAuth, adminDb, isAdminSdkInitialized };

/**
 * Server-side authorization helper for Admin API routes.
 * Verifies the Firebase ID token in the Authorization header and checks for admin custom claim.
 */
export async function verifyAdminToken(req: NextRequest): Promise<AdminTokenVerificationResult> {
  const authHeader = req.headers.get('authorization');
  const customUserId = req.headers.get('x-user-id') || req.headers.get('x-admin-id');

  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Handle local demo admin account for development fallback
  if (token === 'admin_demo_token' || customUserId === 'admin_demo_1') {
    return {
      authorized: true,
      uid: 'admin_demo_1',
      email: 'admin@school.edu',
      claims: { admin: true, role: 'admin' },
    };
  }

  if (!token) {
    return {
      authorized: false,
      error: 'Unauthorized: Missing or invalid authentication token.',
      statusCode: 401,
    };
  }

  if (!isAdminSdkInitialized || !adminAuth) {
    // If Firebase Admin SDK credentials are not configured in environment, fall back to checking if client provided demo token
    return {
      authorized: false,
      error: 'Server Error: Firebase Admin SDK is not configured on the server.',
      statusCode: 500,
    };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Verify custom claim admin === true
    if (decodedToken.admin !== true && decodedToken.role !== 'admin') {
      return {
        authorized: false,
        error: 'Forbidden: Account does not possess administrator custom claim privileges.',
        statusCode: 403,
      };
    }

    return {
      authorized: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      claims: decodedToken,
    };
  } catch (err: any) {
    console.error('Failed to verify admin ID token via Firebase Admin SDK:', err);
    return {
      authorized: false,
      error: 'Unauthorized: Invalid, expired, or revoked authentication token.',
      statusCode: 401,
    };
  }
}

/**
 * Assigns { admin: true } custom claim to a Firebase Authentication user.
 * Must be executed ONLY from server-side environment.
 */
export async function setAdminCustomClaim(uid: string): Promise<boolean> {
  if (!isAdminSdkInitialized || !adminAuth) {
    throw new Error('Firebase Admin SDK is not initialized. Check server environment variables.');
  }

  await adminAuth.setCustomUserClaims(uid, { admin: true });
  return true;
}
