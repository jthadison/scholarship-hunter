/**
 * Essay Adaptability Service
 * Story 4.8 - Essay Library & Adaptability Scoring
 *
 * Calculates adaptability scores and generates adaptation guidance for reusing essays
 */

import OpenAI from "openai";
import { createHash } from "crypto";

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  OPENAI_API_KEY not configured - adaptation guidance will use fallback mode');
    }
    openaiClient = new OpenAI({
      apiKey: apiKey || 'sk-fallback',
    });
  }
  return openaiClient;
}

/**
 * Adaptability score result with breakdown
 */
export interface AdaptabilityScore {
  score: number; // 0-100 percentage
  confidence: 'high' | 'medium' | 'low';
  matchingThemes: string[];
  wordCountCompatible: boolean;
  structurallyCompatible: boolean;
  themeOverlap: number; // 0-1
  wordCountRatio: number; // 0-1
  structuralSimilarity: number; // 0-1
}

/**
 * Adaptation guidance with section-by-section instructions
 */
export interface AdaptationGuidance {
  sections: Array<{
    sectionName: string;
    keepContent: string;
    changes: string;
    additions: string;
  }>;
  estimatedMinutes: number;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Essay data for adaptability calculation
 */
export interface EssayForAdaptability {
  id: string;
  content: string;
  prompt: string;
  wordCount: number;
  themes: string[];
  outline?: any; // JSON outline from Structure phase
}

/**
 * Calculate adaptability score between library essay and new prompt
 *
 * Algorithm:
 * - Theme overlap: 70% weight (matching themes / total new prompt themes)
 * - Word count compatibility: 15% weight (min/max ratio)
 * - Structural similarity: 15% weight (essay structure fits new requirements)
 *
 * @param libraryEssay - The existing essay from library
 * @param newPrompt - The new prompt to match against
 * @param newPromptThemes - Themes extracted from new prompt
 * @param newPromptWordLimit - Word count limit for new prompt
 * @returns Adaptability score with breakdown
 */
export async function calculateAdaptability(
  libraryEssay: EssayForAdaptability,
  newPrompt: string,
  newPromptThemes: string[],
  newPromptWordLimit: number
): Promise<AdaptabilityScore> {
  // 1. Theme Overlap (70% weight)
  const libraryThemes = libraryEssay.themes || [];
  const matchingThemes = libraryThemes.filter(theme =>
    newPromptThemes.includes(theme)
  );
  const themeOverlap = newPromptThemes.length > 0
    ? matchingThemes.length / newPromptThemes.length
    : 0;

  // 2. Word Count Compatibility (15% weight)
  const essayWordCount = libraryEssay.wordCount;
  const wordCountRatio = Math.min(essayWordCount, newPromptWordLimit) /
    Math.max(essayWordCount, newPromptWordLimit);

  // 3. Structural Similarity (15% weight)
  // For now, use a simplified structural similarity based on word count proximity
  // Future enhancement: Use AI to compare structural requirements from prompts
  const structuralSimilarity = calculateStructuralMatch(
    libraryEssay,
    newPrompt,
    newPromptWordLimit
  );

  // Combined score
  const score = (themeOverlap * 0.7) + (wordCountRatio * 0.15) + (structuralSimilarity * 0.15);
  const percentage = Math.round(score * 100);

  // Determine confidence level based on theme overlap
  const confidence: 'high' | 'medium' | 'low' =
    themeOverlap > 0.8 ? 'high' :
    themeOverlap > 0.5 ? 'medium' : 'low';

  return {
    score: percentage,
    confidence,
    matchingThemes,
    wordCountCompatible: wordCountRatio > 0.8,
    structurallyCompatible: structuralSimilarity > 0.7,
    themeOverlap,
    wordCountRatio,
    structuralSimilarity,
  };
}

/**
 * Calculate structural similarity between essay and new prompt requirements
 * Simplified version - compares word count ranges and basic requirements
 */
function calculateStructuralMatch(
  essay: EssayForAdaptability,
  newPrompt: string,
  newPromptWordLimit: number
): number {
  // Base similarity on word count proximity
  const wordCountDiff = Math.abs(essay.wordCount - newPromptWordLimit);
  const wordCountScore = Math.max(0, 1 - (wordCountDiff / newPromptWordLimit));

  // Check for common structural keywords in both prompts
  const essayPromptLower = essay.prompt.toLowerCase();
  const newPromptLower = newPrompt.toLowerCase();

  const structuralKeywords = [
    'introduction',
    'personal',
    'experience',
    'goals',
    'future',
    'conclusion',
    'story',
    'impact',
  ];

  let matchCount = 0;
  let totalCount = 0;

  for (const keyword of structuralKeywords) {
    const inOriginal = essayPromptLower.includes(keyword);
    const inNew = newPromptLower.includes(keyword);

    if (inOriginal || inNew) {
      totalCount++;
      if (inOriginal && inNew) {
        matchCount++;
      }
    }
  }

  const keywordScore = totalCount > 0 ? matchCount / totalCount : 0.5;

  // Weighted combination
  return (wordCountScore * 0.6) + (keywordScore * 0.4);
}

/**
 * Generate section-by-section adaptation guidance using AI
 *
 * @param originalEssay - The library essay to adapt
 * @param newPrompt - The new prompt requirements
 * @returns Detailed adaptation instructions
 */
export async function generateAdaptationGuidance(
  originalEssay: EssayForAdaptability,
  newPrompt: string
): Promise<AdaptationGuidance> {
  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-fallback') {
    console.warn('OPENAI_API_KEY not configured - using fallback adaptation guidance');
    return generateAdaptationGuidanceFallback(originalEssay, newPrompt);
  }

