import { z } from "zod";

// ==========================================
// 1. TASK CONTEXT DEFINITIONS
// ==========================================

export interface WritingTaskContext {
  testId: string;
  partNumber: 1 | 2 | 3 | 4;
  taskType:
    | "form-filling-personal"
    | "short-personal-text"
    | "social-network-chat"
    | "informal-email"
    | "formal-email";
  taskId?: string;
  instructions: string;
  clubContext?: string;
  managerNotice?: string;
  prompt: string;
  wordGuidance: {
    officialGuidance: string;
    minWords?: number;
    maxWords?: number;
  };
  recipient?: string;
  register?: "informal" | "formal" | "neutral";
}

// ==========================================
// 2. INPUT VALIDATION SCHEMAS
// ==========================================

export const WritingGradingInputSchema = z
  .object({
    testId: z.string().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/),
    partNumber: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
    ]),
    taskId: z.string().optional(),
    submissionText: z.string().max(20_000).optional(),
    response: z.string().max(20_000).optional(),
    userId: z.string().optional(),
    userResponses: z
      .record(z.string().max(100), z.string().max(20_000))
      .refine((responses) => Object.keys(responses).length <= 20, {
        message: "Too many response fields",
      })
      .optional(),
  })
  .refine((data) => Boolean(data.submissionText || data.response || data.userResponses), {
    message: "Either submissionText, response, or userResponses must be provided",
  })
  .transform((data) => ({
    ...data,
    submissionText: data.submissionText || data.response,
  }));

export type WritingGradingInput = z.infer<typeof WritingGradingInputSchema>;

// ==========================================
// 3. STRUCTURED GEMINI OUTPUT SCHEMAS
// ==========================================

export const WritingCriterionScoreSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(5),
  maxScore: z.number().default(5),
  feedback: z.string(),
});

export const GrammarCorrectionSchema = z.object({
  originalSentence: z.string(),
  correctedSentence: z.string(),
  errorCategory: z.string().optional().default("Grammar"),
  explanation: z.string(),
  linkedKnowledge: z.array(z.string()).optional().default([]),
});

export const VocabularyUpgradeSchema = z.object({
  originalPhrase: z.string(),
  upgradedPhrase: z.string(),
  rationale: z.string(),
});

export const GeminiWritingOutputSchema = z.object({
  overallScore: z.number().min(0),
  maxOverallScore: z.number().default(20),
  estimatedBand: z.enum(["A0", "A1", "A2", "B1", "B2", "C"]),
  criteria: z.array(WritingCriterionScoreSchema),
  grammarErrors: z.array(GrammarCorrectionSchema),
  vocabularyUpgrades: z.array(VocabularyUpgradeSchema),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  modelAnswer: z.string(),
  correctedVersion: z.string().optional(),
  improvementPlan: z.array(z.string()).optional().default([]),
  linkedKnowledge: z.array(z.string()).optional().default([]),
});

export type GeminiWritingOutput = z.infer<typeof GeminiWritingOutputSchema>;

// ==========================================
// 4. FINAL CLIENT-SAFE RESULT SCHEMA
// ==========================================

export interface WritingGradingResult {
  testId: string;
  partNumber: number;
  taskType: string;
  wordCount: number;
  wordCountStatus: "under_minimum" | "within_range" | "over_maximum";
  overallScore: number;
  maxOverallScore: number;
  percentage: number;
  estimatedBand: "A0" | "A1" | "A2" | "B1" | "B2" | "C";
  scoreType: "AI_ESTIMATE";
  criteria: z.infer<typeof WritingCriterionScoreSchema>[];
  grammarErrors: z.infer<typeof GrammarCorrectionSchema>[];
  vocabularyUpgrades: z.infer<typeof VocabularyUpgradeSchema>[];
  strengths: string[];
  areasForImprovement: string[];
  modelAnswer: string;
  correctedVersion?: string;
  improvementPlan: string[];
  linkedKnowledge: string[];
  disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE";
}
