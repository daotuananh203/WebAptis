import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ALL_EXAM_TEST_CATALOG } from "@/lib/exam/test-catalog";
import canonicalSpeakingBank from "@/data/speaking/canonical-speaking-practice-bank.json";
import { ProgressAttemptRecord } from "./types";

const DISCLAIMER = "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE" as const;

function countAnswerValues(value: unknown): number {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
  return Object.keys(value).length;
}

/** Resolve the server-owned maximum for objective progress records. */
function canonicalObjectiveMaximum(testId: string, skill: string, partIdentifier?: string): number | null {
  try {
    const answerPath = path.join(process.cwd(), `data/tests/${testId}-answers.json`);
    const answerKey = JSON.parse(fs.readFileSync(answerPath, "utf8")) as Record<string, any>;
    if (skill === "grammarVocabulary") {
      if (partIdentifier === "grammar") return countAnswerValues(answerKey.grammarVocabulary?.grammarAnswers);
      if (partIdentifier === "vocabulary") return countAnswerValues(answerKey.grammarVocabulary?.vocabularyAnswers);
      return countAnswerValues(answerKey.grammarVocabulary?.grammarAnswers) + countAnswerValues(answerKey.grammarVocabulary?.vocabularyAnswers);
    }
    if (skill === "reading" || skill === "listening") {
      const section = answerKey[skill] as Record<string, any> | undefined;
      if (!section) return null;
      const partKeys = ["part1", "part2", "part3", "part4"];
      const selected = partIdentifier ? [partIdentifier] : partKeys;
      return selected.reduce((sum, key) => {
        const part = section[key];
        if (!part) return sum;
        return sum + Object.values(part).reduce((partSum: number, expected) =>
          partSum + (Array.isArray(expected) ? expected.length : 1), 0);
      }, 0);
    }
  } catch {
    return null;
  }
  return null;
}

export const ProgressAttemptRecordSchema = z.object({
  id: z.string().trim().min(1).max(160).regex(/^[A-Za-z0-9_.:-]+$/),
  testId: z.string().trim().min(1).max(100),
  practiceItemId: z.string().trim().min(1).max(160).regex(/^[A-Za-z0-9_.:-]+$/).optional(),
  mode: z.enum(["practice", "mock-test"]),
  skill: z.enum(["grammarVocabulary", "reading", "listening", "writing", "speaking"]),
  partIdentifier: z.string().trim().min(1).max(32).regex(/^part[1-4]|^(grammar|vocabulary)$/).optional(),
  rawScore: z.number().finite().min(0),
  maxRawScore: z.number().finite().positive(),
  percentage: z.number().finite().min(0).max(100),
  durationSeconds: z.number().int().min(0).max(24 * 60 * 60).optional(),
  completedAt: z.string().datetime({ offset: true }),
  estimatedBand: z.enum(["A0", "A1", "A2", "B1", "B2", "C", "C1", "C2"]).optional(),
  totalQuestions: z.number().int().min(0).max(1000).optional(),
  correctCount: z.number().int().min(0).max(1000).optional(),
  incorrectCount: z.number().int().min(0).max(1000).optional(),
  unansweredCount: z.number().int().min(0).max(1000).optional(),
  disclaimer: z.literal(DISCLAIMER),
}).strict();

function hasCanonicalSpeakingItem(id: string): boolean {
  const bank = canonicalSpeakingBank as {
    parts?: Record<string, { questions?: Array<{ questionId?: string; topicId?: string }>; topics?: Array<{ questionId?: string; topicId?: string }> }>;
  };
  return Object.values(bank.parts ?? {}).some((part) =>
    [...(part.questions ?? []), ...(part.topics ?? [])].some((item) =>
      (item.topicId ?? item.questionId) === id,
    ),
  );
}

/** Validates both the wire shape and the server-owned catalog boundary. */
export function validateProgressAttempt(input: unknown): { success: true; data: ProgressAttemptRecord } | { success: false; error: string } {
  const parsed = ProgressAttemptRecordSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Dữ liệu tiến độ không hợp lệ" };
  const record = parsed.data;

  const isSpeakingPractice = record.testId === "speaking-practice-bank";
  if (!isSpeakingPractice && !ALL_EXAM_TEST_CATALOG.some((entry) => entry.testId === record.testId)) {
    return { success: false, error: "Bộ đề không tồn tại trong catalog" };
  }
  if (isSpeakingPractice && (!record.practiceItemId || !hasCanonicalSpeakingItem(record.practiceItemId))) {
    return { success: false, error: "Speaking practice item không tồn tại" };
  }
  if (record.skill === "speaking" && !record.practiceItemId && isSpeakingPractice) {
    return { success: false, error: "Thiếu provenance Speaking practice item" };
  }
  if (record.rawScore > record.maxRawScore) {
    return { success: false, error: "Điểm số vượt quá điểm tối đa" };
  }
  if (record.skill === "writing" || record.skill === "speaking") {
    if (record.maxRawScore > 25) return { success: false, error: "Thang điểm AI không hợp lệ" };
  } else {
    const canonicalMaximum = canonicalObjectiveMaximum(record.testId, record.skill, record.partIdentifier);
    if (canonicalMaximum !== null && record.maxRawScore !== canonicalMaximum) {
      return { success: false, error: "Thang điểm không khớp catalog" };
    }
  }
  const calculatedPercentage = (record.rawScore / record.maxRawScore) * 100;
  if (Math.abs(calculatedPercentage - record.percentage) > 0.2) {
    return { success: false, error: "Phần trăm điểm không khớp raw score" };
  }
  if (record.skill === "grammarVocabulary" && record.partIdentifier && !["grammar", "vocabulary"].includes(record.partIdentifier)) {
    return { success: false, error: "Part Grammar/Vocabulary không hợp lệ" };
  }
  if (record.skill !== "grammarVocabulary" && record.partIdentifier && !/^part[1-4]$/.test(record.partIdentifier)) {
    return { success: false, error: "Part không hợp lệ" };
  }
  return { success: true, data: record };
}
