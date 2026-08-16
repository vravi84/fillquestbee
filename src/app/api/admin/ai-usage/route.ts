import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, adminDb, isAdminSdkInitialized } from '@/lib/firebase/admin-sdk';
import { fetchAiUsageLogs } from '@/lib/firebase/admin';

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
      const snapshot = await adminDb.collection('aiUsage').get();
      const aiLogs = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      aiLogs.sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      return NextResponse.json({ aiLogs });
    }

    const aiLogs = await fetchAiUsageLogs();
    return NextResponse.json({ aiLogs });
  } catch (error: any) {
    console.error('Error fetching AI usage logs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch AI usage logs.' },
      { status: 500 }
    );
  }
}
