import { GoogleGenAI } from '@google/genai';

/**
 * Centralized Gemini model configuration.
 * Configured via server-side process.env.GEMINI_MODEL with a sensible supported default ('gemini-3.5-flash').
 */
export const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

/**
 * Safely resolves the server-side GEMINI_API_KEY at runtime.
 */
export function getGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY || '';
}

export function isGeminiConfigured(): boolean {
  const key = getGeminiApiKey();
  return Boolean(key && key.length > 5 && key !== 'YOUR_GEMINI_API_KEY');
}

let aiClient: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI | null {
  const key = getGeminiApiKey();
  if (key && key.length > 5 && key !== 'YOUR_GEMINI_API_KEY') {
    try {
      if (!aiClient) {
        aiClient = new GoogleGenAI({ apiKey: key });
      }
      return aiClient;
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
    }
  }
  return null;
}

export { aiClient };

/**
 * Helper to call Gemini model using the modern @google/genai SDK for text generation or multimodal vision/document queries.
 */
export async function callGeminiApi(prompt: string, imageBase64?: string, mimeType?: string): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const client = getAiClient();
  if (!client) {
    throw new Error('Failed to initialize GoogleGenAI client.');
  }

  // Active supported models in priority order (starting with centralized DEFAULT_GEMINI_MODEL)
  const primaryModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const candidateModels = Array.from(new Set([primaryModel, 'gemini-flash-latest']));

  let lastError = '';
  let isQuotaExhausted = false;

  // Build contents array for @google/genai SDK
  const contentsParts: Array<string | { inlineData: { mimeType: string; data: string } }> = [];

  if (imageBase64 && mimeType) {
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '').trim();
    contentsParts.push({
      inlineData: {
        mimeType,
        data: cleanBase64,
      },
    });
    console.log(`[Gemini Request] Processing multimodal content: mimeType=${mimeType}, base64Length=${cleanBase64.length}`);
  } else {
    console.log(`[Gemini Request] Processing text prompt: length=${prompt.length}`);
  }
  contentsParts.push(prompt);

  for (const modelName of candidateModels) {
    try {
      const response = await client.models.generateContent({
        model: modelName,
        contents: contentsParts,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '';
      if (rawText) {
        console.log(`[Gemini Success] Successfully generated response with model ${modelName}`);
        return rawText;
      }
      
      lastError = `Model ${modelName} returned empty text response.`;
    } catch (err: any) {
      const errStr = err?.message || String(err);
      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('prepayment credits')) {
        isQuotaExhausted = true;
      }
      lastError = `Model ${modelName} error: ${errStr}`;
      console.warn(`[Gemini Warning] Model ${modelName} call failed:`, lastError);
    }
  }

  if (isQuotaExhausted) {
    throw new Error('Gemini API quota or prepayment credits are depleted for this API key. Please check your billing/credits at Google AI Studio (https://aistudio.google.com) or configure a valid GEMINI_API_KEY in Secret Manager.');
  }

  throw new Error(`Gemini API call failed across candidate models: ${lastError}`);
}


