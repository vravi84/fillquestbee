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

  // Handle local demo admin account for development fallback only
  if (
    process.env.NODE_ENV === 'development' &&
    (token === 'admin_demo_token' || customUserId === 'admin_demo_1')
  ) {
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

    const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL || process.env.NEXT_PUBLIC_INITIAL_ADMIN_EMAIL || 'sciencevid4u@gmail.com';
    const isInitialAdmin = decodedToken.email && (
      decodedToken.email.toLowerCase() === 'sciencevid4u@gmail.com' ||
      decodedToken.email.toLowerCase() === 'admin@school.edu' ||
      decodedToken.email.toLowerCase() === initialAdminEmail.toLowerCase()
    );

    let isAuthorizedAdmin = isInitialAdmin || decodedToken.admin === true || decodedToken.role === 'admin';

    if (!isAuthorizedAdmin && adminDb) {
      try {
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists && userDoc.data()?.role === 'admin') {
          isAuthorizedAdmin = true;
        }
      } catch (e) {
        console.warn('Could not check Firestore user doc in verifyAdminToken:', e);
      }
    }

    if (!isAuthorizedAdmin) {
      return {
        authorized: false,
        error: 'Forbidden: Account does not possess administrator privileges.',
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

/**
 * Server-side AI Usage logging using Firebase Admin SDK.
 * Bypasses client Firestore rules safely and catches any telemetry errors non-fatally.
 */
export async function logAiUsageServer(log: {
  id: string;
  teacherId: string;
  teacherName: string;
  operation: string;
  timestamp: string;
  status: string;
  details?: string;
}): Promise<void> {
  if (isAdminSdkInitialized && adminDb) {
    try {
      await adminDb.collection('aiUsage').doc(log.id).set({
        ...log,
        serverTimestamp: new Date().toISOString(),
      });
      console.log(`[AI Usage Telemetry] Recorded ${log.operation} for teacher ${log.teacherId}`);
    } catch (err) {
      console.warn('[AI Usage Telemetry Warning] Non-fatal Firestore write error:', err);
    }
  } else {
    console.warn('[AI Usage Telemetry Warning] Firebase Admin SDK not initialized; telemetry skipped.');
  }
}
