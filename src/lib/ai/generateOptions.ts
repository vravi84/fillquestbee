import { z } from 'zod';
import { McqOptionResult } from '@/types';
import { callGeminiApi, isGeminiConfigured } from './gemini';
import { shuffleArray } from '@/lib/utils';

// Zod Schema Validation for AI Response
export const McqResultSchema = z.object({
  questionText: z.string(),
  correctAnswer: z.string(),
  options: z.array(z.string()).min(4).max(4),
  explanation: z.string(),
});

/**
 * Smart domain dictionary fallback for generating plausible distractors when offline.
 */
const DOMAIN_DISTRACTORS: Record<string, string[]> = {
  // Units & Physics
  newton: ['Joule', 'Watt', 'Pascal', 'Volt', 'Tesla', 'Kelvin'],
  pascal: ['Newton', 'Joule', 'Watt', 'Bar', 'Atmosphere'],
  joule: ['Watt', 'Newton', 'Calorie', 'Volt', 'Ohm'],
  barometer: ['Thermometer', 'Speedometer', 'Anemometer', 'Voltmeter'],
  area: ['volume', 'mass', 'length', 'density', 'speed'],
  opposes: ['supports', 'accelerates', 'multiplies', 'doubles'],
  decreases: ['increases', 'doubles', 'remains constant', 'disappears'],
  attractive: ['repulsive', 'electrical', 'magnetic', 'nuclear'],
  charged: ['magnetic', 'heated', 'neutral', 'frozen'],
  speed: ['direction', 'mass', 'volume', 'temperature'],
  
  // Biology
  mitochondria: ['Ribosomes', 'Lysosomes', 'Chloroplasts', 'Nucleus'],
  chloroplasts: ['Mitochondria', 'Centrioles', 'Vacuoles', 'Ribosomes'],
  nucleus: ['Cytoplasm', 'Cell Membrane', 'Cell Wall', 'Vacuole'],
  photosynthesis: ['Respiration', 'Transpiration', 'Digestion', 'Excretion'],
  cell: ['Tissue', 'Organ', 'Organism', 'Molecule'],

  // Math & General Science
  gravity: ['Friction', 'Magnetism', 'Buoyancy', 'Tension'],
  solid: ['Liquid', 'Gas', 'Plasma', 'Vapor'],
  oxygen: ['Nitrogen', 'Carbon Dioxide', 'Hydrogen', 'Helium'],
};

