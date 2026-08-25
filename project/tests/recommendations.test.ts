import assert from "node:assert/strict";
import { ProgressAttemptRecord } from "../lib/progress";
import {
  generateRecommendations,
  prepareAICoachContext,
} from "../lib/recommendations";

export function runRecommendationTests() {
  console.log("▶ [TEST 7] Running AI Coach Recommendation Engine Unit Tests...");

  // ----------------------------------------------------
  // 1. Empty & Sparse History (No-Data Safety)
  // ----------------------------------------------------
  {
    const emptyResult = generateRecommendations([]);
    assert.ok(emptyResult.totalRecommendations > 0);
    assert.equal(emptyResult.primaryRecommendation?.skill, "grammarVocabulary");
    assert.equal(emptyResult.primaryRecommendation?.basedOn, "initial_diagnostic");
    assert.equal(
      emptyResult.disclaimer,
      "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE"
    );

    // 1-attempt sparse history
    const singleAttempt: ProgressAttemptRecord[] = [
      {
        id: "att_1",
        testId: "aptis-b2-01",
        mode: "practice",
        skill: "grammarVocabulary",
        rawScore: 20,
        maxRawScore: 25,
        percentage: 80,
        completedAt: "2026-08-20T10:00:00Z",
        disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
      },
    ];
    const sparseResult = generateRecommendations(singleAttempt);
    assert.ok(sparseResult.totalRecommendations > 0);
  }

  // ----------------------------------------------------
  // 2. Critical Weakness (< 55%)
  // ----------------------------------------------------
  {
    const criticalHistory: ProgressAttemptRecord[] = [
      {
        id: "att_1",
        testId: "aptis-b2-01",
        mode: "practice",
        skill: "reading",
        partIdentifier: "part4",
        rawScore: 2,
        maxRawScore: 7,
        percentage: 28.5,
        completedAt: "2026-08-20T10:00:00Z",
        disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
      },
      {
        id: "att_2",
        testId: "aptis-b2-01",
        mode: "practice",
        skill: "reading",
        partIdentifier: "part4",
        rawScore: 3,
        maxRawScore: 7,
        percentage: 42.8,
        completedAt: "2026-08-21T10:00:00Z",
        disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
      },
      {
        id: "att_3",
        testId: "aptis-b2-01",
        mode: "practice",
        skill: "listening",
        partIdentifier: "l_part1",
        rawScore: 5,
        maxRawScore: 5,
        percentage: 100,
        completedAt: "2026-08-22T10:00:00Z",
        disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
      },
    ];

    const result = generateRecommendations(criticalHistory);
    assert.ok(result.primaryRecommendation !== null);
    assert.equal(result.primaryRecommendation?.skill, "reading");
    assert.equal(result.primaryRecommendation?.partIdentifier, "part4");
    assert.equal(result.primaryRecommendation?.priority, "critical");
    assert.ok(result.primaryRecommendation?.reason.includes("55%"));
  }

  // ----------------------------------------------------
  // 3. Moderate Weakness (55% - 69%)
  // ----------------------------------------------------
  {
    const moderateHistory: ProgressAttemptRecord[] = [
      {
        id: "att_1",
        testId: "aptis-b2-01",
        mode: "practice",
        skill: "writing",
        partIdentifier: "w_part4",
        rawScore: 12,
        maxRawScore: 20,
        percentage: 60,
        completedAt: "2026-08-20T10:00:00Z",
        disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
      },
      {
        id: "att_2",
        testId: "aptis-b2-01",
        mode: "practice",
        skill: "writing",
        partIdentifier: "w_part4",
        rawScore: 13,
        maxRawScore: 20,
        percentage: 65,
        completedAt: "2026-08-21T10:00:00Z",
        disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
      },
      {
        id: "att_3",
        testId: "aptis-b2-01",
        mode: "practice",
        skill: "grammarVocabulary",
        partIdentifier: "grammar",
        rawScore: 24,
        maxRawScore: 25,
        percentage: 96,
        completedAt: "2026-08-22T10:00:00Z",
        disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
      },
    ];

    const result = generateRecommendations(moderateHistory);
    assert.ok(result.primaryRecommendation !== null);
    assert.equal(result.primaryRecommendation?.skill, "writing");
    assert.equal(result.primaryRecommendation?.partIdentifier, "w_part4");
    assert.equal(result.primaryRecommendation?.priority, "high");
    assert.equal(result.primaryRecommendation?.basedOn, "moderate_weakness");
  }

  // ----------------------------------------------------
  // 4. Declining Trend & Neglected Skill
  // ----------------------------------------------------
  {
    const complexHistory: ProgressAttemptRecord[] = [
      // Reading declining over 4 attempts
      { id: "1", testId: "t1", mode: "practice", skill: "reading", rawScore: 9, maxRawScore: 10, percentage: 90, completedAt: "2026-08-10T10:00:00Z", disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE" },
      { id: "2", testId: "t1", mode: "practice", skill: "reading", rawScore: 17, maxRawScore: 20, percentage: 85, completedAt: "2026-08-11T10:00:00Z", disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE" },
      { id: "3", testId: "t1", mode: "practice", skill: "reading", rawScore: 14, maxRawScore: 20, percentage: 70, completedAt: "2026-08-12T10:00:00Z", disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE" },
      { id: "4", testId: "t1", mode: "practice", skill: "reading", rawScore: 13, maxRawScore: 20, percentage: 65, completedAt: "2026-08-13T10:00:00Z", disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE" },
      // Grammar & Vocabulary active
      { id: "5", testId: "t1", mode: "practice", skill: "grammarVocabulary", rawScore: 22, maxRawScore: 25, percentage: 88, completedAt: "2026-08-14T10:00:00Z", disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE" },
      { id: "6", testId: "t1", mode: "practice", skill: "listening", rawScore: 23, maxRawScore: 25, percentage: 92, completedAt: "2026-08-15T10:00:00Z", disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE" },
      // Speaking & Writing neglected (0 attempts)
    ];

    const result = generateRecommendations(complexHistory);
    const recs = [result.primaryRecommendation!, ...result.secondaryRecommendations];

    // Should recommend reversing declining trend in reading
    const trendRec = recs.find((r) => r.basedOn === "declining_trend");
    assert.ok(trendRec);
    assert.equal(trendRec?.skill, "reading");

    // Should recommend neglected skills (speaking or writing)
    const neglectedRec = recs.find((r) => r.basedOn === "neglected_skill");
    assert.ok(neglectedRec);
  }

  // ----------------------------------------------------
  // 5. Mock Test Readiness Rule
  // ----------------------------------------------------
  {
    const highPerformerHistory: ProgressAttemptRecord[] = [
      { id: "1", testId: "t1", mode: "practice", skill: "grammarVocabulary", rawScore: 23, maxRawScore: 25, percentage: 92, completedAt: "2026-08-10T10:00:00Z", disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE" },
      { id: "2", testId: "t1", mode: "practice", skill: "reading", rawScore: 22, maxRawScore: 25, percentage: 88, completedAt: "2026-08-11T10:00:00Z", disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE" },
      { id: "3", testId: "t1", mode: "practice", skill: "listening", rawScore: 21, maxRawScore: 25, percentage: 84, completedAt: "2026-08-12T10:00:00Z", disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE" },
      { id: "4", testId: "t1", mode: "practice", skill: "writing", rawScore: 17, maxRawScore: 20, percentage: 85, completedAt: "2026-08-13T10:00:00Z", disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE" },
      { id: "5", testId: "t1", mode: "practice", skill: "speaking", rawScore: 20, maxRawScore: 25, percentage: 80, completedAt: "2026-08-14T10:00:00Z", disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE" },
      { id: "6", testId: "t1", mode: "practice", skill: "grammarVocabulary", rawScore: 24, maxRawScore: 25, percentage: 96, completedAt: "2026-08-15T10:00:00Z", disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE" },
    ];

    const result = generateRecommendations(highPerformerHistory);
    const recs = [result.primaryRecommendation!, ...result.secondaryRecommendations];
    const mockReadyRec = recs.find((r) => r.basedOn === "mock_test_readiness");
    assert.ok(mockReadyRec);
    assert.equal(mockReadyRec?.targetMode, "mock-test");
    assert.equal(mockReadyRec?.estimatedMinutes, 175);
  }

  // ----------------------------------------------------
  // 6. AI Coach Context Structure Preparation
  // ----------------------------------------------------
  {
    const history: ProgressAttemptRecord[] = [
      { id: "1", testId: "t1", mode: "practice", skill: "reading", rawScore: 2, maxRawScore: 4, percentage: 50, completedAt: "2026-08-22T10:00:00Z", disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE" },
    ];

    const aiCoachContext = prepareAICoachContext(history);
    assert.ok(aiCoachContext.overallStats);
    assert.ok(aiCoachContext.recommendations.length > 0);
    assert.equal(aiCoachContext.recentHistorySummary.totalAttempts, 1);
    assert.equal(aiCoachContext.recentHistorySummary.lastActiveSkill, "reading");
    assert.equal(aiCoachContext.recentHistorySummary.lastScorePercentage, 50);
  }

  console.log("  ✓ Empty and sparse history diagnostic recommendations verified");
  console.log("  ✓ Critical weakness (<55%) priority sorting verified");
  console.log("  ✓ Moderate weakness (55-69%) improvement targeting verified");
  console.log("  ✓ Declining score trend and neglected skill detection verified");
  console.log("  ✓ Mock test readiness rule (all skills covered + >70% accuracy) verified");
  console.log("  ✓ Structured AI Coach context preparation verified");
  console.log("✅ [TEST 7 PASSED] AI Coach Recommendation Engine unit tests completed.\n");
}

// Allow direct CLI execution
if (process.argv[1] === import.meta.filename) {
  runRecommendationTests();
}
