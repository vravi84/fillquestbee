import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, adminDb, isAdminSdkInitialized } from '@/lib/firebase/admin-sdk';
import { fetchTeacherById } from '@/lib/firebase/admin';
import { fetchTeacherExams, fetchExamAttempts } from '@/lib/firebase/services';

export async function GET(
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

    if (isAdminSdkInitialized && adminDb) {
      const docSnap = await adminDb.collection('users').doc(teacherId).get();
      if (!docSnap.exists) {
        return NextResponse.json({ error: 'Teacher not found.' }, { status: 404 });
      }
      const teacher = docSnap.data();

      // Fetch exams created by teacher
      const examsSnap = await adminDb.collection('exams').where('teacherId', '==', teacherId).get();
      const exams = examsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Fetch attempts across these exams
      let attempts: any[] = [];
      if (exams.length > 0) {
        const examIds = exams.map((e) => e.id);
        // Split in chunks of 10 for firestore in query
        for (let i = 0; i < examIds.length; i += 10) {
          const chunk = examIds.slice(i, i + 10);
          const attSnap = await adminDb.collection('attempts').where('examId', 'in', chunk).get();
          attempts = [...attempts, ...attSnap.docs.map((d) => ({ id: d.id, ...d.data() }))];
        }
      }

      return NextResponse.json({ teacher, exams, attempts });
    }

    // Fallback
    const teacher = await fetchTeacherById(teacherId);
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found.' }, { status: 404 });
    }
    const exams = await fetchTeacherExams(teacherId);
    let attempts: any[] = [];
    for (const e of exams) {
      const atts = await fetchExamAttempts(e.id);
      attempts = [...attempts, ...atts];
    }

    return NextResponse.json({ teacher, exams, attempts });
  } catch (error: any) {
    console.error('Error fetching teacher detail:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch teacher detail.' },
      { status: 500 }
    );
  }
}
