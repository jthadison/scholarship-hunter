/**
 * AI Essay Assistant Service
 * Story 4.7 - Essay Editor with 6-Phase Guidance
 *
 * AI-powered suggestions and feedback for each phase of essay writing
 * Uses OpenAI GPT-4 for generation, GPT-3.5-turbo for analysis
 */

import OpenAI from "openai";
import type { Profile } from "@prisma/client";

// Initialize OpenAI client
if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "⚠️  OPENAI_API_KEY not configured - AI essay assistance will use fallback mode"
  );
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-fallback",
});

// Rate limiting tracking (in-memory - consider Redis for production)
const rateLimitMap = new Map<string, { count: number; resetAt: Date }>();
const MAX_AI_CALLS_PER_DAY = 50;

/**
 * Check if student has exceeded daily AI call limit
 */
function checkRateLimit(studentId: string): boolean {
  const now = new Date();
  const record = rateLimitMap.get(studentId);

  if (!record || record.resetAt < now) {
    // Reset counter - new day
    rateLimitMap.set(studentId, {
      count: 1,
      resetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    });
    return true;
  }

  if (record.count >= MAX_AI_CALLS_PER_DAY) {
    return false;
  }

  record.count++;
  return true;
}

// ============================================================================
// DISCOVERY PHASE - Generate brainstorming ideas
// ============================================================================

export interface DiscoveryIdea {
  idea: string;
  relevance: string;
  profileReference: string; // Which profile field this relates to
}

export interface DiscoveryResponse {
  ideas: DiscoveryIdea[];
  brainstormingQuestions: string[];
}

/**
 * Generate discovery ideas based on student profile and essay prompt
 * Temperature: 0.7 (creative generation)
 */
export async function generateDiscoveryIdeas(
  prompt: string,
  profile: Partial<Profile>,
  studentId: string
): Promise<DiscoveryResponse> {
  // Rate limit check
  if (!checkRateLimit(studentId)) {
    throw new Error(
      "Daily AI assistance limit reached (50 calls per day). Try again tomorrow."
    );
  }

  // Fallback if no API key
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-fallback") {
    return createFallbackDiscoveryIdeas(prompt);
  }

  const systemPrompt = `You are Morgan, an expert scholarship essay strategist helping students brainstorm authentic content ideas.

Your role:
- Suggest specific, genuine ideas from the student's actual experiences
- Connect their profile data to the essay prompt
- Encourage authentic storytelling over generic achievements
- Generate thought-provoking questions to deepen reflection`;

  const userPrompt = `Essay Prompt: "${prompt}"

Student Profile:
- GPA: ${profile.gpa ?? "Not specified"} / ${profile.gpaScale ?? 4.0}
- Intended Major: ${profile.intendedMajor ?? "Not specified"}
- Extracurriculars: ${profile.extracurriculars ? JSON.stringify(profile.extracurriculars) : "None listed"}
- Volunteer Hours: ${profile.volunteerHours ?? 0}
- Leadership Roles: ${profile.leadershipRoles ? JSON.stringify(profile.leadershipRoles) : "None listed"}
- Awards/Honors: ${profile.awardsHonors ? JSON.stringify(profile.awardsHonors) : "None listed"}
- Career Goals: ${profile.careerGoals ?? "Not specified"}
- First Generation: ${profile.firstGeneration ? "Yes" : "No"}
- Additional Context: ${profile.additionalContext ?? "None"}

Generate 5-7 specific ideas this student could write about, referencing their actual experiences. Also provide 3-5 brainstorming questions to help them explore these ideas deeper.

Respond in JSON format:
{
  "ideas": [
    {
      "idea": "Write about your experience as hospital volunteer coordinator, focusing on the elderly patient who inspired you to pursue nursing",
      "relevance": "Connects to prompt's focus on community service and personal growth",
      "profileReference": "Volunteer experience: 200+ hours at City Hospital"
    }
  ],
  "brainstormingQuestions": [
    "What specific moment during your volunteer work changed your perspective?",
    "How did this experience shape your career goals?"
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7, // Creative generation
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from OpenAI");

    return JSON.parse(content) as DiscoveryResponse;
  } catch (error) {
    console.error("OpenAI discovery ideas failed:", error);
    return createFallbackDiscoveryIdeas(prompt);
  }
}

function createFallbackDiscoveryIdeas(_prompt: string): DiscoveryResponse {
  return {
    ideas: [
      {
        idea: "Reflect on a personal challenge you've overcome",
        relevance: "Shows resilience and growth",
        profileReference: "Your personal experiences",
      },
      {
        idea: "Describe a meaningful achievement or milestone",
        relevance: "Demonstrates your capabilities",
        profileReference: "Your accomplishments",
      },
    ],
    brainstormingQuestions: [
      "What challenges have you faced in your academic or personal life?",
      "How have your experiences shaped your goals?",
      "What makes you unique compared to other applicants?",
    ],
  };
}

// ============================================================================
// DRAFTING PHASE - Contextual feedback on paragraphs
// ============================================================================

export interface ContextualSuggestion {
  type: "specificity" | "detail" | "emotion" | "transition" | "clarity";
  severity: "minor" | "moderate" | "important";
  message: string;
  example?: string;
}

/**
 * Analyze a paragraph and provide specific improvement suggestions
 * Temperature: 0.3 (focused analysis)
 */
export async function getContextualFeedback(
  paragraphText: string,
  prompt: string,
  studentId: string
): Promise<ContextualSuggestion[]> {
  if (!checkRateLimit(studentId)) {
    throw new Error("Daily AI assistance limit reached");
  }

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-fallback") {
    return createFallbackContextualFeedback();
  }

  const systemPrompt = `You are Morgan, providing constructive feedback on essay paragraphs. Focus on actionable, specific improvements.`;

  const userPrompt = `Essay Prompt: "${prompt}"

