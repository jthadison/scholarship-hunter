/**
 * Story 4.9: Essay Quality Assessment
 * Readability Calculator Service
 *
 * Calculates readability metrics for essays including:
 * - Flesch-Kincaid Grade Level
 * - Sentence complexity
 * - Vocabulary sophistication
 */

export interface ReadabilityMetrics {
  fleschKincaidGradeLevel: number;
  sentenceComplexity: {
    avgWordsPerSentence: number;
    variance: number;
  };
  vocabularySophistication: {
    uniqueWordRatio: number;
    avgWordLength: number;
  };
}

/**
 * Count syllables in a word using vowel-based approximation
 * Based on standard syllable counting algorithm
 */
export function countSyllables(word: string): number {
  word = word.toLowerCase().trim();

  // Handle edge cases
  if (word.length === 0) return 0;
  if (word.length <= 3) return 1;

  // Remove trailing 'e', 'es', 'ed' (silent)
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');

  // Remove leading 'y'
  word = word.replace(/^y/, '');

  // Count vowel groups
  const syllableMatches = word.match(/[aeiouy]{1,2}/g);

  return syllableMatches ? syllableMatches.length : 1;
}

/**
 * Calculate Flesch-Kincaid Grade Level
 * Formula: 0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59
 * Target for college essays: 10-12
 */
export function calculateFleschKincaid(text: string): number {
  // Split into sentences (by period, exclamation, question mark)
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (sentences.length === 0) return 0;

  // Split into words
  const words = text
    .split(/\s+/)
    .filter(w => w.length > 0 && /[a-zA-Z]/.test(w));

  if (words.length === 0) return 0;

  // Count total syllables
  const totalSyllables = words.reduce((sum, word) => {
    // Remove punctuation for syllable counting
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    return sum + countSyllables(cleanWord);
  }, 0);

  // Calculate averages
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  // Flesch-Kincaid formula
  const gradeLevel = 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;

  // Round to 1 decimal place
  return Math.round(gradeLevel * 10) / 10;
}

/**
 * Calculate sentence complexity metrics
 */
export function calculateSentenceComplexity(text: string): {
  avgWordsPerSentence: number;
  variance: number;
} {
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (sentences.length === 0) {
    return { avgWordsPerSentence: 0, variance: 0 };
  }

  // Count words in each sentence
  const wordCounts = sentences.map(sentence => {
    const words = sentence.split(/\s+/).filter(w => w.length > 0 && /[a-zA-Z]/.test(w));
    return words.length;
  });

  // Calculate average
  const avgWordsPerSentence = wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length;

  // Calculate variance
  const squaredDiffs = wordCounts.map(count => Math.pow(count - avgWordsPerSentence, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / wordCounts.length;

  return {
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    variance: Math.round(variance * 10) / 10,
  };
}

/**
 * Calculate vocabulary sophistication metrics
 */
export function calculateVocabularySophistication(text: string): {
  uniqueWordRatio: number;
  avgWordLength: number;
} {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(/[^a-z]/g, ''))
    .filter(w => w.length > 0);

  if (words.length === 0) {
    return { uniqueWordRatio: 0, avgWordLength: 0 };
  }

  // Calculate unique word ratio
  const uniqueWords = new Set(words);
  const uniqueWordRatio = uniqueWords.size / words.length;

  // Calculate average word length
  const totalLength = words.reduce((sum, word) => sum + word.length, 0);
  const avgWordLength = totalLength / words.length;

  return {
    uniqueWordRatio: Math.round(uniqueWordRatio * 100) / 100,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
  };
}

/**
 * Calculate all readability metrics for an essay
 */
export function calculateReadabilityMetrics(text: string): ReadabilityMetrics {
  return {
    fleschKincaidGradeLevel: calculateFleschKincaid(text),
    sentenceComplexity: calculateSentenceComplexity(text),
    vocabularySophistication: calculateVocabularySophistication(text),
  };
}
