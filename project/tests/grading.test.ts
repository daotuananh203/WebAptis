import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  gradeGrammarPart,
  gradeVocabularyPart,
  gradeGrammarVocabularySection,
  gradeReadingPart1,
  gradeReadingPart2,
  gradeReadingPart3,
  gradeReadingPart4,
  gradeReadingSection,
  gradeListeningPart1,
  gradeListeningPart2,
  gradeListeningPart3,
  gradeListeningPart4,
  gradeListeningSection,
  gradeDeterministicExam,
  gradeSingleChoiceItem,
  gradeOrderingStory,
} from "../lib/grading/deterministic";
import { normalizeString, normalizeStringArray, normalizeId } from "../lib/grading/normalize";
import { countWords } from "../lib/grading/word-counter";
import { ServerAnswerKey } from "../lib/exam/types";

const answersPath = path.join(
  import.meta.dirname,
  "../data/tests/aptis-b2-01-answers.json"
);
const rawAnswers = fs.readFileSync(answersPath, "utf-8");
const serverAnswerKey: ServerAnswerKey = JSON.parse(rawAnswers);

export function runGradingTests() {
  console.log("▶ [TEST 3] Running Deterministic Grading Engine Unit Tests...");

  // ----------------------------------------------------
  // 0. Normalization & Word Counter Utility Tests
  // ----------------------------------------------------
  {
    // normalizeString
    assert.equal(normalizeString("  Hello World  "), "Hello World");
    assert.equal(normalizeString(""), "");
    assert.equal(normalizeString(null as any), "");
    assert.equal(normalizeString(undefined as any), "");
    assert.equal(normalizeString(123 as any), "");

    // normalizeStringArray
    assert.deepEqual(normalizeStringArray(["  apple ", "banana  ", 123 as any, null as any]), ["apple", "banana"]);
    assert.deepEqual(normalizeStringArray(null as any), []);
    assert.deepEqual(normalizeStringArray(undefined as any), []);
    assert.deepEqual(normalizeStringArray("not-an-array" as any), []);

    // normalizeId
    assert.equal(normalizeId("  q1_id  "), "q1_id");
    assert.equal(normalizeId(""), "");
    assert.equal(normalizeId(null as any), "");
    assert.equal(normalizeId(123 as any), "");

    // countWords
    assert.equal(countWords(""), 0);
    assert.equal(countWords("   "), 0);
    assert.equal(countWords("\n\t  "), 0);
    assert.equal(countWords("Hello world"), 2);
    assert.equal(countWords("  The   quick   brown  fox  \n jumps over "), 6);
    assert.equal(countWords("One"), 1);
  }

  // ----------------------------------------------------
  // 1. Single Item Graders & Normalization
  // ----------------------------------------------------
  {
    // Exact match
    const r1 = gradeSingleChoiceItem("q1", "would not have left", "would not have left", 1);
    assert.equal(r1.status, "correct");
    assert.equal(r1.pointsEarned, 1);
    assert.equal(r1.itemId, "q1");

    // Case & whitespace tolerance
    const r2 = gradeSingleChoiceItem("q1", "  Would Not Have Left  ", "would not have left", 1);
    assert.equal(r2.status, "correct");
    assert.equal(r2.pointsEarned, 1);

    // Incorrect answer
    const r3 = gradeSingleChoiceItem("q1", "had not left", "would not have left", 1);
    assert.equal(r3.status, "incorrect");
    assert.equal(r3.pointsEarned, 0);

    // Unanswered (empty string / undefined)
    const r4 = gradeSingleChoiceItem("q1", "", "would not have left", 1);
    assert.equal(r4.status, "unanswered");
    assert.equal(r4.pointsEarned, 0);

    const r5 = gradeSingleChoiceItem("q1", undefined, "would not have left", 1);
    assert.equal(r5.status, "unanswered");
    assert.equal(r5.pointsEarned, 0);

    const r6 = gradeSingleChoiceItem("q1", "   ", "would not have left", 1);
    assert.equal(r6.status, "unanswered");
    assert.equal(r6.pointsEarned, 0);
  }

  // ----------------------------------------------------
  // 2. Sentence Ordering (Reading Part 2)
  // ----------------------------------------------------
  {
    const correctOrder = ["s1", "s2", "s3", "s4", "s5"];

    // 100% correct order
    const o1 = gradeOrderingStory("story_1", ["s1", "s2", "s3", "s4", "s5"], correctOrder);
    assert.equal(o1.status, "correct");
    assert.equal(o1.pointsEarned, 5);

    // Partial correct positions (e.g. s1 and s2 correct, others swapped)
    const o2 = gradeOrderingStory("story_1", ["s1", "s2", "s5", "s4", "s3"], correctOrder);
    assert.equal(o2.status, "incorrect");
    assert.equal(o2.pointsEarned, 3);

    // Completely wrong
    const o3 = gradeOrderingStory("story_1", ["s5", "s4", "s2", "s1", "s3"], correctOrder);
    assert.equal(o3.status, "incorrect");
    assert.equal(o3.pointsEarned, 0);

    // Unanswered
    const o4 = gradeOrderingStory("story_1", [], correctOrder);
    assert.equal(o4.status, "unanswered");
    assert.equal(o4.pointsEarned, 0);

    // Submitted order with fewer items than correct order
    const o5 = gradeOrderingStory("story_1", ["s1", "s2"], correctOrder);
    assert.equal(o5.status, "incorrect");
    assert.equal(o5.pointsEarned, 2);

    // Submitted order with duplicate / extra items
    const o6 = gradeOrderingStory("story_1", ["s1", "s1", "s1", "s1", "s1"], correctOrder);
    assert.equal(o6.status, "incorrect");
    assert.equal(o6.pointsEarned, 1);
  }

  // ----------------------------------------------------
  // 3. Grammar Component Grading
  // ----------------------------------------------------
  {
    const grammarAnswers = serverAnswerKey.grammarVocabulary.grammarAnswers;

    // All correct
    const resAll = gradeGrammarPart(grammarAnswers, grammarAnswers);
    assert.equal(resAll.totalItems, 25);
    assert.equal(resAll.correctItems, 25);
    assert.equal(resAll.rawScore, 25);

    // Partial correct
    const partialUserAnswers: Record<string, string> = {};
    Object.keys(grammarAnswers).forEach((key, index) => {
      if (index < 15) {
        partialUserAnswers[key] = grammarAnswers[key];
      } else {
        partialUserAnswers[key] = "WRONG_ANSWER";
      }
    });

    const resPartial = gradeGrammarPart(partialUserAnswers, grammarAnswers);
    assert.equal(resPartial.correctItems, 15);
    assert.equal(resPartial.rawScore, 15);
  }

  // ----------------------------------------------------
  // 4. Vocabulary Component Grading
  // ----------------------------------------------------
  {
    const vocabAnswers = serverAnswerKey.grammarVocabulary.vocabularyAnswers;

    const resVocab = gradeVocabularyPart(vocabAnswers, vocabAnswers);
    assert.equal(resVocab.totalItems, 25);
    assert.equal(resVocab.correctItems, 25);
    assert.equal(resVocab.rawScore, 25);

    // Full section combined
    const gvSection = gradeGrammarVocabularySection(
      {
        grammar: serverAnswerKey.grammarVocabulary.grammarAnswers,
        vocabulary: vocabAnswers,
      },
      serverAnswerKey.grammarVocabulary
    );
    assert.equal(gvSection.rawScore, 50);
    assert.equal(gvSection.maxRawScore, 50);
    assert.equal(gvSection.percentage, 100);
    assert.equal(gvSection.sectionName, "grammarVocabulary");
  }

  // ----------------------------------------------------
  // 5. Reading Section (Parts 1–4)
  // ----------------------------------------------------
  {
    const rAnswers = serverAnswerKey.reading;

    // Part 1
    const p1 = gradeReadingPart1(rAnswers.part1, rAnswers.part1);
    assert.equal(p1.correctItems, Object.keys(rAnswers.part1).length);

    // Part 2
    const p2 = gradeReadingPart2(rAnswers.part2, rAnswers.part2);
    assert.equal(p2.items.length, Object.keys(rAnswers.part2).length);

    // Part 3
    const p3 = gradeReadingPart3(rAnswers.part3, rAnswers.part3);
    assert.equal(p3.correctItems, Object.keys(rAnswers.part3).length);

    // Part 4
    const p4 = gradeReadingPart4(rAnswers.part4, rAnswers.part4);
    assert.equal(p4.correctItems, Object.keys(rAnswers.part4).length);

    // Full Reading Section
    const readingRes = gradeReadingSection(rAnswers, rAnswers);
    assert.equal(readingRes.rawScore, 27);
    assert.equal(readingRes.maxRawScore, 27);
    assert.equal(readingRes.percentage, 100);
    assert.equal(readingRes.sectionName, "reading");
  }

  // ----------------------------------------------------
  // 6. Listening Section (Parts 1–4)
  // ----------------------------------------------------
  {
    const lAnswers = serverAnswerKey.listening;

    const p1 = gradeListeningPart1(lAnswers.part1, lAnswers.part1);
    assert.equal(p1.correctItems, Object.keys(lAnswers.part1).length);

    const p2 = gradeListeningPart2(lAnswers.part2, lAnswers.part2);
    assert.equal(p2.correctItems, Object.keys(lAnswers.part2).length);

    const p3 = gradeListeningPart3(lAnswers.part3, lAnswers.part3);
    assert.equal(p3.correctItems, Object.keys(lAnswers.part3).length);

    const p4 = gradeListeningPart4(lAnswers.part4, lAnswers.part4);
    assert.equal(p4.correctItems, Object.keys(lAnswers.part4).length);

    const listeningRes = gradeListeningSection(lAnswers, lAnswers);
    const expectedListeningMax = Object.keys(lAnswers.part1).length + Object.keys(lAnswers.part2).length + Object.keys(lAnswers.part3).length + Object.keys(lAnswers.part4).length;
    assert.equal(listeningRes.rawScore, expectedListeningMax);
    assert.equal(listeningRes.maxRawScore, expectedListeningMax);
    assert.equal(listeningRes.percentage, 100);
    assert.equal(listeningRes.sectionName, "listening");
  }

  // ----------------------------------------------------
  // 7. Full Exam Master Orchestration
  // ----------------------------------------------------
  {
    const perfectExamSubmission = {
      testId: serverAnswerKey.testId,
      grammarVocabulary: {
        grammar: serverAnswerKey.grammarVocabulary.grammarAnswers,
        vocabulary: serverAnswerKey.grammarVocabulary.vocabularyAnswers,
      },
      reading: serverAnswerKey.reading,
      listening: serverAnswerKey.listening,
    };

    const examResult = gradeDeterministicExam(perfectExamSubmission, serverAnswerKey);
    assert.equal(examResult.testId, "aptis-b2-01");
    const l1Count = Object.keys(serverAnswerKey.listening.part1).length;
    const l2Count = Object.keys(serverAnswerKey.listening.part2).length;
    const l3Count = Object.keys(serverAnswerKey.listening.part3).length;
    const l4Count = Object.keys(serverAnswerKey.listening.part4).length;
    const expectedTotal = 50 + 27 + (l1Count + l2Count + l3Count + l4Count);
    assert.equal(examResult.totalRawScore, expectedTotal);
    assert.equal(examResult.totalMaxRawScore, expectedTotal);
    assert.equal(examResult.totalPercentage, 100);
    assert.equal(
      examResult.disclaimer,
      "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE"
    );

    // Partial exam: only grammar section submitted
    const onlyGrammarExam = gradeDeterministicExam(
      {
        testId: serverAnswerKey.testId,
        grammarVocabulary: {
          grammar: serverAnswerKey.grammarVocabulary.grammarAnswers,
          vocabulary: serverAnswerKey.grammarVocabulary.vocabularyAnswers,
        },
      },
      serverAnswerKey
    );
    assert.equal(onlyGrammarExam.totalRawScore, 50);
    assert.equal(onlyGrammarExam.totalMaxRawScore, expectedTotal);
    assert.equal(onlyGrammarExam.sections.reading?.rawScore, 0);
    assert.equal(onlyGrammarExam.sections.listening?.rawScore, 0);
  }

  // ----------------------------------------------------
  // 8. Error & Boundary Handling
  // ----------------------------------------------------
  {
    // testId mismatch
    assert.throws(
      () => {
        gradeDeterministicExam(
          { testId: "wrong-id" },
          serverAnswerKey
        );
      },
      (err: any) => err.code === "INVALID_SUBMISSION"
    );

    // Null submission
    assert.throws(
      () => {
        gradeDeterministicExam(null as any, serverAnswerKey);
      },
      (err: any) => err.code === "INVALID_SUBMISSION"
    );

    // Null answer key
    assert.throws(
      () => {
        gradeDeterministicExam({ testId: "aptis-b2-01" }, null as any);
      },
      (err: any) => err.code === "INVALID_ANSWER_KEY"
    );

    // Empty answer key in sub-part
    assert.throws(
      () => {
        gradeGrammarPart({}, {});
      },
      (err: any) => err.code === "MISSING_ANSWER_KEY"
    );
  }

  console.log("  ✓ Item-level grading with whitespace & case normalization verified");
  console.log("  ✓ Sentence ordering positional grading verified");
  console.log("  ✓ Grammar & Vocabulary section grading verified");
  console.log("  ✓ Reading Parts 1–4 grading verified");
  console.log("  ✓ Listening Parts 1–4 grading verified");
  console.log("  ✓ Full Exam deterministic master orchestrator verified (100% score match)");
  console.log("  ✓ Error boundary and testId mismatch safety verified");
  console.log("✅ [TEST 3 PASSED] Deterministic Grading Engine unit tests completed.\n");
}

// Allow direct CLI execution
if (process.argv[1] === import.meta.filename) {
  runGradingTests();
}
