/**
 * Essay and Prompt Analysis Types
 * Story 4.6 - Essay Prompt Analysis
 */

export interface PromptTheme {
  name: string;
  importance: "primary" | "secondary";
  explanation: string;
  examples: string[];
}

export interface RequiredElement {
  element: string;
  mandatory: boolean;
  description: string;
  examples: string[];
}

export interface ToneExpectations {
  expected: "Personal & Reflective" | "Formal" | "Inspirational" | "Academic";
  description: string;
  examplePhrases: string[];
  avoid: string[];
}

export interface StructureSection {
  section: string;
  content: string;
  wordCount: number;
  guidance: string;
}

export interface SuggestedStructure {
  outline: StructureSection[];
  flow: string;
}

export interface DosAndDonts {
  dos: string[];
  donts: string[];
}

export interface ExamplePattern {
  pattern: string;
  effectiveness: string;
}

export interface WordCountTarget {
  min: number;
  max: number;
  optimal: number;
  extracted: boolean;
}

export interface PromptAnalysis {
  themes: PromptTheme[];
  requiredElements: RequiredElement[];
  tone: ToneExpectations;
  suggestedStructure: SuggestedStructure;
  strategicAdvice: string[];
  dosAndDonts: DosAndDonts;
  examplePatterns: ExamplePattern[];
  wordCountTarget: WordCountTarget;
  competitiveInsights: string;
  analyzedAt: Date;
  promptHash: string;
}

export type EssayPhase =
  | "DISCOVERY"
  | "STRUCTURE"
  | "DRAFTING"
  | "REVISION"
  | "POLISH"
  | "FINALIZATION";
