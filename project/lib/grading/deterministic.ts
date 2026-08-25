/**
 * Deterministic Grading Engine Core
 * Pure, strongly typed grading functions for Grammar & Vocabulary, Reading, and Listening.
 * Reference: British Council Aptis ESOL General Objective Evaluation Rules.
 */

import { ServerAnswerKey } from "../exam/types";
import { createGradingError } from "./errors";
import { normalizeId, normalizeString, normalizeStringArray } from "./normalize";
import {
  DeterministicExamResult,
  DeterministicExamSubmission,
  DeterministicItemResult,
  DeterministicPartResult,
  DeterministicSectionResult,
  GrammarSubmission,
  GrammarVocabularySubmission,
  ItemGradingStatus,
  ListeningPart1Submission,
  ListeningPart2Submission,
  ListeningPart3Submission,
  ListeningPart4Submission,
  ListeningSubmission,
  ReadingPart1Submission,
  ReadingPart2Submission,
  ReadingPart3Submission,
  ReadingPart4Submission,
  ReadingSubmission,
  VocabularySubmission,
} from "./types";

// ==========================================
// 1. HELPER PURE GRADERS
// ==========================================

/**
 * Grade a single discrete multiple choice or direct matching item.
 */
export function gradeSingleChoiceItem(
  itemId: string,
  submitted: unknown,
  correct: string,
  maxPoints = 1
): DeterministicItemResult {
  const normItemId = normalizeId(itemId);
  const normSubmitted = normalizeString(submitted);
  const normCorrect = normalizeString(correct);

  if (!normSubmitted) {
    return {
      itemId: normItemId,
      status: "unanswered",
      pointsEarned: 0,
      maxPoints,
    };
  }

  const isCorrect = normSubmitted.toLowerCase() === normCorrect.toLowerCase();

  return {
    itemId: normItemId,
    status: isCorrect ? "correct" : "incorrect",
    pointsEarned: isCorrect ? maxPoints : 0,
    maxPoints,
    submittedAnswer: normSubmitted,
  };
}

/**
 * Grade a sentence ordering story (Reading Part 2).
 * Each correctly positioned sentence earns 1 point.
 */
export function gradeOrderingStory(
  storyId: string,
  submitted: unknown,
  correctOrder: string[]
): DeterministicItemResult {
  const normStoryId = normalizeId(storyId);
  const normSubmitted = normalizeStringArray(submitted);
  const normCorrect = normalizeStringArray(correctOrder);
  const maxPoints = normCorrect.length;

  if (normSubmitted.length === 0) {
    return {
      itemId: normStoryId,
      status: "unanswered",
      pointsEarned: 0,
      maxPoints,
    };
  }

  let pointsEarned = 0;
  for (let i = 0; i < normCorrect.length; i++) {
    if (i < normSubmitted.length && normSubmitted[i] === normCorrect[i]) {
      pointsEarned += 1;
    }
  }

  const status: ItemGradingStatus = pointsEarned === maxPoints ? "correct" : "incorrect";

  return {
    itemId: normStoryId,
    status,
    pointsEarned,
    maxPoints,
    submittedAnswer: normSubmitted,
  };
}

/**
 * Calculate aggregate statistics for a part from its item results.
 */
function aggregatePartResult(
  partIdentifier: string,
  items: DeterministicItemResult[]
): DeterministicPartResult {
  const totalItems = items.length;
  let answeredItems = 0;
  let correctItems = 0;
  let rawScore = 0;
  let maxRawScore = 0;

  for (const item of items) {
    maxRawScore += item.maxPoints;
    rawScore += item.pointsEarned;
    if (item.status !== "unanswered") {
      answeredItems += 1;
    }
    if (item.status === "correct") {
      correctItems += 1;
    }
  }

  const percentage = maxRawScore > 0 ? (rawScore / maxRawScore) * 100 : 0;

  return {
    partIdentifier,
    totalItems,
    answeredItems,
    correctItems,
    rawScore,
    maxRawScore,
    percentage,
    items,
  };
}

// ==========================================
// 2. GRAMMAR & VOCABULARY GRADERS
// ==========================================

export function gradeGrammarPart(
  submission: GrammarSubmission = {},
  expectedAnswers: Record<string, string>
): DeterministicPartResult {
  const expectedKeys = Object.keys(expectedAnswers);
  if (expectedKeys.length === 0) {
    throw createGradingError("MISSING_ANSWER_KEY", "Grammar answer key is empty");
  }

  const items: DeterministicItemResult[] = [];
  for (const qId of expectedKeys) {
    const correct = expectedAnswers[qId];
    const userAns = submission[qId];
    items.push(gradeSingleChoiceItem(qId, userAns, correct, 1));
  }

  return aggregatePartResult("grammar", items);
}

