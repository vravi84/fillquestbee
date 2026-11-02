import { GoogleGenAI } from '@google/genai';

/**
 * Centralized Gemini model configuration.
 * Configured via server-side process.env.GEMINI_MODEL with a sensible supported default ('gemini-2.5-flash').
 */
const envModel = process.env.GEMINI_MODEL;
export const DEFAULT_GEMINI_MODEL =
  envModel && envModel !== 'gemini-3.5-flash' ? envModel : 'gemini-2.5-flash';

/**
 * Feature flag for file extraction (PDF / Image / DOCX).
 * Defaults to false for initial low-cost / text-only production workflow.
 */
export const AI_FILE_EXTRACTION_ENABLED = process.env.AI_FILE_EXTRACTION_ENABLED === 'true';

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

let cachedKey: string | null = null;
let aiClient: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI | null {
  const key = getGeminiApiKey();
  if (key && key.length > 5 && key !== 'YOUR_GEMINI_API_KEY') {
    try {
      if (!aiClient || cachedKey !== key) {
        cachedKey = key;
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
  const primaryModel = DEFAULT_GEMINI_MODEL;
  const candidateModels = Array.from(new Set([primaryModel, 'gemini-2.0-flash', 'gemini-flash-latest']));

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


