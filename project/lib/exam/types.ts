/**
 * Aptis ESOL General (B2) Domain Types
 * Defines data structures for Public Test Datasets and Server-side Answer Keys.
 * Canonical Reference: British Council Aptis ESOL General Specifications.
 */

// ==========================================
// 1. METADATA & FORMAT VERSIONING
// ==========================================

export interface FormatMetadata {
  name: "Aptis ESOL General" | "Aptis General";
  targetLevel: "B1" | "B2" | "C1";
  version: string; // e.g. "2026.1"
  sourceCheckedAt: string; // e.g. "2026-08-22"
}

export interface TestMetadata {
  testId: string;
  title: string;
  format: FormatMetadata;
  version: string;
  sourceType: "synthetic" | "project-created" | "edulife";
  sourceName?: string;
  isOfficialBritishCouncil?: boolean;
  isComplete?: boolean;
  audioStatus?: "available" | "missing";
  description: string;
  totalTimeMinutes: number; // Sum of component timings
}

// ==========================================
// 2. GRAMMAR & VOCABULARY (MANDATORY CORE)
// ==========================================

export interface GrammarQuestionPublic {
  id: string;
  questionNumber: number;
  sentence: string; // e.g. "If I had known the time, I ___ earlier."
  options: [string, string, string]; // 3 options
}

export interface GrammarSectionPublic {
  timeLimitMinutes: 25; // Combined with vocabulary
  totalQuestions: number; // Official: 25 questions
  questions: GrammarQuestionPublic[];
}

export interface VocabularySetItem {
  id: string;
  targetWordOrPrompt: string; // Word or sentence context
}

export interface VocabularySetPublic {
  id: string;
  setIndex: number;
  type: "synonyms" | "definitions" | "sentence-completion" | "collocations" | "phrasal-verbs";
  instructions: string;
  items: VocabularySetItem[]; // 5 target words/prompts per set
  options: {
    id: string;
    text: string;
  }[]; // Shared pool of 10 options per set
}

export interface VocabularySectionPublic {
  timeLimitMinutes: 25;
  totalQuestions: number; // Official: 25 questions (5 sets x 5 items)
  sets: VocabularySetPublic[];
}

export interface GrammarVocabularySectionPublic {
  officialDurationMinutes: 25;
  grammar: GrammarSectionPublic;
  vocabulary: VocabularySectionPublic;
}

// ==========================================
// 3. READING COMPONENT
// ==========================================

export interface ReadingPart1Public {
  partNumber: 1;
  taskType: "sentence-completion";
  title: string;
  instructions: string;
  textWithGaps: string; // Text containing {{gap_1}}, etc.
  gaps: {
    id: string;
    options: [string, string, string]; // 3 options per gap
  }[];
}

export interface ReadingPart2Story {
  id: string;
  anchorSentence: string; // Fixed first sentence
  sentencesToOrder: {
    id: string;
    text: string;
  }[];
}

export interface ReadingPart2Public {
  partNumber: 2;
  taskType: "text-cohesion";
  title: string;
  instructions: string;
  stories: ReadingPart2Story[]; // 2 stories
}

export interface ReadingPart3Public {
  partNumber: 3;
  taskType: "opinion-matching";
  title: string;
  instructions: string;
  topic: string;
  people: {
    id: string; // e.g. "person_a", "person_b", "person_c", "person_d"
    name: string;
    biographyText: string;
  }[];
  statements: {
    id: string;
    statement: string;
  }[]; // 7 statements
}

export interface ReadingPart4Public {
  partNumber: 4;
  taskType: "matching-headings";
  title: string;
  instructions: string;
  textTitle: string;
  headings: {
    id: string;
    headingText: string;
  }[]; // 8 headings (7 correct + 1 distractor)
  paragraphs: {
    id: string;
    paragraphIndex: number;
    text: string;
  }[]; // 7 paragraphs
}

export type ReadingPartPublic =
  | ReadingPart1Public
  | ReadingPart2Public
  | ReadingPart3Public
  | ReadingPart4Public;

export interface ReadingSectionPublic {
  officialDurationMinutes: 35;
  parts: [ReadingPart1Public, ReadingPart2Public, ReadingPart3Public, ReadingPart4Public];
}

// ==========================================
// 4. LISTENING COMPONENT
// ==========================================

