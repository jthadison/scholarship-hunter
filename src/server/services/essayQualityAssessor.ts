/**
 * Story 4.9: Essay Quality Assessment
 * AI-Powered Essay Quality Assessor Service
 *
 * Evaluates essays across 5 dimensions using OpenAI GPT-4:
 * 1. Memorability (20%)
 * 2. Emotional Impact (20%)
 * 3. Authenticity (25%)
 * 4. Prompt Alignment (20%)
 * 5. Technical Quality (15%)
 */

import OpenAI from 'openai';
import { analyzeGrammarAndStyle, type TechnicalQualityReport } from './grammarChecker';
import { calculateReadabilityMetrics, type ReadabilityMetrics } from './readabilityCalculator';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Type definitions
export interface DimensionScore {
  score: number; // 0-100
  explanation: string;
  improvements: string[];
}

export interface ImprovementSuggestion {
  priority: 'critical' | 'important' | 'optional';
  issue: string;
  location: string;
  recommendation: string;
  impact: string; // e.g., "+8 points to Memorability"
}

export interface QualityAssessment {
  overall: number; // Weighted average 0-100
  dimensions: {
    memorability: DimensionScore;
    emotionalImpact: DimensionScore;
    authenticity: DimensionScore;
    promptAlignment: DimensionScore;
    technicalQuality: DimensionScore;
  };
  suggestions: ImprovementSuggestion[];
  grammarErrors: string[];
  authenticityWarnings: string[];
  technicalQualityReport?: TechnicalQualityReport;
  readabilityMetrics?: ReadabilityMetrics;
  assessedAt: Date;
  assessmentVersion: string;
}

export interface SuccessProbability {
  probability: number; // 0-100
  confidence: 'high' | 'medium' | 'low';
  message: string;
}

/**
 * Weighted scoring for overall quality
 */
const DIMENSION_WEIGHTS = {
  memorability: 0.20,
  emotionalImpact: 0.20,
  authenticity: 0.25,
  promptAlignment: 0.20,
  technicalQuality: 0.15,
} as const;

/**
 * Assess essay quality using OpenAI GPT-4
 */
