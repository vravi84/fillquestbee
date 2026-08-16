import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, adminDb, isAdminSdkInitialized } from '@/lib/firebase/admin-sdk';
import { fetchAllTeachers } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAdminToken(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || 'Access Denied: Administrator privileges required.' },
        { status: authResult.statusCode || 403 }
      );
    }

    if (isAdminSdkInitialized && adminDb) {
      const snapshot = await adminDb.collection('users').where('role', '==', 'teacher').get();
      const teachers = snapshot.docs.map((docSnap) => docSnap.data());
      teachers.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return NextResponse.json({ teachers });
    }

    // Fallback to client mock helper if Admin SDK is not initialized
    const teachers = await fetchAllTeachers();
    return NextResponse.json({ teachers });
  } catch (error: any) {
    console.error('Error fetching admin teachers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch teachers.' },
      { status: 500 }
    );
  }
}
