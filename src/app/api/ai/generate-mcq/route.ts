import { NextRequest, NextResponse } from 'next/server';
import { generateMcqForBlank } from '@/lib/ai/generateOptions';
import { verifyTeacherApproval } from '@/lib/ai/verifyAuth';
import { logAiUsage } from '@/lib/firebase/admin';
import { generateId } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Requirement 13 & 14: Server-side authorization and status check
    const authResult = await verifyTeacherApproval(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || 'Access Denied: Teacher approval required.' },
        { status: authResult.statusCode || 403 }
      );
    }

    const body = await req.json();
    const { sentence, blankWord, subject, className } = body;

    if (!sentence || !blankWord) {
      return NextResponse.json(
        { error: 'Both sentence and blankWord are required.' },
        { status: 400 }
      );
    }

    const mcqResult = await generateMcqForBlank(
      sentence,
      blankWord,
      subject,
      className
    );

    // Requirement 15: Log AI usage in Firestore
    await logAiUsage({
      id: generateId('ai'),
      teacherId: authResult.userId || 'unknown',
      teacherName: authResult.userName || 'Teacher',
      operation: 'generate_mcq',
      timestamp: new Date().toISOString(),
      status: 'success',
      details: `Generated options for "${blankWord}"`,
    });

    return NextResponse.json(mcqResult);
  } catch (error: any) {
    console.error('Error in generate-mcq API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate MCQ options.' },
      { status: 500 }
    );
  }
}