export interface ListeningPlaybackRules {
  maxPlays: 2; // Official: candidates can listen twice
}

export interface ListeningAudioObject {
  type: string;
  url: string;
  status: "available" | "missing" | "VERIFIED" | "NOT_VERIFIED" | "PARTIALLY_VERIFIED" | "UNCERTAIN" | "segment";
  audioSegmentStatus?: "VERIFIED" | "NOT_VERIFIED";
  start?: number;
  end?: number;
  sha256?: string;
  duration?: number;
  cacheVersion?: string;
  source?: string;
  sharedGroupId?: string;
}

export interface ListeningPart1Task {
  id: string;
  audioUrl?: string;
  audio?: ListeningAudioObject;
  playbackRules?: ListeningPlaybackRules;
  questionNumber?: number;
  questionText: string;
  options: string[];
  sourceFile?: string;
}

export interface ListeningPart1Public {
  partNumber: 1;
  taskType: "information-recognition";
  instructions: string;
  audio?: ListeningAudioObject;
  audioUrl?: string;
  playbackRules?: ListeningPlaybackRules;
  tasks: ListeningPart1Task[];
}

export interface ListeningPart2Public {
  partNumber: 2;
  taskType: "speaker-information-matching";
  instructions: string;
  topic?: string;
  audio?: ListeningAudioObject;
  audioUrl?: string;
  playbackRules?: ListeningPlaybackRules;
  speakers: {
    id: string;
    speakerLabel: string;
  }[];
  statementOptions: {
    id: string;
    text: string;
  }[];
}

export interface ListeningPart3Public {
  partNumber: 3;
  taskType: "opinion-discussion";
  instructions: string;
  topic?: string;
  audio?: ListeningAudioObject;
  audioUrl?: string;
  playbackRules?: ListeningPlaybackRules;
  statements: {
    id: string;
    statementText: string;
    options: string[];
    audio?: ListeningAudioObject;
  }[];
}

export interface ListeningPart4Public {
  partNumber: 4;
  taskType: "extended-monologue";
  instructions: string;
  audio?: ListeningAudioObject;
  audioUrl?: string;
  playbackRules?: ListeningPlaybackRules;
  monologues: {
    id: string;
    audio?: ListeningAudioObject;
    audioUrl?: string;
    playbackRules?: ListeningPlaybackRules;
    topic: string;
    questions: {
      id: string;
      questionNumber?: number;
      questionText: string;
      options: string[];
    }[];
  }[];
}

export type ListeningPartPublic =
  | ListeningPart1Public
  | ListeningPart2Public
  | ListeningPart3Public
  | ListeningPart4Public;

export interface ListeningSectionPublic {
  officialDurationMinutes: 40;
  audio?: ListeningAudioObject;
  parts: [ListeningPart1Public, ListeningPart2Public, ListeningPart3Public, ListeningPart4Public];
}


// ==========================================
// 5. WRITING COMPONENT
// ==========================================

export interface WordGuidance {
  officialGuidance: string; // e.g. "1-5 words", "20-30 words", "around 40 words", "40-50 words", "120-150 words"
  projectValidationRule: {
    min: number;
    max: number;
    recommended?: number;
  };
}

export interface WritingPart1Public {
  partNumber: 1;
  taskType: "form-filling-personal";
  instructions: string;
  clubContext: string;
  prompts: {
    id: string;
    question: string;
    wordGuidance: WordGuidance;
  }[]; // 5 short questions
}

export interface WritingPart2Public {
  partNumber: 2;
  taskType: "short-personal-text";
  instructions: string;
  clubContext: string;
  prompt: string;
  wordGuidance: WordGuidance;
}

export interface WritingPart3Public {
  partNumber: 3;
  taskType: "social-network-chat";
  instructions: string;
  clubContext: string;
  chatMessages: {
    id: string;
    senderName: string;
    messageText: string;
    wordGuidance: WordGuidance;
  }[]; // 3 questions
}

export interface WritingPart4Public {
  partNumber: 4;
  taskType: "email-writing";
  instructions: string;
  clubContext: string;
  managerNotice: string;
  tasks: {
    taskType: "informal-email" | "formal-email";
    id: string;
    recipient: string;
    prompt: string;
    wordGuidance: WordGuidance;
  }[];
}

