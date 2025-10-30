/**
 * Essay Theme Extractor Service
 * Story 4.8 - Essay Library & Adaptability Scoring
 *
 * AI-powered theme extraction from completed scholarship essays using OpenAI
 */

import OpenAI from "openai";

// Initialize OpenAI client
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY not configured - theme extraction will use fallback mode');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-fallback',
});

/**
 * Standard theme taxonomy for scholarship essays
 * Consistent theme vocabulary ensures accurate matching across essays and prompts
 */
export const STANDARD_THEMES = [
  'leadership',
  'community-service',
  'academic-achievement',
  'personal-growth',
  'career-goals',
  'overcoming-adversity',
  'cultural-identity',
  'diversity',
  'financial-need',
  'family',
  'volunteer-work',
  'sports',
  'arts',
  'stem',
  'entrepreneurship',
  'environmental-sustainability',
  'social-justice',
  'health-medicine',
] as const;

export type ThemeTag = typeof STANDARD_THEMES[number];

/**
 * Color mapping for visual consistency across UI
 */
export const THEME_COLORS: Record<string, string> = {
  'leadership': 'blue',
  'community-service': 'green',
  'academic-achievement': 'purple',
  'personal-growth': 'yellow',
  'career-goals': 'indigo',
  'overcoming-adversity': 'red',
  'cultural-identity': 'pink',
  'diversity': 'teal',
  'financial-need': 'orange',
  'family': 'amber',
  'volunteer-work': 'lime',
  'sports': 'cyan',
  'arts': 'fuchsia',
  'stem': 'violet',
  'entrepreneurship': 'rose',
  'environmental-sustainability': 'emerald',
  'social-justice': 'sky',
  'health-medicine': 'slate',
};

/**
 * Extract 3-5 primary themes from essay content using AI
 *
 * @param essayContent - The full text content of the essay
 * @returns Array of theme tags (3-5 themes from STANDARD_THEMES)
 */
export async function extractThemes(essayContent: string): Promise<string[]> {
  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-fallback') {
    console.warn('OPENAI_API_KEY not configured - using fallback theme extraction');
    return extractThemesFallback(essayContent);
  }

  try {
    const systemPrompt = `You are an expert at identifying themes in scholarship essays. Extract 3-5 primary themes from essays based on their main content and message.`;

    const userPrompt = `Extract the primary themes from this scholarship essay. Choose ONLY from this list:
${STANDARD_THEMES.join(', ')}

Essay:
${essayContent}

Analyze the essay and identify the 3-5 most prominent themes. Consider:
- The main topics and subjects discussed
- The student's experiences and achievements
- The values and qualities demonstrated
- The goals and aspirations mentioned

Return ONLY a JSON object with a "themes" array containing 3-5 theme names from the list above.
Example: {"themes": ["leadership", "community-service", "career-goals"]}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Cost-effective for analysis tasks
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Low temperature for consistent categorization
      response_format: { type: 'json_object' },
      max_tokens: 150, // Short response expected
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('No response from OpenAI - using fallback');
      return extractThemesFallback(essayContent);
    }

    const result = JSON.parse(content) as { themes?: string[] };
    const themes = result.themes || [];

    // Validate themes are from standard list
    const validThemes = themes.filter(theme =>
      STANDARD_THEMES.includes(theme as ThemeTag)
    );

    // Ensure we have at least 1 theme and at most 5
    if (validThemes.length === 0) {
      return extractThemesFallback(essayContent);
    }

    return validThemes.slice(0, 5);

  } catch (error) {
    console.error('Error extracting themes with AI:', error);
    return extractThemesFallback(essayContent);
  }
}

/**
 * Fallback theme extraction using keyword matching
 * Used when OpenAI API is unavailable or returns invalid results
 */
function extractThemesFallback(essayContent: string): string[] {
  const contentLower = essayContent.toLowerCase();
  const detectedThemes: string[] = [];

  // Simple keyword matching for common themes
  const themeKeywords: Record<string, string[]> = {
    'leadership': ['leader', 'leadership', 'lead', 'president', 'captain', 'organize'],
    'community-service': ['volunteer', 'community', 'service', 'help', 'contribute'],
    'academic-achievement': ['gpa', 'grade', 'honor', 'academic', 'scholar', 'study'],
    'personal-growth': ['learn', 'grow', 'develop', 'overcome', 'improve', 'change'],
    'career-goals': ['career', 'goal', 'aspire', 'future', 'profession', 'dream'],
    'overcoming-adversity': ['challenge', 'difficult', 'overcome', 'struggle', 'adversity'],
    'cultural-identity': ['culture', 'heritage', 'identity', 'background', 'tradition'],
    'diversity': ['diverse', 'diversity', 'inclusion', 'multicultural', 'different'],
    'financial-need': ['financial', 'afford', 'cost', 'economic', 'need', 'hardship'],
    'family': ['family', 'parent', 'mother', 'father', 'sibling', 'home'],
  };

  // Check for keyword matches
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    const hasMatch = keywords.some(keyword => contentLower.includes(keyword));
    if (hasMatch) {
      detectedThemes.push(theme);
    }
  }

  // Return detected themes, or default to generic themes if none found
  if (detectedThemes.length === 0) {
    return ['personal-growth', 'academic-achievement'];
  }

  return detectedThemes.slice(0, 5);
}

/**
 * Batch extract themes for multiple essays
 * Useful for processing essay library on initial setup
 */
export async function extractThemesBatch(
  essays: Array<{ id: string; content: string }>
): Promise<Array<{ id: string; themes: string[] }>> {
  const results = await Promise.all(
    essays.map(async (essay) => ({
      id: essay.id,
      themes: await extractThemes(essay.content),
    }))
  );

  return results;
}
