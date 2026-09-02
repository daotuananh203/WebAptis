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
  for (const story of publicData.reading.parts[1].stories) {
    const renderedSentenceIds = story.sentencesToOrder.map((sentence) => sentence.id);
    const expectedOrder = answerData.reading.part2[story.id] ?? [];
    if (new Set(renderedSentenceIds).size !== renderedSentenceIds.length) {
      errors.push(`Duplicate Reading Part 2 sentence IDs in storyId: ${story.id}`);
    }
    if (expectedOrder.length !== renderedSentenceIds.length) {
      errors.push(`Reading Part 2 answer length mismatch for storyId: ${story.id}`);
    }
    for (const sentenceId of expectedOrder) {
      if (!renderedSentenceIds.includes(sentenceId)) {
        errors.push(`Reading Part 2 answer references non-rendered sentenceId: ${sentenceId}`);
      }
    }
    if (story.sentencesToOrder.some((sentence) => sentence.text.trim() === story.anchorSentence.trim())) {
      errors.push(`Reading Part 2 anchor is duplicated as an orderable sentence in storyId: ${story.id}`);
    }
  }

  // Reading Part 3 Check
  const r3Statements = publicData.reading.parts[2].statements.map((s) => s.id);
  for (const stmtId of r3Statements) {
    if (!answerData.reading.part3[stmtId]) {
      errors.push(`Missing Reading Part 3 answer for statementId: ${stmtId}`);
    }
  }
  const readingPart3 = publicData.reading.parts[2] as typeof publicData.reading.parts[2] & {
    people?: Array<{ id: string; biographyText: string }>;
  };
  const people = readingPart3.people ?? [];
  const peopleIds = new Set(people.map((person) => person.id));
  for (const person of people) {
    if (!person.biographyText.trim()) errors.push(`Empty Reading Part 3 person block: ${person.id}`);
  }
  for (const [statementId, answer] of Object.entries(answerData.reading.part3)) {
    if (!r3Statements.includes(statementId)) errors.push(`Reading Part 3 answer references non-rendered statementId: ${statementId}`);
    if (!peopleIds.has(answer)) errors.push(`Reading Part 3 answer references non-rendered personId: ${answer}`);
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

  if (publicData.metadata.audioStatus === "available") {
    const audioEntries = publicData.listening.parts.flatMap((part: any) => [
      part.audio,
      ...(part.tasks ?? []).map((task: any) => task.audio),
      ...(part.speakers ?? []).map((speaker: any) => speaker.audio),
      ...(part.statements ?? []).map((statement: any) => statement.audio),
      ...(part.monologues ?? []).flatMap((mono: any) => [
        mono.audio,
        ...(mono.questions ?? []).map((question: any) => question.audio),
      ]),
    ]).filter(Boolean);
    for (const entry of audioEntries) {
      if (!entry.url || (entry.status && entry.status !== "VERIFIED")) {
        errors.push(`Listening metadata says available but audio is not verified: ${entry.id ?? "shared-audio"}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
