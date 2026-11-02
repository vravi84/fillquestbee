import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, adminDb, isAdminSdkInitialized } from '@/lib/firebase/admin-sdk';
import { fetchPlatformStats, fetchAdminActivityLogs, fetchAllTeachers } from '@/lib/firebase/admin';

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
      const teachersSnap = await adminDb.collection('users').where('role', '==', 'teacher').get();
      const teachers = teachersSnap.docs.map((d) => d.data());

      const totalTeachers = teachers.length;
      const pendingTeachers = teachers.filter((t) => t.status === 'pending').length;
      const approvedTeachers = teachers.filter((t) => t.status === 'approved').length;
      const suspendedTeachers = teachers.filter((t) => t.status === 'suspended').length;
      const rejectedTeachers = teachers.filter((t) => t.status === 'rejected').length;

      const [examsCountSnap, attemptsCountSnap, aiCountSnap] = await Promise.all([
        adminDb.collection('exams').count().get(),
        adminDb.collection('attempts').count().get(),
        adminDb.collection('aiUsage').count().get(),
      ]);

      const totalExams = examsCountSnap.data().count;
      const studentAttempts = attemptsCountSnap.data().count;
      const totalAiRequests = aiCountSnap.data().count;

      let recentLogs: any[] = [];
      try {
        const logsSnap = await adminDb
          .collection('adminActivity')
          .orderBy('timestamp', 'desc')
          .limit(10)
          .get();
        recentLogs = logsSnap.docs.map((d) => d.data());
      } catch {
        const logsSnap = await adminDb.collection('adminActivity').limit(10).get();
        recentLogs = logsSnap.docs.map((d) => d.data());
        recentLogs.sort(
          (a: any, b: any) =>
            new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
        );
      }

      const pendingList = teachers.filter((t) => t.status === 'pending');

      return NextResponse.json({
        stats: {
          totalTeachers,
          pendingTeachers,
          approvedTeachers,
          suspendedTeachers,
          rejectedTeachers,
          totalExams,
          studentAttempts,
          totalAiRequests,
        },
        recentLogs,
        pendingList,
      });
    }

    // Fallback
    const stats = await fetchPlatformStats();
    const logs = await fetchAdminActivityLogs();
    const teachers = await fetchAllTeachers();
    const pendingList = teachers.filter((t) => t.status === 'pending');

    return NextResponse.json({
      stats: {
        ...stats,
        totalExams: 0,
        studentAttempts: 0,
      },
      recentLogs: logs.slice(0, 5),
      pendingList,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard stats.' },
      { status: 500 }
    );
  }
}
