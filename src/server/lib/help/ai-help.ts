/**
 * Story 5.10: Help System - AI-Powered Help Assistant
 *
 * OpenAI integration for natural language question answering.
 *
 * @module server/lib/help/ai-help
 */

import OpenAI from 'openai'
import { prisma } from '../../db'

// Initialize OpenAI client (only if API key is available)
// dangerouslyAllowBrowser is set for test environments only
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: process.env.NODE_ENV === 'test',
    })
  : null

/**
 * Common questions auto-suggestions
 */
export const COMMON_QUESTIONS = [
  'How do I add a scholarship to my applications?',
  'What is a match score?',
  'How do I export my data?',
  'How do I update my profile?',
  'What do the priority tiers mean?',
  'How do I request a recommendation letter?',
  'What is profile strength?',
  'How do I track application deadlines?',
  'How does the essay AI assistant work?',
  'Can I share my progress with my counselor?',
]

/**
 * AI help response interface
 */
export interface AIHelpResponse {
  answer: string
  articles: Array<{
    id: string
    title: string
    slug: string
    description: string
  }>
  relatedQuestions: string[]
}

/**
 * Ask the AI help assistant a question
 *
 * @param question - User's question in natural language
 * @returns AI-generated answer with relevant help articles
 */
export async function askAIAssistant(question: string): Promise<AIHelpResponse> {
  if (!openai) {
    // Fallback to keyword search if OpenAI not configured
    return fallbackSearch(question)
  }

  try {
    // Search for relevant help articles first
    const relevantArticles = await findRelevantArticles(question)

    // Build context from help articles
    const context = relevantArticles
      .map((a) => `**${a.title}**: ${a.description}\n${a.content.substring(0, 500)}`)
      .join('\n\n')

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using mini model for cost optimization
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant for Scholarship Hunter, a scholarship search and application management platform. Answer questions about the platform using the provided help articles. Keep answers concise (1-2 sentences) and reference the relevant help article when appropriate.

Available help articles:
${context}

If the question is not related to the platform or you cannot answer based on the help articles, politely decline and suggest browsing the help center.`,
        },
        {
          role: 'user',
          content: question,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    })

    const answer = response.choices[0]?.message?.content || 'I couldn\'t generate an answer.'

    // Generate related questions
    const relatedQuestions = COMMON_QUESTIONS.filter((q) =>
      q.toLowerCase().includes(question.toLowerCase().split(' ')[0] ?? '')
    ).slice(0, 3)

    return {
      answer,
      articles: relevantArticles.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        description: a.description,
      })),
      relatedQuestions,
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    // Fallback to keyword search
    return fallbackSearch(question)
  }
}

/**
 * Find relevant help articles based on question keywords
 */
async function findRelevantArticles(question: string) {
  const keywords = question
    .toLowerCase()
    .split(' ')
    .filter((w) => w.length > 3) // Filter short words

  const articles = await prisma.helpArticle.findMany({
    where: {
      OR: [
        { title: { contains: question, mode: 'insensitive' } },
        { description: { contains: question, mode: 'insensitive' } },
        { keywords: { hasSome: keywords } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      content: true,
    },
    take: 5,
  })

  return articles
}

/**
 * Fallback search when AI is not available
 */
async function fallbackSearch(question: string): Promise<AIHelpResponse> {
  const articles = await findRelevantArticles(question)

  return {
    answer:
      'I found some help articles that may answer your question. Browse the articles below for more information.',
    articles: articles.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      description: a.description,
    })),
    relatedQuestions: COMMON_QUESTIONS.slice(0, 3),
  }
}