Paragraph to analyze:
"${paragraphText}"

Provide 2-4 specific suggestions to improve this paragraph. Focus on:
- Specificity: Are there vague statements that need concrete details?
- Emotional depth: Does it show authentic feelings and reflection?
- Clarity: Is the message clear and well-articulated?
- Transitions: Does it connect well to the essay flow?

Respond in JSON:
{
  "suggestions": [
    {
      "type": "specificity",
      "severity": "important",
      "message": "This sentence is vague. Add specific details like names, dates, or sensory descriptions.",
      "example": "Instead of 'I helped people', try 'I spent 10 hours each week teaching English to newly arrived refugee families from Somalia'"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response");

    const parsed = JSON.parse(content) as { suggestions: ContextualSuggestion[] };
    return parsed.suggestions;
  } catch (error) {
    console.error("Contextual feedback failed:", error);
    return createFallbackContextualFeedback();
  }
}

function createFallbackContextualFeedback(): ContextualSuggestion[] {
  return [
    {
      type: "specificity",
      severity: "moderate",
      message:
        "Consider adding more specific details to make your writing more vivid and memorable",
    },
  ];
}

// ============================================================================
// REVISION PHASE - Comprehensive paragraph-by-paragraph analysis
// ============================================================================

export interface ParagraphFeedback {
  paragraphNumber: number;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  severity: "good" | "minor" | "moderate" | "needs-attention";
}

/**
 * Analyze entire essay for revision with paragraph-level feedback
 */
export async function analyzeForRevision(
  essayContent: string,
  prompt: string,
  studentId: string
): Promise<ParagraphFeedback[]> {
  if (!checkRateLimit(studentId)) {
    throw new Error("Daily AI assistance limit reached");
  }

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-fallback") {
    return createFallbackRevisionAnalysis();
  }

  const systemPrompt = `You are Morgan, reviewing an essay draft paragraph-by-paragraph. Provide balanced feedback highlighting both strengths and areas for improvement.`;

  const userPrompt = `Essay Prompt: "${prompt}"

Full Essay:
${essayContent}

Analyze each paragraph and provide:
1. Strengths (what works well)
2. Areas for improvement
3. Specific actionable suggestions

Respond in JSON:
{
  "feedback": [
    {
      "paragraphNumber": 1,
      "strengths": ["Strong opening hook", "Vivid sensory details"],
      "improvements": ["Transition to next paragraph is abrupt", "Could add more emotional depth"],
      "suggestions": ["Add a connecting sentence at the end", "Describe how you felt in that moment"],
      "severity": "minor"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response");

    const parsed = JSON.parse(content) as { feedback: ParagraphFeedback[] };
    return parsed.feedback;
  } catch (error) {
    console.error("Revision analysis failed:", error);
    return createFallbackRevisionAnalysis();
  }
}

function createFallbackRevisionAnalysis(): ParagraphFeedback[] {
  return [
    {
      paragraphNumber: 1,
      strengths: ["Engaging content"],
      improvements: ["Could use more specific details"],
      suggestions: ["Add concrete examples and sensory descriptions"],
      severity: "moderate",
    },
  ];
}

// ============================================================================
// POLISH PHASE - Grammar, style, and tone analysis
// ============================================================================

export interface GrammarIssue {
  type: "grammar" | "style" | "tone" | "readability" | "word-choice";
  severity: "error" | "warning" | "suggestion";
  message: string;
  location?: string; // Sentence or phrase
  suggestion?: string;
}

export interface PolishAnalysis {
  grammarIssues: GrammarIssue[];
  toneAnalysis: {
    detected: string;
    appropriate: boolean;
    feedback: string;
  };
  readabilityScore: {
    gradeLevel: number;
    assessment: string;
  };
  overusedWords: Array<{ word: string; count: number; alternatives: string[] }>;
}

/**
 * Comprehensive grammar, style, and tone checking
 */
export async function checkGrammarAndStyle(
  content: string,
  studentId: string
): Promise<PolishAnalysis> {
  if (!checkRateLimit(studentId)) {
    throw new Error("Daily AI assistance limit reached");
  }

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-fallback") {
    return createFallbackPolishAnalysis(content);
  }

  const systemPrompt = `You are Morgan, a meticulous editor reviewing scholarship essays. Check grammar, style, tone, and readability.`;

  const userPrompt = `Review this essay and provide:
1. Grammar and style issues with severity levels
2. Tone analysis (is it appropriate for scholarship essays?)
3. Readability assessment (Flesch-Kincaid grade level)
4. Overused words with better alternatives

Essay:
${content}

Respond in JSON format:
{
  "grammarIssues": [
    {
      "type": "grammar",
      "severity": "error",
      "message": "Missing comma after introductory phrase",
      "location": "First sentence",
      "suggestion": "Add comma after 'However'"
    }
  ],
  "toneAnalysis": {
    "detected": "Personal and reflective",
    "appropriate": true,
    "feedback": "Your tone strikes a good balance between formal and personal"
  },
  "readabilityScore": {
    "gradeLevel": 10.5,
    "assessment": "Appropriate for scholarship essays (target: 10-12)"
  },
  "overusedWords": [
    {
      "word": "very",
      "count": 5,
      "alternatives": ["extremely", "considerably", "remarkably"]
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response");

    return JSON.parse(content) as PolishAnalysis;
  } catch (error) {
    console.error("Polish analysis failed:", error);
    return createFallbackPolishAnalysis(content);
  }
}

function createFallbackPolishAnalysis(content: string): PolishAnalysis {
  // Basic readability calculation (simplified Flesch-Kincaid)
  const words = content.split(/\s+/).length;
  const sentences = content.split(/[.!?]+/).length;
  const gradeLevel = Math.min(12, Math.max(8, Math.round(words / sentences)));

  return {
    grammarIssues: [],
    toneAnalysis: {
      detected: "Personal",
      appropriate: true,
      feedback: "⚠️ AI analysis unavailable. Please review tone manually.",
    },
    readabilityScore: {
      gradeLevel,
      assessment: "Based on sentence length (AI analysis unavailable)",
    },
    overusedWords: [],
  };
}

// ============================================================================
// FINALIZATION PHASE - Authenticity validation
// ============================================================================

export interface AuthenticityScore {
  score: number; // 0-100
  assessment: "authentic" | "needs-review" | "concerning";
  feedback: string;
  indicators: {
    personalVoice: number;
    specificDetails: number;
    genuineReflection: number;
  };
}

/**
 * Validate that essay maintains authentic student voice (not AI-generated)
 */
export async function validateAuthenticity(
  content: string,
  studentId: string
): Promise<AuthenticityScore> {
  if (!checkRateLimit(studentId)) {
    throw new Error("Daily AI assistance limit reached");
  }

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-fallback") {
    return createFallbackAuthenticityScore();
  }

  const systemPrompt = `You are Morgan, assessing whether an essay has an authentic student voice or sounds AI-generated.

Look for:
- Genuine personal voice and reflection
- Specific, unique details
- Natural language patterns (not overly polished)
- Emotional authenticity
- Original insights`;

  const userPrompt = `Assess this essay's authenticity:

${content}

Rate on scale 0-100:
- 80-100: Clearly authentic student voice
- 60-79: Mostly authentic, minor concerns
- Below 60: Sounds AI-generated or heavily edited

Respond in JSON:
{
  "score": 85,
  "assessment": "authentic",
  "feedback": "This essay has a genuine personal voice with specific details that indicate authentic authorship.",
  "indicators": {
    "personalVoice": 90,
    "specificDetails": 85,
    "genuineReflection": 80
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response");

    return JSON.parse(content) as AuthenticityScore;
  } catch (error) {
    console.error("Authenticity validation failed:", error);
    return createFallbackAuthenticityScore();
  }
}

function createFallbackAuthenticityScore(): AuthenticityScore {
  return {
    score: 75,
    assessment: "needs-review",
    feedback:
      "⚠️ AI analysis unavailable. Please review essay authenticity manually.",
    indicators: {
      personalVoice: 75,
      specificDetails: 75,
      genuineReflection: 75,
    },
  };
}

// ============================================================================
// WRITER'S BLOCK ASSISTANCE - Generate sentence starters
// ============================================================================

export interface WritersBlockHelp {
  sentenceStarters: string[];
  questions: string[];
}

/**
 * Help overcome writer's block with sentence starters and prompts
 */
export async function generateSentenceStarters(
  currentContent: string,
  prompt: string,
  studentId: string
): Promise<WritersBlockHelp> {
  if (!checkRateLimit(studentId)) {
    throw new Error("Daily AI assistance limit reached");
  }

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-fallback") {
    return createFallbackWritersBlockHelp();
  }

  const systemPrompt = `You are Morgan, helping students overcome writer's block with thoughtful prompts and sentence starters.`;

  const userPrompt = `Essay prompt: "${prompt}"

Current essay content:
${currentContent}

The student is stuck. Generate:
1. 3-5 sentence starters to help them continue
2. 2-3 questions to deepen their thinking

Respond in JSON:
{
  "sentenceStarters": [
    "What surprised me most was...",
    "Looking back, I realize that..."
  ],
  "questions": [
    "What emotions did you feel in that moment?",
    "How has this experience changed you?"
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response");

    return JSON.parse(content) as WritersBlockHelp;
  } catch (error) {
    console.error("Writers block help failed:", error);
    return createFallbackWritersBlockHelp();
  }
}

function createFallbackWritersBlockHelp(): WritersBlockHelp {
  return {
    sentenceStarters: [
      "What I learned from this experience was...",
      "Looking back, I realize that...",
      "This moment taught me...",
    ],
    questions: [
      "How did this experience change your perspective?",
      "What specific details stand out in your memory?",
    ],
  };
}
