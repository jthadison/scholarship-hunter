/**
 * Story 4.9: Essay Quality Assessment
 * Grammar and Style Checker Service
 *
 * Analyzes essays for:
 * - Grammar errors (punctuation, subject-verb agreement, tense consistency)
 * - Style issues (passive voice, weak verbs, sentence monotony)
 * - Formatting problems
 */

import nlp from 'compromise';

export interface GrammarError {
  type: string;
  description: string;
  location: string; // e.g., "Paragraph 2, Sentence 3"
  severity: 'minor' | 'moderate' | 'critical';
}

export interface StyleIssue {
  type: string;
  description: string;
  suggestion: string;
  location: string;
}

export interface TechnicalQualityReport {
  grammarErrors: GrammarError[];
  styleIssues: StyleIssue[];
  errorCountByType: Record<string, number>;
  formattingIssues: string[];
  technicalScore: number; // 0-100
}

/**
 * Check for basic punctuation errors
 */
function checkPunctuation(text: string): GrammarError[] {
  const errors: GrammarError[] = [];
  const paragraphs = text.split(/\n\n+/);

  paragraphs.forEach((paragraph, pIndex) => {
    const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 0);

    sentences.forEach((sentence, sIndex) => {
      const trimmed = sentence.trim();

      // Check for missing capital at start
      if (trimmed.length > 0 && trimmed[0] && /[a-z]/.test(trimmed[0])) {
        errors.push({
          type: 'capitalization',
          description: 'Sentence should start with a capital letter',
          location: `Paragraph ${pIndex + 1}, Sentence ${sIndex + 1}`,
          severity: 'minor',
        });
      }

      // Check for multiple spaces
      if (/\s{2,}/.test(trimmed)) {
        errors.push({
          type: 'spacing',
          description: 'Multiple consecutive spaces found',
          location: `Paragraph ${pIndex + 1}, Sentence ${sIndex + 1}`,
          severity: 'minor',
        });
      }

      // Check for comma splice (simplified detection)
      if (/,\s+(and|but|or)\s+,/.test(trimmed)) {
        errors.push({
          type: 'comma_splice',
          description: 'Potential comma splice detected',
          location: `Paragraph ${pIndex + 1}, Sentence ${sIndex + 1}`,
          severity: 'moderate',
        });
      }
    });
  });

  return errors;
}

/**
 * Check for subject-verb agreement using NLP
 */
function checkSubjectVerbAgreement(text: string): GrammarError[] {
  const errors: GrammarError[] = [];
  const doc = nlp(text);

  // Get all sentences
  const sentences = doc.sentences().out('array');

  sentences.forEach((sentence: string, index: number) => {
    const sentenceDoc = nlp(sentence);

    // Check for plural subject with singular verb or vice versa
    // This is a simplified check - real implementation would be more sophisticated
    const subjects = sentenceDoc.match('#Noun+').out('array') as string[];
    const verbs = sentenceDoc.match('#Verb+').out('array') as string[];

    if (subjects.length > 0 && verbs.length > 0) {
      const firstSubject = subjects[0];
      const firstVerb = verbs[0];

      if (!firstSubject || !firstVerb) return;

      // Basic heuristic: check for common mismatches
      const hasPlural = /s$/.test(firstSubject);
      const verbIsSingular = /(is|has|was|does)$/i.test(firstVerb);

      if (hasPlural && verbIsSingular) {
        errors.push({
          type: 'subject_verb_agreement',
          description: 'Possible subject-verb agreement issue',
          location: `Sentence ${index + 1}`,
          severity: 'critical',
        });
      }
    }
  });

  return errors;
}

/**
 * Detect passive voice overuse
 */
function detectPassiveVoice(text: string): StyleIssue[] {
  const issues: StyleIssue[] = [];
  const doc = nlp(text);
  const sentences = doc.sentences().out('array');

  sentences.forEach((sentence: string, index: number) => {
    const sentenceDoc = nlp(sentence);

    // Detect passive voice patterns (be + past participle)
    const hasPassive = sentenceDoc.match('(is|are|was|were|been|be) (#Adverb+)? #PastTense').found;

    if (hasPassive) {
      issues.push({
        type: 'passive_voice',
        description: 'Passive voice detected - consider using active voice for stronger impact',
        suggestion: 'Rewrite in active voice (e.g., "The committee awarded me" instead of "I was awarded by the committee")',
        location: `Sentence ${index + 1}`,
      });
    }
  });

  return issues;
}