export function gradeVocabularyPart(
  submission: VocabularySubmission = {},
  expectedAnswers: Record<string, string>
): DeterministicPartResult {
  const expectedKeys = Object.keys(expectedAnswers);
  if (expectedKeys.length === 0) {
    throw createGradingError("MISSING_ANSWER_KEY", "Vocabulary answer key is empty");
  }

  const items: DeterministicItemResult[] = [];
  for (const itemId of expectedKeys) {
    const correct = expectedAnswers[itemId];
    const userAns = submission[itemId];
    items.push(gradeSingleChoiceItem(itemId, userAns, correct, 1));
  }

  return aggregatePartResult("vocabulary", items);
}

export function gradeGrammarVocabularySection(
  submission: GrammarVocabularySubmission = {},
  answerKey: ServerAnswerKey["grammarVocabulary"]
): DeterministicSectionResult {
  const grammarPart = gradeGrammarPart(submission.grammar, answerKey.grammarAnswers);
  const vocabPart = gradeVocabularyPart(submission.vocabulary, answerKey.vocabularyAnswers);

  const rawScore = grammarPart.rawScore + vocabPart.rawScore;
  const maxRawScore = grammarPart.maxRawScore + vocabPart.maxRawScore;
  const percentage = maxRawScore > 0 ? (rawScore / maxRawScore) * 100 : 0;

  return {
    sectionName: "grammarVocabulary",
    rawScore,
    maxRawScore,
    percentage,
    parts: {
      grammar: grammarPart,
      vocabulary: vocabPart,
    },
  };
}

// ==========================================
// 3. READING GRADERS
// ==========================================

export function gradeReadingPart1(
  submission: ReadingPart1Submission = {},
  expectedAnswers: Record<string, string>
): DeterministicPartResult {
  const expectedKeys = Object.keys(expectedAnswers);
  if (expectedKeys.length === 0) {
    throw createGradingError("MISSING_ANSWER_KEY", "Reading Part 1 answer key is empty");
  }

  const items = expectedKeys.map((gapId) =>
    gradeSingleChoiceItem(gapId, submission[gapId], expectedAnswers[gapId], 1)
  );

  return aggregatePartResult("reading_part1", items);
}

export function gradeReadingPart2(
  submission: ReadingPart2Submission = {},
  expectedAnswers: Record<string, string[]>
): DeterministicPartResult {
  const storyIds = Object.keys(expectedAnswers);
  if (storyIds.length === 0) {
    throw createGradingError("MISSING_ANSWER_KEY", "Reading Part 2 answer key is empty");
  }

  const items = storyIds.map((sId) =>
    gradeOrderingStory(sId, submission[sId], expectedAnswers[sId])
  );

  return aggregatePartResult("reading_part2", items);
}

export function gradeReadingPart3(
  submission: ReadingPart3Submission = {},
  expectedAnswers: Record<string, string>
): DeterministicPartResult {
  const statementIds = Object.keys(expectedAnswers);
  if (statementIds.length === 0) {
    throw createGradingError("MISSING_ANSWER_KEY", "Reading Part 3 answer key is empty");
  }

  const items = statementIds.map((sId) =>
    gradeSingleChoiceItem(sId, submission[sId], expectedAnswers[sId], 1)
  );

  return aggregatePartResult("reading_part3", items);
}

export function gradeReadingPart4(
  submission: ReadingPart4Submission = {},
  expectedAnswers: Record<string, string>
): DeterministicPartResult {
  const paragraphIds = Object.keys(expectedAnswers);
  if (paragraphIds.length === 0) {
    throw createGradingError("MISSING_ANSWER_KEY", "Reading Part 4 answer key is empty");
  }

  const items = paragraphIds.map((pId) =>
    gradeSingleChoiceItem(pId, submission[pId], expectedAnswers[pId], 1)
  );

  return aggregatePartResult("reading_part4", items);
}

export function gradeReadingSection(
  submission: ReadingSubmission = {},
  answerKey: ServerAnswerKey["reading"]
): DeterministicSectionResult {
  const part1 = gradeReadingPart1(submission.part1, answerKey.part1);
  const part2 = gradeReadingPart2(submission.part2, answerKey.part2);
  const part3 = gradeReadingPart3(submission.part3, answerKey.part3);
  const part4 = gradeReadingPart4(submission.part4, answerKey.part4);

  const rawScore = part1.rawScore + part2.rawScore + part3.rawScore + part4.rawScore;
  const maxRawScore =
    part1.maxRawScore + part2.maxRawScore + part3.maxRawScore + part4.maxRawScore;
  const percentage = maxRawScore > 0 ? (rawScore / maxRawScore) * 100 : 0;

  return {
    sectionName: "reading",
    rawScore,
    maxRawScore,
    percentage,
    parts: {
      part1,
      part2,
      part3,
      part4,
    },
  };
}

// ==========================================
// 4. LISTENING GRADERS
// ==========================================

export function gradeListeningPart1(
  submission: ListeningPart1Submission = {},
  expectedAnswers: Record<string, string>
): DeterministicPartResult {
  const taskIds = Object.keys(expectedAnswers);
  if (taskIds.length === 0) {
    throw createGradingError("MISSING_ANSWER_KEY", "Listening Part 1 answer key is empty");
  }

  const items = taskIds.map((tId) =>
    gradeSingleChoiceItem(tId, submission[tId], expectedAnswers[tId], 1)
  );

  return aggregatePartResult("listening_part1", items);
}

