import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, adminDb, isAdminSdkInitialized } from '@/lib/firebase/admin-sdk';
import { updateTeacherStatus } from '@/lib/firebase/admin';
import { generateId } from '@/lib/utils';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  try {
    const authResult = await verifyAdminToken(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || 'Access Denied: Administrator privileges required.' },
        { status: authResult.statusCode || 403 }
      );
    }

    const { teacherId } = await params;
    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required.' }, { status: 400 });
    }

    const adminUid = authResult.uid || 'admin';
    const adminEmail = authResult.email || 'Admin';

    if (isAdminSdkInitialized && adminDb) {
      const userRef = adminDb.collection('users').doc(teacherId);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        return NextResponse.json({ error: 'Teacher profile not found.' }, { status: 404 });
      }

      const teacherData = userSnap.data();
      const teacherName = teacherData?.name || 'Teacher';

      await userRef.update({
        status: 'suspended',
        updatedAt: new Date().toISOString(),
      });

      const logId = generateId('act');
      await adminDb.collection('adminActivity').doc(logId).set({
        id: logId,
        adminId: adminUid,
        adminName: adminEmail,
        action: 'teacher_suspended',
        targetTeacherId: teacherId,
        targetTeacherName: teacherName,
        timestamp: new Date().toISOString(),
        metadata: { newStatus: 'suspended' },
      });

      return NextResponse.json({ success: true, status: 'suspended' });
    }

    await updateTeacherStatus(teacherId, 'suspended', adminUid, adminEmail);
    return NextResponse.json({ success: true, status: 'suspended' });
  } catch (error: any) {
    console.error('Error suspending teacher:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to suspend teacher.' },
      { status: 500 }
    );
  }
}
