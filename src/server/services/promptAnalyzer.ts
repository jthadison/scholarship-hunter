/**
 * Prompt Analyzer Service
 * Story 4.6 - Essay Prompt Analysis
 *
 * AI-powered analysis of scholarship essay prompts using OpenAI GPT-4
 */

import { createHash } from "crypto";
import OpenAI from "openai";
import type { PromptAnalysis } from "../../types/essay";

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  OPENAI_API_KEY not configured - prompt analysis will use fallback mode');
    }
    openaiClient = new OpenAI({
      apiKey: apiKey || 'sk-fallback',
    });
  }
  return openaiClient;
}

/**
 * Hash a prompt text for caching identical prompts
 * Uses MD5 for fast, consistent hashing
 */
export function hashPrompt(text: string): string {
  return createHash("md5").update(text.trim().toLowerCase()).digest("hex");
}

/**
 * Extended PromptAnalysis with analysis source indicator
 */
export interface PromptAnalysisWithMeta extends PromptAnalysis {
  analysisSource: 'ai' | 'fallback';
}

/**
 * Analyze an essay prompt using AI to identify themes, structure, and strategic approaches
 *
 * @param promptText - The scholarship essay prompt to analyze
 * @returns Structured analysis with themes, requirements, tone, structure, and advice
 */
export async function analyzePrompt(
  promptText: string
): Promise<PromptAnalysisWithMeta> {
  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-fallback') {
    console.warn('OPENAI_API_KEY not configured - using fallback analysis');
    return createFallbackAnalysis(promptText);
  }

  const systemPrompt = `You are Morgan, an expert scholarship essay strategist. Analyze essay prompts to help students understand what scholarships are looking for and how to craft winning responses.

Your analysis should be:
- Strategic: Focus on what makes essays competitive and memorable
- Specific: Provide concrete examples and actionable guidance
- Authentic: Encourage genuine personal expression over generic achievements
- Structured: Break down complex prompts into manageable components`;

  const userPrompt = `Analyze this scholarship essay prompt in detail:

"${promptText}"

Provide a comprehensive analysis in JSON format:

{
  "themes": [
    {
      "name": "Leadership",
      "importance": "primary" | "secondary",
      "explanation": "The prompt asks you to demonstrate...",
      "examples": ["Leading a team project", "Starting a club"]
    }
  ],
  "requiredElements": [
    {
      "element": "Personal story",
      "mandatory": true,
      "description": "Share a specific moment or experience",
      "examples": ["A day that changed your perspective", "A conversation that inspired you"]
    }
  ],
  "tone": {
    "expected": "Personal & Reflective" | "Formal" | "Inspirational" | "Academic",
    "description": "This prompt expects a personal, reflective tone—be authentic and vulnerable",
    "examplePhrases": ["I realized...", "This experience taught me..."],
    "avoid": ["Overly formal language", "Clichés like 'Since I was young...'"]
  },
  "suggestedStructure": {
    "outline": [
      {
        "section": "Opening",
        "content": "Personal story hook",
        "wordCount": 150,
        "guidance": "Start with a vivid moment that captures attention"
      },
      {
        "section": "Challenge",
        "content": "Describe the obstacle or situation",
        "wordCount": 200,
        "guidance": "Be specific about what you faced"
      }
    ],
    "flow": "Personal story → Challenge → Growth → Future impact"
  },
  "strategicAdvice": [
    "This prompt values authenticity—focus on genuine personal experience rather than achievements",
    "Use specific details: names, dates, dialogue, sensory descriptions",
    "Connect your past experience to future goals explicitly"
  ],
  "dosAndDonts": {
    "dos": ["Share vulnerable moments", "Be specific with details", "Show growth and reflection"],
    "donts": ["List achievements without context", "Use clichés", "Write generic statements"]
  },
  "examplePatterns": [
    {
      "pattern": "Opens with dialogue from a pivotal conversation",
      "effectiveness": "Immediately engages reader and establishes personal tone"
    },
    {
      "pattern": "Uses a 'before and after' structure showing transformation",
      "effectiveness": "Clearly demonstrates growth and impact"
    }
  ],
  "wordCountTarget": {
    "min": 500,
    "max": 750,
    "optimal": 650,
    "extracted": true
  },
  "competitiveInsights": "Strong essays for this prompt often include specific dialogue, sensory details, and explicit connections between experience and future goals. Essays that stand out avoid generic statements and instead tell a unique, memorable story."
}

IMPORTANT:
- Identify all key themes (leadership, adversity, community service, academic goals, etc.)
- Mark primary vs secondary themes based on what the prompt emphasizes most
- Extract word count if mentioned in the prompt (set extracted: true), otherwise suggest reasonable ranges
- Provide 3-5 strategic insights that are specific and actionable
- Suggest 2-3 example patterns that demonstrate effective approaches
- Focus on what makes essays competitive and memorable, not just what's required`;

  try {
    const startTime = Date.now();
    const openai = getOpenAIClient();

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4, // Balanced creativity and consistency
      response_format: { type: "json_object" }, // Ensure JSON response
    })

    const duration = Date.now() - startTime;

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from OpenAI")
    }

    const analysis = JSON.parse(content) as Omit<
      PromptAnalysis,
      "analyzedAt" | "promptHash"
    >

    // Log performance metrics (without sensitive data)
    console.log('OpenAI prompt analysis completed', {
      duration: `${duration}ms`,
      promptLength: promptText.length,
      themesFound: analysis.themes?.length || 0,
    });

    // Add metadata
    return {
      ...analysis,
      analyzedAt: new Date(),
      promptHash: hashPrompt(promptText),
      analysisSource: 'ai',
    }
  } catch (error) {
    // Sanitize error logs - don't expose prompt content or API keys
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("OpenAI prompt analysis failed:", {
      error: errorMessage,
      promptLength: promptText.length,
      // Don't log the actual prompt or API responses
    });

    // Return fallback generic analysis
    return createFallbackAnalysis(promptText);
  }
}

