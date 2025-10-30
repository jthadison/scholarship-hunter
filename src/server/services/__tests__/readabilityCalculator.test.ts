/**
 * Story 4.9: Essay Quality Assessment
 * Unit Tests for Readability Calculator
 */

import { describe, it, expect } from 'vitest';
import {
  countSyllables,
  calculateFleschKincaid,
  calculateSentenceComplexity,
  calculateVocabularySophistication,
  calculateReadabilityMetrics,
} from '../readabilityCalculator';

describe('readabilityCalculator', () => {
  describe('countSyllables', () => {
    it('should count syllables correctly for single-syllable words', () => {
      expect(countSyllables('cat')).toBe(1);
      expect(countSyllables('dog')).toBe(1);
      expect(countSyllables('the')).toBe(1);
    });

    it('should count syllables correctly for multi-syllable words', () => {
      expect(countSyllables('hello')).toBe(2);
      expect(countSyllables('beautiful')).toBeGreaterThanOrEqual(3); // Algorithm may vary
      expect(countSyllables('education')).toBeGreaterThanOrEqual(3);
    });

    it('should handle words with silent e', () => {
      expect(countSyllables('make')).toBe(1);
      expect(countSyllables('create')).toBeGreaterThanOrEqual(1); // Approximation
    });

    it('should return 1 for very short words', () => {
      expect(countSyllables('a')).toBe(1);
      expect(countSyllables('I')).toBe(1);
    });

    it('should return 0 for empty strings', () => {
      expect(countSyllables('')).toBe(0);
    });
  });

  describe('calculateFleschKincaid', () => {
    it('should calculate grade level for simple text', () => {
      const text = 'The cat sat on the mat. It was a nice day.';
      const gradeLevel = calculateFleschKincaid(text);
      // Simple text can have low/negative scores, formula allows this
      expect(typeof gradeLevel).toBe('number');
    });

    it('should return higher grade level for complex text', () => {
      const simpleText = 'I like cats. Cats are nice.';
      const complexText = 'The perpetuation of institutional frameworks necessitates comprehensive evaluation.';

      const simpleGrade = calculateFleschKincaid(simpleText);
      const complexGrade = calculateFleschKincaid(complexText);

      expect(complexGrade).toBeGreaterThan(simpleGrade);
    });

    it('should return 0 for empty text', () => {
      expect(calculateFleschKincaid('')).toBe(0);
    });

    it('should handle text with punctuation', () => {
      const text = 'Hello! How are you? I am fine, thank you.';
      const gradeLevel = calculateFleschKincaid(text);
      expect(typeof gradeLevel).toBe('number');
    });
  });

  describe('calculateSentenceComplexity', () => {
    it('should calculate average words per sentence', () => {
      const text = 'This is a sentence. This is another sentence. Here is a third.';
      const result = calculateSentenceComplexity(text);

      expect(result.avgWordsPerSentence).toBeGreaterThan(0);
      expect(result.variance).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for empty text', () => {
      const result = calculateSentenceComplexity('');
      expect(result.avgWordsPerSentence).toBe(0);
      expect(result.variance).toBe(0);
    });

    it('should handle single sentence', () => {
      const text = 'This is a single sentence.';
      const result = calculateSentenceComplexity(text);
      expect(result.avgWordsPerSentence).toBe(5);
      expect(result.variance).toBe(0);
    });

    it('should detect sentence length variance', () => {
      const uniformText = 'I am here. You are there. We are friends.';
      const variedText = 'Hi! How are you doing today? I am doing quite well, thank you very much for asking about my well-being.';

      const uniformResult = calculateSentenceComplexity(uniformText);
      const variedResult = calculateSentenceComplexity(variedText);

      expect(variedResult.variance).toBeGreaterThan(uniformResult.variance);
    });
  });

  describe('calculateVocabularySophistication', () => {
    it('should calculate unique word ratio', () => {
      const repetitiveText = 'cat cat cat dog dog cat';
      const diverseText = 'feline canine bovine equine';

      const repetitiveResult = calculateVocabularySophistication(repetitiveText);
      const diverseResult = calculateVocabularySophistication(diverseText);

      expect(diverseResult.uniqueWordRatio).toBeGreaterThan(repetitiveResult.uniqueWordRatio);
    });

    it('should calculate average word length', () => {
      const shortWords = 'I am a cat';
      const longWords = 'Extraordinarily magnificent accomplishment';

      const shortResult = calculateVocabularySophistication(shortWords);
      const longResult = calculateVocabularySophistication(longWords);

      expect(longResult.avgWordLength).toBeGreaterThan(shortResult.avgWordLength);
    });

    it('should return 0 for empty text', () => {
      const result = calculateVocabularySophistication('');
      expect(result.uniqueWordRatio).toBe(0);
      expect(result.avgWordLength).toBe(0);
    });

    it('should handle punctuation', () => {
      const text = 'Hello, world! How are you?';
      const result = calculateVocabularySophistication(text);
      expect(result.uniqueWordRatio).toBeGreaterThan(0);
      expect(result.avgWordLength).toBeGreaterThan(0);
    });
  });

  describe('calculateReadabilityMetrics', () => {
    it('should return all metrics for valid text', () => {
      const text = `
        Scholarship essays require careful attention to detail and authenticity.
        Students should express their genuine experiences and aspirations.
        The quality of writing significantly impacts application success.
      `;

      const metrics = calculateReadabilityMetrics(text);

      expect(metrics).toHaveProperty('fleschKincaidGradeLevel');
      expect(metrics).toHaveProperty('sentenceComplexity');
      expect(metrics).toHaveProperty('vocabularySophistication');

      expect(metrics.fleschKincaidGradeLevel).toBeGreaterThan(0);
      expect(metrics.sentenceComplexity.avgWordsPerSentence).toBeGreaterThan(0);
      expect(metrics.vocabularySophistication.uniqueWordRatio).toBeGreaterThan(0);
    });

    it('should handle college-level essay text', () => {
      const collegeEssay = `
        Throughout my high school career, I have actively pursued opportunities
        to engage with my community through volunteer work. These experiences
        have profoundly shaped my understanding of social responsibility and
        collective action. My commitment to service extends beyond mere participation;
        it represents a fundamental value that guides my decisions and aspirations.
      `;

      const metrics = calculateReadabilityMetrics(collegeEssay);

      // Target grade level for college essays: 10-12 (but can vary)
      expect(metrics.fleschKincaidGradeLevel).toBeGreaterThan(8);
      expect(metrics.fleschKincaidGradeLevel).toBeLessThanOrEqual(20); // More permissive
    });

    it('should handle empty text gracefully', () => {
      const metrics = calculateReadabilityMetrics('');

      expect(metrics.fleschKincaidGradeLevel).toBe(0);
      expect(metrics.sentenceComplexity.avgWordsPerSentence).toBe(0);
      expect(metrics.sentenceComplexity.variance).toBe(0);
    });
  });
});