function generateFallbackMcq(sentence: string, blankWord: string): McqOptionResult {
  const cleanBlank = blankWord.trim();
  const lowerBlank = cleanBlank.toLowerCase();

  // Create sentence with blank
  // Replace exact phrase with ______
  const regex = new RegExp(`\\b${escapeRegExp(cleanBlank)}\\b`, 'gi');
  let questionText = sentence.replace(regex, '______');
  if (!questionText.includes('______')) {
    questionText = sentence.replace(cleanBlank, '______');
  }

  // Find candidate distractors from dictionary or generate reasonable fallback
  let candidates: string[] = [];

  for (const [key, distList] of Object.entries(DOMAIN_DISTRACTORS)) {
    if (lowerBlank.includes(key) || key.includes(lowerBlank)) {
      candidates = distList;
      break;
    }
  }

  if (candidates.length < 3) {
    // Generic distractors matching capitalization style
    const isCapital = cleanBlank[0] === cleanBlank[0].toUpperCase();
    if (isCapital) {
      candidates = ['Standard Element', 'Primary Factor', 'Central System', 'Derived Property'];
    } else {
      candidates = ['secondary phase', 'inverse ratio', 'constant factor', 'external force'];
    }
  }

  // Pick top 3 non-duplicate distractors
  const distractors = candidates
    .filter((d) => d.toLowerCase() !== lowerBlank)
    .slice(0, 3);

  const options = shuffleArray([cleanBlank, ...distractors]);

  return {
    questionText,
    correctAnswer: cleanBlank,
    options,
    explanation: `The correct answer is "${cleanBlank}". This completes the statement accurately based on educational principles.`,
  };
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const McqBatchResultSchema = z.object({
  results: z.array(McqResultSchema),
});

function ensureFourDistinctOptions(
  options: string[],
  correctAnswer: string,
  sentence: string
): string[] {
  const unique: string[] = [correctAnswer];
  for (const opt of options) {
    const trimmed = (opt || '').trim();
    if (trimmed && !unique.some((u) => u.toLowerCase() === trimmed.toLowerCase())) {
      unique.push(trimmed);
    }
    if (unique.length === 4) break;
  }

  if (unique.length < 4) {
    const fallbackOpts = generateFallbackMcq(sentence, correctAnswer).options;
    for (const fb of fallbackOpts) {
      if (!unique.some((u) => u.toLowerCase() === fb.toLowerCase())) {
        unique.push(fb);
      }
      if (unique.length === 4) break;
    }
  }

  let padIdx = 1;
  while (unique.length < 4) {
    const candidate = `Alternative ${padIdx++}`;
    if (!unique.some((u) => u.toLowerCase() === candidate.toLowerCase())) {
      unique.push(candidate);
    }
  }

  return shuffleArray(unique.slice(0, 4));
}

export async function generateMcqForBlank(
  sentence: string,
  blankWord: string,
  subject?: string,
  className?: string
): Promise<McqOptionResult> {
  const cleanBlank = blankWord.trim();
  if (!cleanBlank) {
    throw new Error('Blank word must not be empty.');
  }

  if (!isGeminiConfigured()) {
    console.log('Gemini API key not found. Using local smart fallback generator for MCQ options.');
    return generateFallbackMcq(sentence, cleanBlank);
  }

  const prompt = `
You are an expert school exam teacher.
Sentence: "${sentence}"
Chosen Blank Word/Phrase: "${cleanBlank}"
Subject: ${subject || 'Science'}
Class Level: ${className || 'School Student'}

Your task:
1. Replace the chosen blank word/phrase in the sentence with "______" to form the question text.
2. The correct answer MUST BE EXACTLY: "${cleanBlank}".
3. Generate 3 plausible distractors (incorrect options) that belong to the SAME conceptual category (e.g. if answer is a unit, distractors must be units; if answer is an organelle, distractors must be organelles).
4. The final array of 4 options MUST include "${cleanBlank}" and the 3 distractors. Do not duplicate options.
5. Provide a friendly, 1-sentence explanation of why "${cleanBlank}" is the correct answer.

Output format MUST be valid JSON matching this schema:
{
  "questionText": "The SI unit of force is ______.",
  "correctAnswer": "${cleanBlank}",
  "options": ["${cleanBlank}", "Distractor1", "Distractor2", "Distractor3"],
  "explanation": "Newton is the SI unit of force."
}
`.trim();

  try {
    const rawJson = await callGeminiApi(prompt);
    const parsed = JSON.parse(rawJson);
    const validated = McqResultSchema.parse(parsed);

    validated.correctAnswer = cleanBlank;
    validated.options = ensureFourDistinctOptions(validated.options, cleanBlank, sentence);

    return validated;
  } catch (err) {
    console.warn('Gemini MCQ generation failed or produced invalid JSON, using fallback:', err);
    return generateFallbackMcq(sentence, cleanBlank);
  }
}

export async function generateMcqBatchForBlanks(
  items: Array<{ sentence: string; blankWord: string; sentenceWithBlank?: string }>,
  subject?: string,
  className?: string
): Promise<McqOptionResult[]> {
  if (!items || items.length === 0) {
    return [];
  }

  if (items.length === 1) {
    const single = await generateMcqForBlank(
      items[0].sentence,
      items[0].blankWord,
      subject,
      className
    );
    return [single];
  }

  if (!isGeminiConfigured()) {
    return items.map((item) => generateFallbackMcq(item.sentence, item.blankWord.trim()));
  }

  const numberedItems = items
    .map(
      (item, idx) =>
        `${idx + 1}. Sentence: "${item.sentence}" | Blank Word/Phrase: "${item.blankWord.trim()}"`
    )
    .join('\n');

  const prompt = `
You are an expert school exam teacher.
Subject: ${subject || 'Science'}
Class Level: ${className || 'School Student'}

Generate multiple-choice options for each of the following ${items.length} fill-in-the-blank items:
${numberedItems}

For EACH item (preserving exact order 1 to ${items.length}):
1. Replace the chosen blank word/phrase in the sentence with "______" to form "questionText".
2. "correctAnswer" MUST BE EXACTLY the item's Blank Word/Phrase.
3. Generate 3 plausible distractors belonging to the same conceptual category.
4. "options" MUST contain 4 distinct strings: the exact "correctAnswer" and 3 distractors.
5. Provide a friendly 1-sentence "explanation" of why "correctAnswer" is correct.

Output format MUST be valid JSON matching this schema:
{
  "results": [
    {
      "questionText": "The SI unit of force is ______.",
      "correctAnswer": "Newton",
      "options": ["Newton", "Distractor1", "Distractor2", "Distractor3"],
      "explanation": "Newton is the SI unit of force."
    }
  ]
}
`.trim();

  try {
    const rawJson = await callGeminiApi(prompt);
    const parsed = JSON.parse(rawJson);
    const rawList: any[] = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.results) ? parsed.results : [];

    if (rawList.length === 0) {
      throw new Error('Batch Gemini response did not contain a valid results array.');
    }

    return items.map((item, idx) => {
      const cleanBlank = item.blankWord.trim();
      const candidate = rawList[idx];
      if (candidate && typeof candidate === 'object') {
        try {
          const validated = McqResultSchema.parse(candidate);
          return {
            questionText: item.sentenceWithBlank || validated.questionText,
            correctAnswer: cleanBlank,
            options: ensureFourDistinctOptions(validated.options, cleanBlank, item.sentence),
            explanation: validated.explanation,
          };
        } catch {
          return generateFallbackMcq(item.sentence, cleanBlank);
        }
      }
      return generateFallbackMcq(item.sentence, cleanBlank);
    });
  } catch (err) {
    console.warn('Gemini batch MCQ generation failed, falling back to local smart generator:', err);
    return items.map((item) => generateFallbackMcq(item.sentence, item.blankWord.trim()));
  }
}