/**
 * Create a fallback generic analysis when OpenAI fails
 * Provides basic structure but encourages manual review
 */
function createFallbackAnalysis(promptText: string): PromptAnalysisWithMeta {
  return {
    themes: [
      {
        name: "Personal Experience",
        importance: "primary",
        explanation:
          "The prompt asks you to share your personal story and experiences",
        examples: [
          "A challenging situation you've faced",
          "A meaningful achievement or milestone",
        ],
      },
    ],
    requiredElements: [
      {
        element: "Personal narrative",
        mandatory: true,
        description: "Share your unique story and perspective",
        examples: [
          "A specific event or moment",
          "Your personal journey or growth",
        ],
      },
    ],
    tone: {
      expected: "Personal & Reflective",
      description:
        "Use an authentic, personal tone that reflects your genuine voice",
      examplePhrases: ["I learned...", "This experience showed me..."],
      avoid: ["Overly formal language", "Generic statements"],
    },
    suggestedStructure: {
      outline: [
        {
          section: "Introduction",
          content: "Engaging opening with context",
          wordCount: 150,
          guidance: "Start with a hook that draws the reader in",
        },
        {
          section: "Body",
          content: "Detailed narrative with examples",
          wordCount: 400,
          guidance: "Provide specific details and personal insights",
        },
        {
          section: "Conclusion",
          content: "Reflection and future impact",
          wordCount: 100,
          guidance: "Connect to your goals and aspirations",
        },
      ],
      flow: "Introduction → Personal narrative → Reflection and goals",
    },
    strategicAdvice: [
      "Be authentic and share your genuine voice",
      "Use specific examples and concrete details",
      "Show personal growth and reflection",
    ],
    dosAndDonts: {
      dos: [
        "Share personal stories and experiences",
        "Use specific examples",
        "Show vulnerability and growth",
      ],
      donts: [
        "Use clichés or generic statements",
        "List achievements without context",
        "Copy from other essays",
      ],
    },
    examplePatterns: [
      {
        pattern: "Narrative structure with specific anecdotes",
        effectiveness: "Engages readers with concrete stories",
      },
    ],
    wordCountTarget: {
      min: 500,
      max: 750,
      optimal: 650,
      extracted: false,
    },
    competitiveInsights:
      "⚠️ AI analysis was unavailable. Please review this prompt carefully and consider your unique perspective. For best results, configure OPENAI_API_KEY.",
    analyzedAt: new Date(),
    promptHash: hashPrompt(promptText),
    analysisSource: 'fallback',
  };
}
