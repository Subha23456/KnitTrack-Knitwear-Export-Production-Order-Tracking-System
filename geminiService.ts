import { GoogleGenAI, Type } from '@google/genai';
import { ruleBasedTamilAnalysis } from '../utils/tamilDictionary.ts';
import type { TamilNoteAnalysisResult } from '../types.ts';

let genAI: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAI;
}

/**
 * Analyzes Tamil or English supervisor production notes using Gemini 3.8 Flash.
 * Categorizes root cause, translates to clear English, scores confidence, and suggests mitigation.
 * Falls back to intelligent deterministic Tamil NLP if API key is missing or model errors.
 */
export async function analyzeTamilNote(
  noteText: string,
  stage: string,
  unit: string
): Promise<TamilNoteAnalysisResult> {
  const cleanNote = (noteText || '').trim();
  if (!cleanNote) {
    return {
      originalNoteTamil: '',
      englishTranslation: 'No note provided. Regular production logged.',
      category: 'Normal Production / General Note',
      severity: 'low',
      confidenceScore: 1.0,
      isAmbiguous: false,
      recommendedMitigation: 'Standard shift inspection.',
    };
  }

  const ai = getGeminiClient();

  if (!ai) {
    console.log('[GeminiService] No GEMINI_API_KEY detected. Employing domain-specific Tamil NLP engine.');
    const fallback = ruleBasedTamilAnalysis(cleanNote);
    return {
      originalNoteTamil: cleanNote,
      englishTranslation: fallback.translation,
      category: fallback.category,
      severity: fallback.severity,
      confidenceScore: fallback.confidenceScore,
      isAmbiguous: fallback.confidenceScore < 0.8,
      recommendedMitigation: fallback.mitigation,
    };
  }

  try {
    const prompt = `You are an AI production intelligence system for a knitwear garment exporter in Tiruppur, India.
A floor supervisor submitted a shift update in Tamil (or conversational Tamil-English slang).

Floor Context:
- Production Stage: "${stage}"
- Factory Unit: "${unit}"
- Supervisor Note: "${cleanNote}"

Tasks:
1. Translate the Tamil/Tamil-English note into professional English suitable for apparel merchandisers and overseas buyers.
2. Classify the root cause into EXACTLY ONE of the following valid categories:
   - "Yarn & Fabric Delay"
   - "Machine Breakdown"
   - "Needle Breakage / QC Alert"
   - "Printing Screen / Strike-off Defect"
   - "Subcontract Processor Delay"
   - "Absenteeism / Power Outage"
   - "Trims & Accessories Shortage"
   - "Normal Production / General Note"
3. Assess the production risk severity ("low", "medium", "high", "critical").
4. Provide a confidence score between 0.0 and 1.0. If the note is vague, unclear, or conflicting, lower the confidence score (< 0.75) and mark isAmbiguous as true.
5. Provide a practical 1-sentence factory mitigation action.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            englishTranslation: {
              type: Type.STRING,
              description: 'Clear English translation and summary of the note.',
            },
            category: {
              type: Type.STRING,
              description: 'One of the standardized root cause categories.',
            },
            severity: {
              type: Type.STRING,
              description: 'Risk severity: low, medium, high, or critical.',
            },
            confidenceScore: {
              type: Type.NUMBER,
              description: 'Model confidence score between 0.0 and 1.0.',
            },
            isAmbiguous: {
              type: Type.BOOLEAN,
              description: 'True if note is unclear or ambiguous.',
            },
            recommendedMitigation: {
              type: Type.STRING,
              description: 'Immediate corrective action for the floor supervisor.',
            },
          },
          required: [
            'englishTranslation',
            'category',
            'severity',
            'confidenceScore',
            'isAmbiguous',
            'recommendedMitigation',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    // Valid category sanity check
    const validCategories = [
      'Yarn & Fabric Delay',
      'Machine Breakdown',
      'Needle Breakage / QC Alert',
      'Printing Screen / Strike-off Defect',
      'Subcontract Processor Delay',
      'Absenteeism / Power Outage',
      'Trims & Accessories Shortage',
      'Normal Production / General Note',
    ] as const;

    const matchedCategory = validCategories.find(
      (c) => c.toLowerCase() === (parsed.category || '').toLowerCase()
    ) || 'Normal Production / General Note';

    return {
      originalNoteTamil: cleanNote,
      englishTranslation: parsed.englishTranslation || cleanNote,
      category: matchedCategory,
      severity: ['low', 'medium', 'high', 'critical'].includes(parsed.severity)
        ? parsed.severity
        : 'medium',
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.88,
      isAmbiguous: Boolean(parsed.isAmbiguous),
      recommendedMitigation: parsed.recommendedMitigation || 'Verify shift output during morning line inspection.',
    };
  } catch (err) {
    console.warn('[GeminiService] Gemini API call encountered error, using rule-based fallback:', err);
    const fallback = ruleBasedTamilAnalysis(cleanNote);
    return {
      originalNoteTamil: cleanNote,
      englishTranslation: fallback.translation,
      category: fallback.category,
      severity: fallback.severity,
      confidenceScore: fallback.confidenceScore,
      isAmbiguous: true,
      recommendedMitigation: fallback.mitigation,
    };
  }
}
