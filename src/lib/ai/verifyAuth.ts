import { NextRequest } from 'next/server';
import { adminAuth, adminDb, isAdminSdkInitialized } from '@/lib/firebase/admin-sdk';
import { db, isFirebaseConfigured } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export interface AuthVerificationResult {
  authorized: boolean;
  error?: string;
  statusCode?: number;
  userId?: string;
  userName?: string;
  role?: string;
  status?: string;
}

/**
 * Server-side authorization guard for protected AI endpoints.
 * Verifies request authentication & ensures teacher is in 'approved' status.
 */
export async function verifyTeacherApproval(req: NextRequest): Promise<AuthVerificationResult> {
  const userId = req.headers.get('x-user-id') || req.headers.get('x-teacher-id');
  const authHeader = req.headers.get('authorization');

  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  let targetUid = '';

  // Handle local development demo accounts only in development mode
  if (
    process.env.NODE_ENV === 'development' &&
    (userId === 'teacher_demo_1' ||
      userId === 'admin_demo_1' ||
      token === 'teacher_demo_token' ||
      token === 'admin_demo_token')
  ) {
    return {
      authorized: true,
      userId: userId || 'teacher_demo_1',
      userName: userId === 'admin_demo_1' ? 'System Admin' : 'Prof. Sarah Jenkins',
      role: userId === 'admin_demo_1' ? 'admin' : 'teacher',
      status: userId === 'admin_demo_1' ? 'active' : 'approved',
    };
  }

  // Require Authorization Bearer token for non-demo requests
  if (!token) {
    return {
      authorized: false,
      error: 'Unauthorized: Authentication token required to access AI services.',
      statusCode: 401,
    };
  }

  // Verify ID token via Firebase Admin SDK; fail closed if Admin SDK is unavailable
  if (!isAdminSdkInitialized || !adminAuth) {
    return {
      authorized: false,
      error: 'Server Error: Firebase Admin SDK is not configured on the server.',
      statusCode: 500,
    };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    targetUid = decodedToken.uid;
  } catch (err) {
    console.warn('ID token verification failed in verifyTeacherApproval:', err);
    return {
      authorized: false,
      error: 'Unauthorized: Invalid or expired authentication token.',
      statusCode: 401,
    };
  }

  if (!targetUid) {
    return {
      authorized: false,
      error: 'Unauthorized: Authentication required to access AI services.',
      statusCode: 401,
    };
  }

  // Check user profile status via Admin SDK Firestore or Client SDK Firestore
  if (isAdminSdkInitialized && adminDb) {
    try {
      const docSnap = await adminDb.collection('users').doc(targetUid).get();
      if (!docSnap.exists) {
        return {
          authorized: false,
          error: 'Forbidden: Teacher profile not found.',
          statusCode: 403,
        };
      }

      const userData = docSnap.data();
      const role = userData?.role || 'teacher';
      const status = userData?.status || 'pending';
      const userName = userData?.name || 'Teacher';

      if (role !== 'teacher' && role !== 'admin') {
        return {
          authorized: false,
          error: 'Forbidden: Only teachers and administrators can request AI generation.',
          statusCode: 403,
        };
      }

      if (status === 'pending') {
        return {
          authorized: false,
          error: 'Access Denied: Your teacher account is pending administrator approval.',
          statusCode: 403,
        };
      }

      if (status === 'suspended') {
        return {
          authorized: false,
          error: 'Access Denied: Your teacher account has been suspended by the administrator.',
          statusCode: 403,
        };
      }

      if (status === 'rejected') {
        return {
          authorized: false,
          error: 'Access Denied: Your teacher registration was not approved.',
          statusCode: 403,
        };
      }

      return {
        authorized: true,
        userId: targetUid,
        userName,
        role,
        status,
      };
    } catch (err: any) {
      console.warn('Admin SDK Firestore profile check failed:', err);
    }
  }

  if (isFirebaseConfigured && db) {
    try {
      const userRef = doc(db, 'users', targetUid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return {
          authorized: false,
          error: 'Forbidden: Teacher profile not found.',
          statusCode: 403,
        };
      }

      const userData = userSnap.data();
      const role = userData.role || 'teacher';
      const status = userData.status || 'pending';
      const userName = userData.name || 'Teacher';

      if (role !== 'teacher' && role !== 'admin') {
        return {
          authorized: false,
          error: 'Forbidden: Only teachers and administrators can request AI generation.',
          statusCode: 403,
        };
      }

      if (status === 'pending') {
        return {
          authorized: false,
          error: 'Access Denied: Your teacher account is pending administrator approval.',
          statusCode: 403,
        };
      }

      if (status === 'suspended') {
        return {
          authorized: false,
          error: 'Access Denied: Your teacher account has been suspended by the administrator.',
          statusCode: 403,
        };
      }

      if (status === 'rejected') {
        return {
          authorized: false,
          error: 'Access Denied: Your teacher registration was not approved.',
          statusCode: 403,
        };
      }

      return {
        authorized: true,
        userId: targetUid,
        userName,
        role,
        status,
      };
    } catch (err: any) {
      console.warn('Client Firestore profile check warning:', err);
    }
  }

  // Fail closed when user profile status cannot be verified
  return {
    authorized: false,
    error: 'Service Unavailable: Unable to verify teacher approval status.',
    statusCode: 503,
  };
}
