import { z } from "zod";

// ==========================================
// 1. TASK CONTEXT DEFINITIONS
// ==========================================

export interface SpeakingTaskContext {
  testId: string;
  /** Canonical Practice Bank item. Mock tests leave this undefined. */
  practiceItemId?: string;
  partNumber: 1 | 2 | 3 | 4;
  taskType:
    | "personal-information"
    | "describe-recount-opinion"
    | "compare-speculate-opinion"
    | "abstract-topic-extended";
  taskId?: string;
  instructions: string;
  prompt: string | string[];
  topic?: string;
  imageUrls?: string[];
  preparationTimeSeconds: number;
  responseTimeSeconds: number;
}

// ==========================================
// 2. INPUT VALIDATION SCHEMAS
// ==========================================

export const AllowedSpeakingMimeTypes = [
  "audio/webm",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
  "audio/mpeg",
  "audio/x-m4a",
  "audio/aac",
] as const;

export const SpeakingGradingInputSchema = z.object({
  testId: z.string().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/),
  practiceItemId: z.string().min(1).max(160).regex(/^[A-Za-z0-9_-]+$/).optional(),
  partNumber: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
  ]),
  taskId: z.string().optional(),
  userId: z.string().optional(),
  audioBase64: z
    .string()
    .min(1, "Audio payload cannot be empty")
    .max(14_000_000, "Audio payload is too large"),
  mimeType: z.enum(AllowedSpeakingMimeTypes).default("audio/webm"),
  durationSeconds: z.number().nonnegative().optional(),
  clientTranscript: z.string().max(20_000).optional(),
});

export type SpeakingGradingInput = z.infer<typeof SpeakingGradingInputSchema>;

// ==========================================
// 3. STRUCTURED GEMINI OUTPUT SCHEMAS
// ==========================================

export const PronunciationFeedbackSchema = z.object({
  soundOrWord: z.string(),
  issue: z.string(),
  advice: z.string(),
});

export const SpokenGrammarErrorSchema = z.object({
  spokenPhrase: z.string(),
  correctedPhrase: z.string(),
  errorCategory: z.string().optional().default("Grammar"),
  explanation: z.string(),
  linkedKnowledge: z.array(z.string()).optional().default([]),
});

export const SpokenVocabularyUpgradeSchema = z.object({
  originalSpoken: z.string(),
  upgradedAlternative: z.string(),
  context: z.string(),
});

export const SpeakingCriterionFeedbackSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(5),
  maxScore: z.literal(5),
  feedback: z.string(),
});

export const GeminiSpeakingOutputSchema = z.object({
  audioQuality: z.enum(["sufficient", "insufficient"]),
  audioQualityReason: z.string().nullable().optional().transform((v) => v ?? undefined),
  overallScore: z.number().min(0).max(25),
  maxOverallScore: z.number().positive(),
  estimatedBand: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  criteria: z.array(SpeakingCriterionFeedbackSchema).min(1),
  pronunciationFeedback: z.array(PronunciationFeedbackSchema),
  spokenGrammarErrors: z.array(SpokenGrammarErrorSchema),
  vocabularyUpgrades: z.array(SpokenVocabularyUpgradeSchema),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  transcript: z.string(),
  improvementPlan: z.array(z.string()).optional().default([]),
  linkedKnowledge: z.array(z.string()).optional().default([]),
});

export type GeminiSpeakingOutput = z.infer<typeof GeminiSpeakingOutputSchema>;

// ==========================================
// 4. FINAL CLIENT-SAFE RESULT SCHEMA
// ==========================================

export interface SpeakingGradingResult {
  testId: string;
  practiceItemId?: string;
  taskId?: string;
  partNumber: number;
  taskType: string;
  audioQuality: "sufficient" | "insufficient";
  audioQualityReason?: string;
  overallScore: number;
  maxOverallScore: number;
  percentage: number;
  estimatedBand: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  scoreType: "AI_ESTIMATE";
  criteria: z.infer<typeof SpeakingCriterionFeedbackSchema>[];
  pronunciationFeedback: z.infer<typeof PronunciationFeedbackSchema>[];
  pronunciationStatus: "pedagogical_estimate" | "not_available";
  fluencyStatus: "available" | "not_available";
  spokenGrammarErrors: z.infer<typeof SpokenGrammarErrorSchema>[];
  vocabularyUpgrades: z.infer<typeof SpokenVocabularyUpgradeSchema>[];
  strengths: string[];
  areasForImprovement: string[];
  improvementPlan: string[];
  linkedKnowledge: string[];
  transcript: string;
  transcriptStatus: "available" | "unavailable" | "failed";
  transcriptNotice: "AI-generated transcript — not guaranteed verbatim";
  disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE";
}
