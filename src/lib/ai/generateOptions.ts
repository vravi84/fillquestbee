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

    // Guarantee options are shuffled and include correct answer
    if (!validated.options.includes(validated.correctAnswer)) {
      validated.options[0] = validated.correctAnswer;
    }
    validated.options = shuffleArray(Array.from(new Set(validated.options)));

    return validated;
  } catch (err) {
    console.warn('Gemini MCQ generation failed or produced invalid JSON, using fallback:', err);
    return generateFallbackMcq(sentence, cleanBlank);
  }
}