export function gradeListeningPart2(
  submission: ListeningPart2Submission = {},
  expectedAnswers: Record<string, string>
): DeterministicPartResult {
  const speakerIds = Object.keys(expectedAnswers);
  if (speakerIds.length === 0) {
    throw createGradingError("MISSING_ANSWER_KEY", "Listening Part 2 answer key is empty");
  }

  const items = speakerIds.map((sId) =>
    gradeSingleChoiceItem(sId, submission[sId], expectedAnswers[sId], 1)
  );

  return aggregatePartResult("listening_part2", items);
}

export function gradeListeningPart3(
  submission: ListeningPart3Submission = {},
  expectedAnswers: Record<string, string>
): DeterministicPartResult {
  const stmtIds = Object.keys(expectedAnswers);
  if (stmtIds.length === 0) {
    throw createGradingError("MISSING_ANSWER_KEY", "Listening Part 3 answer key is empty");
  }

  const items = stmtIds.map((sId) =>
    gradeSingleChoiceItem(sId, submission[sId], expectedAnswers[sId], 1)
  );

  return aggregatePartResult("listening_part3", items);
}

export function gradeListeningPart4(
  submission: ListeningPart4Submission = {},
  expectedAnswers: Record<string, string>
): DeterministicPartResult {
  const questionIds = Object.keys(expectedAnswers);
  if (questionIds.length === 0) {
    throw createGradingError("MISSING_ANSWER_KEY", "Listening Part 4 answer key is empty");
  }

  const items = questionIds.map((qId) =>
    gradeSingleChoiceItem(qId, submission[qId], expectedAnswers[qId], 1)
  );

  return aggregatePartResult("listening_part4", items);
}

export function gradeListeningSection(
  submission: ListeningSubmission = {},
  answerKey: ServerAnswerKey["listening"]
): DeterministicSectionResult {
  const part1 = gradeListeningPart1(submission.part1, answerKey.part1);
  const part2 = gradeListeningPart2(submission.part2, answerKey.part2);
  const part3 = gradeListeningPart3(submission.part3, answerKey.part3);
  const part4 = gradeListeningPart4(submission.part4, answerKey.part4);

  const rawScore = part1.rawScore + part2.rawScore + part3.rawScore + part4.rawScore;
  const maxRawScore =
    part1.maxRawScore + part2.maxRawScore + part3.maxRawScore + part4.maxRawScore;
  const percentage = maxRawScore > 0 ? (rawScore / maxRawScore) * 100 : 0;

  return {
    sectionName: "listening",
    rawScore,
    maxRawScore,
    percentage,
    parts: {
      part1,
      part2,
      part3,
      part4,
    },
  };
}

// ==========================================
// 5. MASTER EXAM DETERMINISTIC ORCHESTRATOR
// ==========================================

export function gradeDeterministicExam(
  submission: DeterministicExamSubmission,
  answerKey: ServerAnswerKey
): DeterministicExamResult {
  if (!submission || typeof submission !== "object") {
    throw createGradingError("INVALID_SUBMISSION", "Submission must be an object");
  }
  if (!answerKey || typeof answerKey !== "object") {
    throw createGradingError("INVALID_ANSWER_KEY", "Answer key must be an object");
  }
  if (submission.testId !== answerKey.testId) {
    throw createGradingError(
      "INVALID_SUBMISSION",
      `testId mismatch: submission (${submission.testId}) vs answerKey (${answerKey.testId})`
    );
  }

  const sections: DeterministicExamResult["sections"] = {};
  let totalRawScore = 0;
  let totalMaxRawScore = 0;

  // Grade Grammar & Vocabulary if provided
  if (submission.grammarVocabulary || answerKey.grammarVocabulary) {
    const gvResult = gradeGrammarVocabularySection(
      submission.grammarVocabulary,
      answerKey.grammarVocabulary
    );
    sections.grammarVocabulary = gvResult;
    totalRawScore += gvResult.rawScore;
    totalMaxRawScore += gvResult.maxRawScore;
  }

  // Grade Reading if provided
  if (submission.reading || answerKey.reading) {
    const readingResult = gradeReadingSection(submission.reading, answerKey.reading);
    sections.reading = readingResult;
    totalRawScore += readingResult.rawScore;
    totalMaxRawScore += readingResult.maxRawScore;
  }

  // Grade Listening if provided
  if (submission.listening || answerKey.listening) {
    const listeningResult = gradeListeningSection(submission.listening, answerKey.listening);
    sections.listening = listeningResult;
    totalRawScore += listeningResult.rawScore;
    totalMaxRawScore += listeningResult.maxRawScore;
  }

  const totalPercentage =
    totalMaxRawScore > 0 ? (totalRawScore / totalMaxRawScore) * 100 : 0;

  return {
    testId: submission.testId,
    totalRawScore,
    totalMaxRawScore,
    totalPercentage,
    sections,
    disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
  };
}
