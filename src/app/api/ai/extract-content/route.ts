import { NextRequest, NextResponse } from 'next/server';
import { extractSentencesFromContent } from '@/lib/ai/extractContent';
import { verifyTeacherApproval } from '@/lib/ai/verifyAuth';
import { logAiUsage } from '@/lib/firebase/admin';
import { generateId } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Requirement 13 & 14: Server-side authentication and status check
    const authResult = await verifyTeacherApproval(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || 'Access Denied: Teacher approval required.' },
        { status: authResult.statusCode || 403 }
      );
    }

    const body = await req.json();
    const { text, imageBase64, mimeType, questionCount = 10 } = body;

    // Requirement 14: Input validation & content size limit
    if (text && text.length > 20000) {
      return NextResponse.json(
        { error: 'Content size exceeds the maximum limit of 20,000 characters.' },
        { status: 400 }
      );
    }

    if (imageBase64) {
      // Approximate Base64 size check (Base64 is ~1.33x original file size)
      const approxBytes = Math.round((imageBase64.length * 3) / 4);
      const isPdf = mimeType === 'application/pdf';
      const maxAllowedBytes = isPdf ? 10 * 1024 * 1024 : 7 * 1024 * 1024; // 10MB for PDF, 7MB for image

      if (approxBytes > maxAllowedBytes) {
        const maxMb = isPdf ? '10MB' : '7MB';
        return NextResponse.json(
          { error: `The uploaded ${isPdf ? 'PDF' : 'image'} exceeds the maximum allowed file size of ${maxMb}. Please select a smaller file.` },
          { status: 413 }
        );
      }
    }

    if (!text && !imageBase64) {
      return NextResponse.json(
        { error: 'Please provide either text content or an image/document upload.' },
        { status: 400 }
      );
    }

    const targetCount = Math.min(Math.max(Number(questionCount) || 10, 1), 15);

    const sentences = await extractSentencesFromContent(
      text,
      imageBase64,
      mimeType,
      targetCount
    );

    // Requirement 15: Log AI usage in Firestore
    await logAiUsage({
      id: generateId('ai'),
      teacherId: authResult.userId || 'unknown',
      teacherName: authResult.userName || 'Teacher',
      operation: 'extract_content',
      timestamp: new Date().toISOString(),
      status: 'success',
      details: `Extracted ${sentences.length} sentences`,
    });

    return NextResponse.json({ sentences, count: sentences.length });
  } catch (error: any) {
    console.error('Error in extract-content API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract content sentences.' },
      { status: 500 }
    );
  }
}