/**
 * Detect weak word choices
 */
function detectWeakWords(text: string): StyleIssue[] {
  const issues: StyleIssue[] = [];
  const weakWords = ['very', 'really', 'quite', 'somewhat', 'thing', 'stuff', 'nice', 'good', 'bad', 'got', 'get'];
  const doc = nlp(text);
  const sentences = doc.sentences().out('array');

  sentences.forEach((sentence: string, index: number) => {
    const lowerSentence = sentence.toLowerCase();

    weakWords.forEach(word => {
      if (new RegExp(`\\b${word}\\b`, 'i').test(lowerSentence)) {
        issues.push({
          type: 'weak_word',
          description: `Weak word "${word}" - consider more specific alternatives`,
          suggestion: `Replace "${word}" with a more descriptive word`,
          location: `Sentence ${index + 1}`,
        });
      }
    });
  });

  return issues;
}

/**
 * Check sentence length monotony
 */
function checkSentenceMonotony(text: string): StyleIssue[] {
  const issues: StyleIssue[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  if (sentences.length < 5) return issues;

  const wordCounts = sentences.map(s => s.split(/\s+/).length);

  // Check for consecutive sentences with similar length (±2 words)
  let consecutiveSimilar = 0;

  for (let i = 1; i < wordCounts.length; i++) {
    const diff = Math.abs(wordCounts[i]! - wordCounts[i - 1]!);

    if (diff <= 2) {
      consecutiveSimilar++;

      if (consecutiveSimilar >= 3) {
        issues.push({
          type: 'sentence_monotony',
          description: 'Multiple consecutive sentences have similar length - vary sentence structure',
          suggestion: 'Mix short, punchy sentences with longer, more complex ones for better rhythm',
          location: `Sentences ${i - 2} to ${i + 1}`,
        });
        consecutiveSimilar = 0; // Reset to avoid duplicate reports
      }
    } else {
      consecutiveSimilar = 0;
    }
  }

  return issues;
}

/**
 * Check formatting issues
 */
function checkFormatting(text: string): string[] {
  const issues: string[] = [];

  // Check for excessive capitalization
  const words = text.split(/\s+/);
  const allCapsWords = words.filter(w => /^[A-Z]{2,}$/.test(w) && w.length > 2);

  if (allCapsWords.length > 3) {
    issues.push('Excessive use of ALL CAPS - use sparingly for emphasis');
  }

  // Check for excessive exclamation marks
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount > 2) {
    issues.push('Excessive exclamation marks - use sparingly to maintain professional tone');
  }

  // Check for very long paragraphs
  const paragraphs = text.split(/\n\n+/);
  const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > 200);

  if (longParagraphs.length > 0) {
    issues.push('Some paragraphs are too long (>200 words) - break them up for better readability');
  }

  return issues;
}

/**
 * Calculate technical quality score based on errors and issues
 */
function calculateTechnicalScore(errors: GrammarError[], styleIssues: StyleIssue[]): number {
  let score = 100;

  // Deduct points for grammar errors
  errors.forEach(error => {
    switch (error.severity) {
      case 'critical':
        score -= 10;
        break;
      case 'moderate':
        score -= 5;
        break;
      case 'minor':
        score -= 2;
        break;
    }
  });

  // Deduct points for style issues (less severe than grammar)
  score -= styleIssues.length * 2;

  // Ensure score stays in 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Analyze essay for grammar and style issues
 */
export function analyzeGrammarAndStyle(text: string): TechnicalQualityReport {
  const punctuationErrors = checkPunctuation(text);
  const agreementErrors = checkSubjectVerbAgreement(text);
  const grammarErrors = [...punctuationErrors, ...agreementErrors];

  const passiveVoiceIssues = detectPassiveVoice(text);
  const weakWordIssues = detectWeakWords(text);
  const monotonyIssues = checkSentenceMonotony(text);
  const styleIssues = [...passiveVoiceIssues, ...weakWordIssues, ...monotonyIssues];

  const formattingIssues = checkFormatting(text);

  // Count errors by type
  const errorCountByType: Record<string, number> = {};
  grammarErrors.forEach(error => {
    errorCountByType[error.type] = (errorCountByType[error.type] || 0) + 1;
  });

  const technicalScore = calculateTechnicalScore(grammarErrors, styleIssues);

  return {
    grammarErrors,
    styleIssues,
    errorCountByType,
    formattingIssues,
    technicalScore,
  };
}