export type WritingPartPublic =
  | WritingPart1Public
  | WritingPart2Public
  | WritingPart3Public
  | WritingPart4Public;

export interface WritingSectionPublic {
  officialDurationMinutes: 50;
  projectSuggestedPartTimers?: {
    part1Minutes: number; // 3
    part2Minutes: number; // 7
    part3Minutes: number; // 10
    part4Minutes: number; // 30
  };
  parts: [WritingPart1Public, WritingPart2Public, WritingPart3Public, WritingPart4Public];
}

// ==========================================
// 6. SPEAKING COMPONENT
// ==========================================

export interface SpeakingPart1Public {
  partNumber: 1;
  taskType: "personal-information";
  instructions: string;
  questions: {
    id: string;
    prompt: string;
    preparationTimeSeconds: 0;
    responseTimeSeconds: 30;
  }[]; // 3 questions
}

export interface SpeakingPart2Public {
  partNumber: 2;
  taskType: "describe-recount-opinion";
  instructions: string;
  imageUrl: string;
  imageAlt: string;
  questions: {
    id: string;
    prompt: string;
    preparationTimeSeconds: 0;
    responseTimeSeconds: 45;
  }[]; // 3 questions
}

export interface SpeakingPart3Public {
  partNumber: 3;
  taskType: "compare-speculate-opinion";
  instructions: string;
  images: {
    image1Url: string;
    image1Alt: string;
    image2Url: string;
    image2Alt: string;
  };
  questions: {
    id: string;
    prompt: string;
    preparationTimeSeconds: 0;
    responseTimeSeconds: 45;
  }[]; // 3 questions
}

export interface SpeakingPart4Public {
  partNumber: 4;
  taskType: "abstract-topic-extended";
  instructions: string;
  imageUrl?: string;
  imageAlt?: string;
  topic: string;
  questions: string[]; // 3 related questions
  preparationTimeSeconds: 60;
  responseTimeSeconds: 120;
}

export type SpeakingPartPublic =
  | SpeakingPart1Public
  | SpeakingPart2Public
  | SpeakingPart3Public
  | SpeakingPart4Public;

export interface SpeakingSectionPublic {
  officialDurationMinutes: 12;
  parts: [SpeakingPart1Public, SpeakingPart2Public, SpeakingPart3Public, SpeakingPart4Public];
}

// ==========================================
// 7. ROOT PUBLIC DATASET
// ==========================================

export interface AptisPublicTestDataset {
  metadata: TestMetadata;
  grammarVocabulary: GrammarVocabularySectionPublic;
  reading: ReadingSectionPublic;
  listening: ListeningSectionPublic;
  writing: WritingSectionPublic;
  speaking: SpeakingSectionPublic;
}

// ==========================================
// 8. SERVER-SIDE PRIVATE ANSWER KEY
// ==========================================

export interface ServerAnswerKey {
  testId: string;
  version: string;
  grammarVocabulary: {
    grammarAnswers: Record<string, string>; // questionId -> correctOptionString
    vocabularyAnswers: Record<string, string>; // itemId -> optionId (e.g. "opt_v1_c")
  };
  reading: {
    part1: Record<string, string>; // gapId -> correctOption
    part2: Record<string, string[]>; // storyId -> orderedArrayOfSentenceIds
    part3: Record<string, string>; // statementId -> personId (e.g. "person_a")
    part4: Record<string, string>; // paragraphId -> headingId
  };
  listening: {
    part1: Record<string, string>; // taskId -> correctOption
    part2: Record<string, string>; // speakerId -> statementOptionId
    part3: Record<string, "Man" | "Woman" | "Both">; // statementId -> "Man" | "Woman" | "Both"
    part4: Record<string, string>; // questionId -> correctOption
  };
  scoringRules: {
    grammarMaxPoints: number; // 25
    vocabularyMaxPoints: number; // 25
    readingMaxPoints: number; // 25
    listeningMaxPoints: number; // 25 (or task points)
    disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE";
  };
}

// ==========================================
// 9. EVALUATION & CEFR BAND CONTRACT
// ==========================================

export interface PracticeEvaluationResult {
  testId: string;
  rawScore: number;
  maxRawScore: number;
  percentage: number;
  practiceScore: number; // Scaled 0-50 per component
  estimatedBand: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE";
}
