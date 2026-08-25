/**
 * Deterministic Grading Engine Domain Types
 * Strongly typed models for practice & mock test submissions and objective results.
 */

export type ItemGradingStatus = "correct" | "incorrect" | "unanswered";

export interface DeterministicItemResult {
  itemId: string;
  status: ItemGradingStatus;
  pointsEarned: number;
  maxPoints: number;
  submittedAnswer?: string | string[];
}

export interface DeterministicPartResult {
  partIdentifier: string;
  totalItems: number;
  answeredItems: number;
  correctItems: number;
  rawScore: number;
  maxRawScore: number;
  percentage: number;
  items: DeterministicItemResult[];
}

export interface DeterministicSectionResult {
  sectionName: "grammarVocabulary" | "reading" | "listening";
  rawScore: number;
  maxRawScore: number;
  percentage: number;
  parts: Record<string, DeterministicPartResult>;
}

export interface DeterministicExamResult {
  testId: string;
  totalRawScore: number;
  totalMaxRawScore: number;
  totalPercentage: number;
  sections: {
    grammarVocabulary?: DeterministicSectionResult;
    reading?: DeterministicSectionResult;
    listening?: DeterministicSectionResult;
  };
  disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE";
}

// ==========================================
// SUBMISSION INPUT TYPES
// ==========================================

export type GrammarSubmission = Record<string, string>; // questionId -> chosenOption
export type VocabularySubmission = Record<string, string>; // itemId -> chosenOptionId

export interface GrammarVocabularySubmission {
  grammar?: GrammarSubmission;
  vocabulary?: VocabularySubmission;
}

export type ReadingPart1Submission = Record<string, string>; // gapId -> chosenOption
export type ReadingPart2Submission = Record<string, string[]>; // storyId -> orderedSentenceIds
export type ReadingPart3Submission = Record<string, string>; // statementId -> chosenPersonId
export type ReadingPart4Submission = Record<string, string>; // paragraphId -> chosenHeadingId

export interface ReadingSubmission {
  part1?: ReadingPart1Submission;
  part2?: ReadingPart2Submission;
  part3?: ReadingPart3Submission;
  part4?: ReadingPart4Submission;
}

export type ListeningPart1Submission = Record<string, string>; // taskId -> chosenOption
export type ListeningPart2Submission = Record<string, string>; // speakerId -> chosenOptionId
export type ListeningPart3Submission = Record<string, "Man" | "Woman" | "Both" | string>; // statementId -> chosen
export type ListeningPart4Submission = Record<string, string>; // questionId -> chosenOption

export interface ListeningSubmission {
  part1?: ListeningPart1Submission;
  part2?: ListeningPart2Submission;
  part3?: ListeningPart3Submission;
  part4?: ListeningPart4Submission;
}

export interface DeterministicExamSubmission {
  testId: string;
  grammarVocabulary?: GrammarVocabularySubmission;
  reading?: ReadingSubmission;
  listening?: ListeningSubmission;
}
