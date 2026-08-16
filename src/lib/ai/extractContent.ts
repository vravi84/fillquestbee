import { ExtractedSentence } from '@/types';
import { callGeminiApi, isGeminiConfigured } from './gemini';
import { generateId } from '@/lib/utils';

/**
 * Fallback smart sentence extraction engine when offline or no API key.
 * Splits text into clear, factual educational statements.
 */

function fallbackSentenceExtractor(text: string, targetCount: number = 10): ExtractedSentence[] {
  if (!text || text.trim().length === 0) {
    return [
      { id: generateId('sent'), sentence: 'Force is a push or pull acting on an object.' },
      { id: generateId('sent'), sentence: 'The SI unit of force is Newton.' },
      { id: generateId('sent'), sentence: 'Pressure is defined as force applied per unit area.' },
      { id: generateId('sent'), sentence: 'Friction always opposes relative motion between surfaces.' },
      { id: generateId('sent'), sentence: 'Atmospheric pressure decreases as altitude increases.' },
      { id: generateId('sent'), sentence: 'Gravitational force is an attractive force between masses.' },
      { id: generateId('sent'), sentence: 'A barometer is used to measure atmospheric pressure.' },
      { id: generateId('sent'), sentence: 'The unit of pressure is Pascal.' },
      { id: generateId('sent'), sentence: 'Electrostatic force occurs between electrically charged bodies.' },
      { id: generateId('sent'), sentence: 'Force can change the direction and speed of an object.' },
    ];
  }

  // Clean and split text by punctuation (. ! ?)
  const rawSentences = text
    .replace(/[\r\n]+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 15 && s.length <= 250);

  // Deduplicate and filter non-educational noise
  const unique = Array.from(new Set(rawSentences)).filter(
    (s) => !/^(page|chapter|figure|table|section|exercise|q\d|ans|name:)/i.test(s)
  );

  const sentences = unique.slice(0, Math.min(targetCount, 15));

  return sentences.map((sentence) => ({
    id: generateId('sent'),
    sentence: sentence.endsWith('.') ? sentence : `${sentence}.`,
  }));
}

export async function extractSentencesFromContent(
  text?: string,
  imageBase64?: string,
  mimeType?: string,
  questionCount: number = 10
): Promise<ExtractedSentence[]> {
  const isMultimodal = Boolean(imageBase64 && mimeType);

  if (!isGeminiConfigured()) {
    if (isMultimodal) {
      throw new Error('AI service is not configured with GEMINI_API_KEY. Image/PDF extraction requires an active API key.');
    }
    console.log('Gemini API key not found. Operating in smart local fallback mode for text sentence extraction.');
    return fallbackSentenceExtractor(text || '', questionCount);
  }

  const prompt = `
You are an expert AI school teacher assistant. Analyze the provided educational lesson content (text/image/document).
Your task is to extract approximately ${questionCount} (between 10 and 15) high-quality, clear, factual educational sentences suitable for school fill-in-the-blank (CDF) exam questions.

Rules:
1. Extract exact factual or conceptual statements from the text/image/document.
2. Remove any fluff, page numbers, instructions, titles, or non-educational content.
3. Fix obvious OCR or formatting typos.
4. Keep each sentence independent, clear, and complete (10 to 30 words per sentence).
5. Output MUST be valid JSON with exact format:
{
  "sentences": [
    "The SI unit of force is Newton.",
    "Pressure is defined as force per unit area."
  ]
}
`.trim();

  try {
    const rawJson = await callGeminiApi(prompt, imageBase64, mimeType);
    // Parse JSON response safely
    const parsed = JSON.parse(rawJson);
    const list: string[] = Array.isArray(parsed?.sentences) ? parsed.sentences : [];

    if (list.length > 0) {
      return list.map((sentence) => ({
        id: generateId('sent'),
        sentence: sentence.trim(),
      }));
    }
    
    if (isMultimodal) {
      throw new Error('AI was unable to find legible educational sentences in the uploaded file. Please ensure the document/image contains readable text.');
    }
  } catch (err: any) {
    console.warn('Gemini sentence extraction call failed:', err?.message || err);
    if (isMultimodal) {
      throw new Error(err?.message || 'Failed to extract content from the uploaded image/PDF. Please try again with a clear document.');
    }
  }

  return fallbackSentenceExtractor(text || '', questionCount);
}
