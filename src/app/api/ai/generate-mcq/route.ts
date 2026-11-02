import { NextRequest, NextResponse } from 'next/server';
import { generateMcqForBlank, generateMcqBatchForBlanks } from '@/lib/ai/generateOptions';
import { verifyTeacherApproval } from '@/lib/ai/verifyAuth';
import { logAiUsageServer } from '@/lib/firebase/admin-sdk';
import { generateId } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // 1. Authorization and teacher approval check
    const authResult = await verifyTeacherApproval(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || 'Your teacher account is not approved for AI features.' },
        { status: authResult.statusCode || 403 }
      );
    }

    const body = await req.json();
    const { sentence, blankWord, items, subject, className } = body;

    // Support batch MCQ generation in a single request to eliminate N+1 sequential calls
    if (Array.isArray(items) && items.length > 0) {
      const validItems = items.filter((it: any) => it && it.sentence && it.blankWord);
      if (validItems.length === 0) {
        return NextResponse.json(
          { error: 'Each batch item must include both sentence and blankWord.' },
          { status: 400 }
        );
      }

      const results = await generateMcqBatchForBlanks(validItems, subject, className);

      try {
        await logAiUsageServer({
          id: generateId('ai'),
          teacherId: authResult.userId || 'unknown',
          teacherName: authResult.userName || 'Teacher',
          operation: 'MCQ_GENERATION',
          timestamp: new Date().toISOString(),
          status: 'success',
          details: `Generated MCQ options for ${results.length} questions in batch`,
        });
      } catch (telemetryErr) {
        console.warn('[AI Usage Telemetry Non-Fatal Error]:', telemetryErr);
      }

      return NextResponse.json({ results });
    }

    if (!sentence || !blankWord) {
      return NextResponse.json(
        { error: 'Both sentence and blank word are required.' },
        { status: 400 }
      );
    }

    const mcqResult = await generateMcqForBlank(
      sentence,
      blankWord,
      subject,
      className
    );

    // 2. Log AI usage operation via Server Admin SDK (MCQ_GENERATION) non-fatally
    try {
      await logAiUsageServer({
        id: generateId('ai'),
        teacherId: authResult.userId || 'unknown',
        teacherName: authResult.userName || 'Teacher',
        operation: 'MCQ_GENERATION',
        timestamp: new Date().toISOString(),
        status: 'success',
        details: `Generated MCQ options for blank word`,
      });
    } catch (telemetryErr) {
      console.warn('[AI Usage Telemetry Non-Fatal Error]:', telemetryErr);
    }

    return NextResponse.json(mcqResult);
  } catch (error: any) {
    console.error('Error in generate-mcq API:', error);
    const errMessage = error?.message || String(error);

    if (errMessage.includes('429') || errMessage.includes('RESOURCE_EXHAUSTED') || errMessage.includes('prepayment credits')) {
      return NextResponse.json(
        { error: 'AI usage limit reached. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'AI service is temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}

