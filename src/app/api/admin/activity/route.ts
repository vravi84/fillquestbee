import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, adminDb, isAdminSdkInitialized } from '@/lib/firebase/admin-sdk';
import { fetchAdminActivityLogs } from '@/lib/firebase/admin';

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
      const snapshot = await adminDb.collection('adminActivity').get();
      const logs = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      logs.sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      return NextResponse.json({ logs });
    }

    const logs = await fetchAdminActivityLogs();
    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Error fetching admin activity logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin activity logs.' },
      { status: 500 }
    );
  }
}
