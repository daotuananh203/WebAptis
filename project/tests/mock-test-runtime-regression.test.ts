import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveSectionParts } from "../components/mock-test/exam-shell";
import {
  gradeGrammarPart,
  gradeVocabularyPart,
  gradeReadingPart1,
  gradeReadingPart2,
  gradeReadingPart3,
  gradeReadingPart4,
  gradeListeningPart1,
  gradeListeningPart2,
  gradeListeningPart3,
  gradeListeningPart4,
} from "../lib/grading/deterministic";

export function runMockTestRuntimeRegressionTests() {
  console.log("▶ [TEST 22] Running Mock Test Multi-Part and Grading Boundary Regression Tests...");

  // 1. Dynamic Part Resolver across every 23-test public mock catalog
  console.log("  [22.1] Validating resolveSectionParts across all 23 tests for all 5 skills...");
  const testIds = [
    ...Array.from({ length: 16 }, (_, index) => `aptis-b2-${String(index + 1).padStart(2, "0")}`),
    ...Array.from({ length: 7 }, (_, index) => `aptis-4skills-${String(index + 1).padStart(2, "0")}`),
  ];
  for (const testId of testIds) {
    const filePath = path.join(process.cwd(), `data/tests/${testId}-public.json`);
    const dataset = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    // 1.1 Grammar and Vocabulary
    const gvParts = resolveSectionParts(dataset, "grammarVocabulary");
    assert.equal(gvParts.length, 2, `${testId} GV must resolve 2 parts`);
    assert.equal(gvParts[0].partIdentifier, "grammar");
    assert.equal(gvParts[1].partIdentifier, "vocabulary");
    assert.equal(gvParts[0].totalItems, 25);
    assert.equal(gvParts[1].totalItems, 5);

    // 1.2 Reading
    const readingParts = resolveSectionParts(dataset, "reading");
    assert.equal(readingParts.length, 4, `${testId} Reading must resolve 4 parts`);
    assert.equal(readingParts[0].partIdentifier, "part1");
    assert.equal(readingParts[1].partIdentifier, "part2");
    assert.equal(readingParts[2].partIdentifier, "part3");
    assert.equal(readingParts[3].partIdentifier, "part4");
    assert.ok(Array.isArray(readingParts[0].data.gaps), `${testId} Reading Part 1 must have gaps`);
    assert.ok(readingParts[1].data.stories || readingParts[1].data.story, `${testId} Reading Part 2 must have story/stories`);
    assert.ok(Array.isArray(readingParts[2].data.people), `${testId} Reading Part 3 must have people`);
    assert.ok(Array.isArray(readingParts[3].data.paragraphs), `${testId} Reading Part 4 must have paragraphs`);

    // 1.3 Listening
    const listeningParts = resolveSectionParts(dataset, "listening");
    assert.equal(listeningParts.length, 4, `${testId} Listening must resolve 4 parts`);
    assert.ok(Array.isArray(listeningParts[0].data.tasks), `${testId} Listening Part 1 must have tasks`);
    assert.ok(Array.isArray(listeningParts[1].data.speakers), `${testId} Listening Part 2 must have speakers`);
    assert.ok(Array.isArray(listeningParts[2].data.statements), `${testId} Listening Part 3 must have statements`);
    assert.ok(Array.isArray(listeningParts[3].data.monologues), `${testId} Listening Part 4 must have monologues`);

    // 1.4 Writing
    const writingParts = resolveSectionParts(dataset, "writing");
    assert.equal(writingParts.length, 4, `${testId} Writing must resolve 4 parts`);
    const wP1 = writingParts[0].data;
    assert.ok(Array.isArray(wP1.prompts), `${testId} Writing Part 1 must have prompts`);
    assert.equal(wP1.prompts.length, 5, `${testId} Writing Part 1 must have 5 prompts`);
    wP1.prompts.forEach((p: any, idx: number) => {
      assert.ok(p.id, `${testId} Writing Part 1 prompt ${idx} must have id`);
      assert.ok(p.question, `${testId} Writing Part 1 prompt ${idx} must have question`);
    });

    // 1.5 Speaking
    const speakingParts = resolveSectionParts(dataset, "speaking");
    assert.equal(speakingParts.length, 4, `${testId} Speaking must resolve 4 parts`);
    speakingParts.forEach((sp, idx) => {
      assert.ok(Array.isArray(sp.data.questions), `${testId} Speaking Part ${idx + 1} must have questions`);
    });
    assert.deepEqual(
      speakingParts.map((part) => part.totalItems),
      [3, 3, 3, 1],
      `${testId} Speaking Parts 1–3 must expose every independent recording prompt`
    );
  }
  console.log("  ✓ 23/23 Mock test datasets verified with exact multi-part resolution (4 parts Reading, 4 parts Listening, 4 parts Writing, 4 parts Speaking, 2 parts GV).");

  // 2. Whole-Section Deterministic Grading Aggregation (GV, Reading, Listening)
  console.log("  [22.2] Validating whole-section deterministic grading aggregation...");
  {
    const answersPath = path.join(process.cwd(), "data/tests/aptis-b2-01-answers.json");
    const serverAnswers = JSON.parse(fs.readFileSync(answersPath, "utf-8"));

    // Full Reading mock answers: answer everything correctly
    const fullReadingAnswers = {
      ...serverAnswers.reading.part1,
      ...serverAnswers.reading.part2,
      ...serverAnswers.reading.part3,
      ...serverAnswers.reading.part4,
    };

    const p1 = gradeReadingPart1(fullReadingAnswers, serverAnswers.reading.part1);
    const p2 = gradeReadingPart2(fullReadingAnswers, serverAnswers.reading.part2);
    const p3 = gradeReadingPart3(fullReadingAnswers, serverAnswers.reading.part3);
    const p4 = gradeReadingPart4(fullReadingAnswers, serverAnswers.reading.part4);

    const totalRaw = p1.rawScore + p2.rawScore + p3.rawScore + p4.rawScore;
    const totalMax = p1.maxRawScore + p2.maxRawScore + p3.maxRawScore + p4.maxRawScore;

    assert.equal(totalRaw, totalMax, "All-correct Reading answers must achieve max score");
    assert.ok(totalMax > 0, "Max raw score must be greater than 0");
    console.log(`  ✓ Reading whole section deterministic score aggregated: ${totalRaw}/${totalMax} points.`);

    // Full Listening mock answers
    const fullListeningAnswers = {
      ...serverAnswers.listening.part1,
      ...serverAnswers.listening.part2,
      ...serverAnswers.listening.part3,
      ...serverAnswers.listening.part4,
    };

    const lp1 = gradeListeningPart1(fullListeningAnswers, serverAnswers.listening.part1);
    const lp2 = gradeListeningPart2(fullListeningAnswers, serverAnswers.listening.part2);
    const lp3 = gradeListeningPart3(fullListeningAnswers, serverAnswers.listening.part3);
    const lp4 = gradeListeningPart4(fullListeningAnswers, serverAnswers.listening.part4);

    const lTotalRaw = lp1.rawScore + lp2.rawScore + lp3.rawScore + lp4.rawScore;
    const lTotalMax = lp1.maxRawScore + lp2.maxRawScore + lp3.maxRawScore + lp4.maxRawScore;

    assert.equal(lTotalRaw, lTotalMax, "All-correct Listening answers must achieve max score");
    console.log(`  ✓ Listening whole section deterministic score aggregated: ${lTotalRaw}/${lTotalMax} points.`);
  }

  // 3. Writing and Speaking AI Boundary Integrity (No Fake Scores)
  console.log("  [22.3] Verifying Writing and Speaking AI evaluation boundaries...");
  {
    const answersPath = path.join(process.cwd(), "data/tests/aptis-b2-01-answers.json");
    const serverAnswers = JSON.parse(fs.readFileSync(answersPath, "utf-8"));
    assert.equal(serverAnswers.writing, undefined, "Server answer key must NOT contain deterministic answers for Writing");
    assert.equal(serverAnswers.speaking, undefined, "Server answer key must NOT contain deterministic answers for Speaking");
    console.log("  ✓ Writing and Speaking confirmed as free-response / AI evaluation boundary with zero fake deterministic answers.");
  }

  console.log("✅ [TEST 22 PASSED] Mock Test Multi-Part and Grading Boundary Regression tests completed.\n");
  return true;
}

if (process.argv[1] === import.meta.filename) {
  runMockTestRuntimeRegressionTests();
}
