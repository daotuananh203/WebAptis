import {
  AptisPublicTestDatasetSchema,
  ServerAnswerKeySchema,
} from "./index";
import { AptisPublicTestDataset, ServerAnswerKey } from "../types";

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Validate a public Aptis test dataset against Zod schema.
 */
export function validatePublicDataset(data: unknown): ValidationResult {
  const result = AptisPublicTestDatasetSchema.safeParse(data);
  if (result.success) {
    return { valid: true };
  }
  return {
    valid: false,
    errors: result.error.issues.map(
      (issue) => `[${issue.path.join(".")}] ${issue.message}`
    ),
  };
}

/**
 * Validate a server-side answer key dataset against Zod schema.
 */
export function validateAnswerKeyDataset(data: unknown): ValidationResult {
  const result = ServerAnswerKeySchema.safeParse(data);
  if (result.success) {
    return { valid: true };
  }
  return {
    valid: false,
    errors: result.error.issues.map(
      (issue) => `[${issue.path.join(".")}] ${issue.message}`
    ),
  };
}

/**
 * Cross-validate consistency between Public Dataset and Server Answer Key:
 * 1. Checks matching testId.
 * 2. Ensures all question/item IDs in public dataset have a valid answer key representation.
 * 3. Verifies no missing answer mappings.
 */
export function validateDatasetConsistency(
  publicData: AptisPublicTestDataset,
  answerData: ServerAnswerKey
): ValidationResult {
  const errors: string[] = [];

  if (publicData.metadata.testId !== answerData.testId) {
    errors.push(
      `testId mismatch: public (${publicData.metadata.testId}) vs answerKey (${answerData.testId})`
    );
  }

  // Grammar Check
  for (const gQ of publicData.grammarVocabulary.grammar.questions) {
    if (!answerData.grammarVocabulary.grammarAnswers[gQ.id]) {
      errors.push(`Missing Grammar answer for questionId: ${gQ.id}`);
    }
  }

  // Vocabulary Check
  for (const vSet of publicData.grammarVocabulary.vocabulary.sets) {
    for (const vItem of vSet.items) {
      if (!answerData.grammarVocabulary.vocabularyAnswers[vItem.id]) {
        errors.push(`Missing Vocabulary answer for itemId: ${vItem.id}`);
      }
    }
  }

  // Reading Part 1 Check
  const r1Gaps = publicData.reading.parts[0].gaps.map((g) => g.id);
  for (const gapId of r1Gaps) {
    if (!answerData.reading.part1[gapId]) {
      errors.push(`Missing Reading Part 1 answer for gapId: ${gapId}`);
    }
  }

  // Reading Part 2 Check
  const r2StoryIds = publicData.reading.parts[1].stories.map((s) => s.id);
  for (const storyId of r2StoryIds) {
    if (!answerData.reading.part2[storyId]) {
      errors.push(`Missing Reading Part 2 answer for storyId: ${storyId}`);
    }
  }

  // Reading Part 3 Check
  const r3Statements = publicData.reading.parts[2].statements.map((s) => s.id);
  for (const stmtId of r3Statements) {
    if (!answerData.reading.part3[stmtId]) {
      errors.push(`Missing Reading Part 3 answer for statementId: ${stmtId}`);
    }
  }

  // Reading Part 4 Check
  const r4Paragraphs = publicData.reading.parts[3].paragraphs.map((p) => p.id);
  for (const pId of r4Paragraphs) {
    if (!answerData.reading.part4[pId]) {
      errors.push(`Missing Reading Part 4 answer for paragraphId: ${pId}`);
    }
  }

  // Listening Part 1 Check
  const l1Tasks = publicData.listening.parts[0].tasks.map((t) => t.id);
  for (const taskId of l1Tasks) {
    if (!answerData.listening.part1[taskId]) {
      errors.push(`Missing Listening Part 1 answer for taskId: ${taskId}`);
    }
  }

  // Listening Part 2 Check
  const l2Speakers = publicData.listening.parts[1].speakers.map((s) => s.id);
  for (const spkId of l2Speakers) {
    if (!answerData.listening.part2[spkId]) {
      errors.push(`Missing Listening Part 2 answer for speakerId: ${spkId}`);
    }
  }

  // Listening Part 3 Check
  const l3Statements = publicData.listening.parts[2].statements.map((s) => s.id);
  for (const sId of l3Statements) {
    if (!answerData.listening.part3[sId]) {
      errors.push(`Missing Listening Part 3 answer for statementId: ${sId}`);
    }
  }

  // Listening Part 4 Check
  for (const mono of publicData.listening.parts[3].monologues) {
    for (const q of mono.questions) {
      if (!answerData.listening.part4[q.id]) {
        errors.push(`Missing Listening Part 4 answer for questionId: ${q.id}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
