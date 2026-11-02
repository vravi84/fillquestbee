import { NextRequest, NextResponse } from 'next/server';
import { extractSentencesFromContent } from '@/lib/ai/extractContent';
import { verifyTeacherApproval } from '@/lib/ai/verifyAuth';
import { AI_FILE_EXTRACTION_ENABLED } from '@/lib/ai/gemini';
import { logAiUsageServer } from '@/lib/firebase/admin-sdk';
import { generateId } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate request & check teacher status (pending/rejected/suspended -> 403)
    const authResult = await verifyTeacherApproval(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || 'Your teacher account is not approved for AI features.' },
        { status: authResult.statusCode || 403 }
      );
    }

    const body = await req.json();
    const { text, imageBase64, mimeType, questionCount = 10 } = body;

    // 2. Reject file uploads if file extraction feature flag is disabled
    if (imageBase64 && !AI_FILE_EXTRACTION_ENABLED) {
      return NextResponse.json(
        { error: 'PDF and image uploads are currently disabled. Please provide text content.' },
        { status: 400 }
      );
    }

    // 3. Text Input Validation
    const trimmedText = (text || '').trim();
    if (!trimmedText && !imageBase64) {
      return NextResponse.json(
        { error: 'Please enter lesson text before processing.' },
        { status: 400 }
      );
    }

    if (trimmedText && trimmedText.length < 50 && !imageBase64) {
      return NextResponse.json(
        { error: 'Lesson text must be at least 50 characters long.' },
        { status: 400 }
      );
    }

    if (trimmedText && trimmedText.length > 20000) {
      return NextResponse.json(
        { error: 'Content size exceeds the maximum limit of 20,000 characters. Please shorten your text.' },
        { status: 400 }
      );
    }

    const targetCount = Math.min(Math.max(Number(questionCount) || 10, 1), 15);

    // Pass parameters (clearing base64 if feature flag is false)
    const activeBase64 = AI_FILE_EXTRACTION_ENABLED ? imageBase64 : undefined;
    const activeMimeType = AI_FILE_EXTRACTION_ENABLED ? mimeType : undefined;

    const sentences = await extractSentencesFromContent(
      trimmedText,
      activeBase64,
      activeMimeType,
      targetCount
    );

    // 4. Log AI usage operation via Server Admin SDK (TEXT_EXTRACTION) non-fatally
    try {
      await logAiUsageServer({
        id: generateId('ai'),
        teacherId: authResult.userId || 'unknown',
        teacherName: authResult.userName || 'Teacher',
        operation: 'TEXT_EXTRACTION',
        timestamp: new Date().toISOString(),
        status: 'success',
        details: `Extracted ${sentences.length} sentences from text (${trimmedText.length} chars)`,
      });
    } catch (telemetryErr) {
      console.warn('[AI Usage Telemetry Non-Fatal Error]:', telemetryErr);
    }

    return NextResponse.json({ sentences, count: sentences.length });
  } catch (error: any) {
    console.error('Error in extract-content API:', error);
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


