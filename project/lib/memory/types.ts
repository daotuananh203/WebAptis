import { z } from "zod";

export interface RecurringErrorRecord {
  topicId: string;
  topicName: string;
  skill: "Grammar" | "Vocabulary" | "Reading" | "Listening" | "Writing" | "Speaking";
  errorCount: number;
  firstObserved: string;
  lastObserved: string;
  examples: string[];
}

export interface UserLearningMemory {
  userId: string;
  recurringErrors: RecurringErrorRecord[];
  weakSkillSummary: string[];
  recommendedFocusTopics: string[];
  updatedAt: string;
}

export const RecurringErrorRecordSchema = z.object({
  topicId: z.string(),
  topicName: z.string(),
  skill: z.enum(["Grammar", "Vocabulary", "Reading", "Listening", "Writing", "Speaking"]),
  errorCount: z.number().nonnegative(),
  firstObserved: z.string(),
  lastObserved: z.string(),
  examples: z.array(z.string()),
});

export const UserLearningMemorySchema = z.object({
  userId: z.string(),
  recurringErrors: z.array(RecurringErrorRecordSchema),
  weakSkillSummary: z.array(z.string()),
  recommendedFocusTopics: z.array(z.string()),
  updatedAt: z.string(),
});