export async function assessEssayQuality(
  essayContent: string,
  prompt: string
): Promise<QualityAssessment> {
  // First, run technical analysis locally
  const technicalReport = analyzeGrammarAndStyle(essayContent);
  const readabilityMetrics = calculateReadabilityMetrics(essayContent);

  // Build the AI prompt for quality assessment
  const systemPrompt = `You are Morgan, an expert scholarship essay evaluator with years of experience reviewing college application essays. You provide objective, constructive feedback that helps students improve their essays while maintaining an encouraging tone.`;

  const userPrompt = `
Evaluate this scholarship essay on a 0-100 scale across these dimensions:

1. **Memorability (0-100)**: Is it unique, engaging, and stands out? Does it avoid clichés? Is there a compelling narrative or unique angle?
2. **Emotional Impact (0-100)**: Does it resonate emotionally with readers? Is there vulnerability, depth, and authentic emotion?
3. **Authenticity (0-100)**: Does it feel genuine and personal, not AI-generated or template-based? Are there specific details, names, and experiences?
4. **Prompt Alignment (0-100)**: Does it address all prompt requirements effectively and completely? Is the response focused and relevant?
5. **Technical Quality (0-100)**: Grammar, clarity, structure, readability, and flow (note: I'll provide technical analysis separately)

**Essay Prompt:**
${prompt}

**Essay Content:**
${essayContent}

**Technical Analysis (reference for Technical Quality dimension):**
- Grammar errors: ${technicalReport.grammarErrors.length}
- Style issues: ${technicalReport.styleIssues.length}
- Readability grade level: ${readabilityMetrics.fleschKincaidGradeLevel}
- Avg words per sentence: ${readabilityMetrics.sentenceComplexity.avgWordsPerSentence}

For each dimension:
- Provide a score (0-100)
- Explain the score in 2-3 sentences focusing on strengths and weaknesses
- Identify 1-2 specific improvements

Also provide:
- Overall effectiveness score (weighted average)
- 3-6 prioritized improvement suggestions with:
  - Priority level (critical/important/optional)
  - Issue description
  - Location (which section/paragraph)
  - Specific recommendation
  - Expected score impact (e.g., "+8 points to Memorability")
- List any grammar/style concerns not caught by automated checks
- Authenticity warnings if content feels AI-generated or generic (be specific about what feels inauthentic)

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "dimensions": {
    "memorability": { "score": 0-100, "explanation": "...", "improvements": ["...", "..."] },
    "emotionalImpact": { "score": 0-100, "explanation": "...", "improvements": ["...", "..."] },
    "authenticity": { "score": 0-100, "explanation": "...", "improvements": ["...", "..."] },
    "promptAlignment": { "score": 0-100, "explanation": "...", "improvements": ["...", "..."] },
    "technicalQuality": { "score": 0-100, "explanation": "...", "improvements": ["...", "..."] }
  },
  "overallScore": 0-100,
  "suggestions": [
    {
      "priority": "critical" | "important" | "optional",
      "issue": "...",
      "location": "Introduction, paragraph 1",
      "recommendation": "...",
      "impact": "+8 points to Memorability"
    }
  ],
  "grammarErrors": ["...", "..."],
  "authenticityWarnings": ["...", "..."]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Low temperature for consistent evaluation
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const aiAssessment = JSON.parse(content) as {
      dimensions: {
        memorability: DimensionScore;
        emotionalImpact: DimensionScore;
        authenticity: DimensionScore;
        promptAlignment: DimensionScore;
        technicalQuality: DimensionScore;
      };
      overallScore: number;
      suggestions: ImprovementSuggestion[];
      grammarErrors: string[];
      authenticityWarnings: string[];
    };

    // Calculate weighted overall score (override AI's calculation to ensure consistency)
    const overallScore = Math.round(
      aiAssessment.dimensions.memorability.score * DIMENSION_WEIGHTS.memorability +
        aiAssessment.dimensions.emotionalImpact.score * DIMENSION_WEIGHTS.emotionalImpact +
        aiAssessment.dimensions.authenticity.score * DIMENSION_WEIGHTS.authenticity +
        aiAssessment.dimensions.promptAlignment.score * DIMENSION_WEIGHTS.promptAlignment +
        aiAssessment.dimensions.technicalQuality.score * DIMENSION_WEIGHTS.technicalQuality
    );

    // Merge grammar errors from technical report
    const allGrammarErrors = [
      ...aiAssessment.grammarErrors,
      ...technicalReport.grammarErrors.map(
        e => `${e.type}: ${e.description} (${e.location})`
      ),
    ];

    return {
      overall: overallScore,
      dimensions: aiAssessment.dimensions,
      suggestions: aiAssessment.suggestions,
      grammarErrors: allGrammarErrors,
      authenticityWarnings: aiAssessment.authenticityWarnings,
      technicalQualityReport: technicalReport,
      readabilityMetrics,
      assessedAt: new Date(),
      assessmentVersion: '1.0',
    };
  } catch (error) {
    console.error('Error assessing essay quality:', error);

    // Fallback: Return basic assessment based on technical analysis only
    const fallbackScore = technicalReport.technicalScore;

    return {
      overall: fallbackScore,
      dimensions: {
        memorability: {
          score: fallbackScore,
          explanation: 'AI analysis unavailable. Score based on technical quality only.',
          improvements: ['Complete AI analysis unavailable at this time.'],
        },
        emotionalImpact: {
          score: fallbackScore,
          explanation: 'AI analysis unavailable. Score based on technical quality only.',
          improvements: ['Complete AI analysis unavailable at this time.'],
        },
        authenticity: {
          score: fallbackScore,
          explanation: 'AI analysis unavailable. Score based on technical quality only.',
          improvements: ['Complete AI analysis unavailable at this time.'],
        },
        promptAlignment: {
          score: fallbackScore,
          explanation: 'AI analysis unavailable. Score based on technical quality only.',
          improvements: ['Complete AI analysis unavailable at this time.'],
        },
        technicalQuality: {
          score: technicalReport.technicalScore,
          explanation: `Based on technical analysis: ${technicalReport.grammarErrors.length} grammar errors, ${technicalReport.styleIssues.length} style issues.`,
          improvements: technicalReport.grammarErrors.slice(0, 2).map(e => e.description),
        },
      },
      suggestions: [],
      grammarErrors: technicalReport.grammarErrors.map(
        e => `${e.type}: ${e.description} (${e.location})`
      ),
      authenticityWarnings: [],
      technicalQualityReport: technicalReport,
      readabilityMetrics,
      assessedAt: new Date(),
      assessmentVersion: '1.0-fallback',
    };
  }
}

/**
 * Calculate success probability based on multiple factors
 */
export function calculateSuccessProbability(
  qualityScore: number,
  profileStrength: number = 50,
  matchScore: number = 50,
  competitionLevel: 'low' | 'medium' | 'high' = 'medium'
): SuccessProbability {
  // Weight factors
  const weights = {
    quality: 0.40,
    profile: 0.25,
    match: 0.20,
    competition: 0.15,
  };

  // Competition level adjustment (higher competition = lower probability)
  const competitionAdjustment = {
    low: 1.0, // 0% reduction
    medium: 0.85, // 15% reduction
    high: 0.70, // 30% reduction
  };

  // Base probability calculation
  const baseProbability =
    qualityScore * weights.quality +
    profileStrength * weights.profile +
    matchScore * weights.match;

  // Apply competition adjustment
  const probability = Math.round(baseProbability * competitionAdjustment[competitionLevel]);

  // Determine confidence level based on data availability
  let confidence: 'high' | 'medium' | 'low' = 'high';
  if (!profileStrength || !matchScore) confidence = 'medium';
  if (!profileStrength && !matchScore) confidence = 'low';

  // Generate contextual message
  let message = '';
  if (probability >= 85) {
    message = 'Excellent essay! Strong competitive position. Your essay demonstrates high quality across all dimensions.';
  } else if (probability >= 70) {
    message = 'Good essay with room for improvement. Address key suggestions to increase success probability to 85%+.';
  } else {
    message = '⚠️ This essay may not be competitive. We recommend substantial revisions before submission. Focus on high-impact improvements.';
  }

  return {
    probability: Math.max(0, Math.min(100, probability)),
    confidence,
    message,
  };
}

/**
 * Generate Morgan's personalized feedback message based on score
 */
export function generateMorganFeedback(
  assessment: QualityAssessment,
  isFirstDraft: boolean = false
): string {
  const score = assessment.overall;

  if (score >= 90) {
    return "Excellent work! This essay will stand out. Your authentic voice shines through, and the content is compelling. Ready to submit? 🌟";
  } else if (score >= 75) {
    return "Strong essay! You're on the right track. A few refinements will make this even more powerful. Focus on the suggestions below to take it to the next level.";
  } else if (score >= 60) {
    return "Good foundation! Your essay addresses the prompt, but there's room to make it more memorable and impactful. Let's work on strengthening key sections.";
  } else if (score >= 50) {
    if (isFirstDraft) {
      return "Great start! First drafts are all about getting ideas down. I've identified specific areas to improve that will significantly boost your score. Let's tackle them together!";
    }
    return "This essay needs revision before submission. The good news: I've identified specific areas to improve that will significantly boost your score. Let's tackle them together!";
  } else {
    if (isFirstDraft) {
      return "Thank you for sharing your first draft! Let's work through this step-by-step. Start with the critical suggestions below, and reassess after making changes. You've got this!";
    }
    return "This essay requires substantial revision to be competitive. Don't worry—we'll work through this step-by-step. Start with the critical suggestions below, and reassess after making changes.";
  }
}