  try {
    const userPrompt = `Compare this original essay to the new prompt and provide section-by-section adaptation guidance.

Original Essay:
${originalEssay.content}

Original Prompt:
${originalEssay.prompt}

New Prompt:
${newPrompt}

Analyze the differences and provide specific guidance for adapting the essay. For each section (introduction, body paragraphs, conclusion), specify:
1. What content to keep (can be used as-is)
2. What content to change (needs revision)
3. What content to add (new material needed for new prompt)

Also estimate the total time needed to adapt the essay (in minutes).

Respond in JSON format:
{
  "sections": [
    {
      "sectionName": "Introduction",
      "keepContent": "Opening story about hospital volunteer work",
      "changes": "Update scholarship name from 'ABC Scholarship' to 'XYZ Scholarship'",
      "additions": "Add sentence about diversity theme (new requirement)"
    }
  ],
  "estimatedMinutes": 20,
  "confidence": "high" | "medium" | "low"
}`;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Use GPT-4o for higher quality strategic advice
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('No response from OpenAI - using fallback');
      return generateAdaptationGuidanceFallback(originalEssay, newPrompt);
    }

    const result = JSON.parse(content) as AdaptationGuidance;
    return result;

  } catch (error) {
    console.error('Error generating adaptation guidance with AI:', error);
    return generateAdaptationGuidanceFallback(originalEssay, newPrompt);
  }
}

/**
 * Fallback adaptation guidance using rule-based analysis
 */
function generateAdaptationGuidanceFallback(
  originalEssay: EssayForAdaptability,
  newPrompt: string
): AdaptationGuidance {
  // Simple rule-based guidance
  const sections = [
    {
      sectionName: 'Introduction',
      keepContent: 'Opening story and personal background',
      changes: 'Revise to align with new scholarship focus',
      additions: 'Add any new themes or requirements from new prompt',
    },
    {
      sectionName: 'Body',
      keepContent: 'Main experiences and achievements',
      changes: 'Emphasize aspects relevant to new scholarship',
      additions: 'Include any additional experiences needed for new prompt',
    },
    {
      sectionName: 'Conclusion',
      keepContent: 'Core goals and aspirations',
      changes: 'Update to match new scholarship mission',
      additions: 'Connect goals to specific scholarship opportunities',
    },
  ];

  // Estimate based on word count difference
  const wordCountDiff = Math.abs(originalEssay.wordCount - newPrompt.length);
  const estimatedMinutes = Math.min(60, Math.max(15, Math.round(wordCountDiff / 10)));

  return {
    sections,
    estimatedMinutes,
    confidence: 'medium',
  };
}

/**
 * Hash a prompt for caching adaptability scores
 */
export function hashPromptForCache(prompt: string): string {
  return createHash('md5').update(prompt.trim().toLowerCase()).digest('hex');
}

/**
 * Calculate adaptability scores for all library essays against a new prompt
 * Runs calculations in parallel for performance
 */
export async function calculateAdaptabilityBatch(
  libraryEssays: EssayForAdaptability[],
  newPrompt: string,
  newPromptThemes: string[],
  newPromptWordLimit: number
): Promise<Array<{ essayId: string; score: AdaptabilityScore }>> {
  const results = await Promise.all(
    libraryEssays.map(async (essay) => ({
      essayId: essay.id,
      score: await calculateAdaptability(
        essay,
        newPrompt,
        newPromptThemes,
        newPromptWordLimit
      ),
    }))
  );

  // Sort by score descending (highest adaptability first)
  return results.sort((a, b) => b.score.score - a.score.score);
}
