import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, adminDb, isAdminSdkInitialized } from '@/lib/firebase/admin-sdk';
import { fetchAllTeachers } from '@/lib/firebase/admin';
import { fetchTeacherExams } from '@/lib/firebase/services';

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
      const dbRef = adminDb;
      const snapshot = await dbRef.collection('exams').get();
      const exams = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const examData = docSnap.data();
          const examId = docSnap.id;
          let attemptCount = examData.attemptCount || 0;
          try {
            const countSnap = await dbRef
              .collection('attempts')
              .where('examId', '==', examId)
              .count()
              .get();
            attemptCount = countSnap.data().count;
          } catch {
            // Keep existing attemptCount fallback
          }
          return { id: examId, ...examData, attemptCount };
        })
      );
      exams.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return NextResponse.json({ exams });
    }

    // Fallback
    const teachers = await fetchAllTeachers();
    let allExams: any[] = [];
    for (const t of teachers) {
      const list = await fetchTeacherExams(t.uid);
      allExams = [...allExams, ...list];
    }
    return NextResponse.json({ exams: allExams });
  } catch (error: any) {
    console.error('Error fetching admin exams:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch platform exams.' },
      { status: 500 }
    );
  }
}
