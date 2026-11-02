import { NextRequest, NextResponse } from 'next/server';
import { callGeminiApi, isGeminiConfigured, getGeminiApiKey, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { verifyTeacherApproval } from '@/lib/ai/verifyAuth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Protect endpoint: require authenticated teacher or admin
    const authResult = await verifyTeacherApproval(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || 'Access Denied: Admin or teacher approval required.' },
        { status: authResult.statusCode || 403 }
      );
    }

    const keyConfigured = isGeminiConfigured();
    const key = getGeminiApiKey();

    if (!keyConfigured) {
      return NextResponse.json({
        configured: false,
        apiReachable: false,
        responseReceived: false,
        model: DEFAULT_GEMINI_MODEL,
        keySource: key ? 'Invalid or placeholder key' : 'Missing environment variable GEMINI_API_KEY',
      });
    }

    try {
      const pingResponse = await callGeminiApi('Reply with valid JSON: {"status": "GEMINI_OK"}');
      const cleanPing = (pingResponse || '').trim();
      const isOk = cleanPing.toUpperCase().includes('GEMINI_OK');

      return NextResponse.json({
        configured: true,
        apiReachable: true,
        responseReceived: isOk,
        model: DEFAULT_GEMINI_MODEL,
        pingOutput: cleanPing,
      });
    } catch (apiErr: any) {
      const sanitizedError = (apiErr?.message || String(apiErr))
        .replace(/key=[a-zA-Z0-9_-]+/g, 'key=[REDACTED]')
        .replace(/AIza[a-zA-Z0-9_-]+/g, '[REDACTED]');

      return NextResponse.json({
        configured: true,
        apiReachable: false,
        errorType: 'GEMINI_API_FAILURE',
        errorMessage: sanitizedError,
        model: DEFAULT_GEMINI_MODEL,
      });
    }
  } catch (err: any) {
    return NextResponse.json(
      {
        configured: false,
        apiReachable: false,
        errorType: 'SERVER_INTERNAL_ERROR',
        errorMessage: err?.message || 'Failed to execute diagnostic ping',
      },
      { status: 500 }
    );
  }
}
