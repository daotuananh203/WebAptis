import assert from "node:assert/strict";
import {
  calculateDailyStreak,
  calculateOverallStatistics,
  generateTwelveWeekHeatmap,
  ProgressAttemptRecord,
} from "../lib/progress";
import { generateRecommendations } from "../lib/recommendations";
import {
  loadProgressHistory,
  MemoryStorageAdapter,
  saveProgressAttempt,
} from "../lib/storage";

export function runDashboardIntegrationTests() {
  console.log("▶ [TEST 10] Running UI Foundation & Dashboard Integration Tests...");

  const memoryAdapter = new MemoryStorageAdapter();

  // ----------------------------------------------------
  // 1. Empty Dashboard Initial State
  // ----------------------------------------------------
  {
    const history = loadProgressHistory(memoryAdapter);
    const streak = calculateDailyStreak(history);
    const stats = calculateOverallStatistics(history);
    const heatmap = generateTwelveWeekHeatmap(history);
    const recommendations = generateRecommendations(history);

    assert.equal(history.length, 0);
    assert.equal(streak.currentStreak, 0);
    assert.equal(streak.isActiveToday, false);
    assert.equal(stats.totalAttempts, 0);
    assert.equal(heatmap.days.length, 84);
    assert.ok(recommendations.primaryRecommendation !== null);
    assert.equal(recommendations.primaryRecommendation?.basedOn, "initial_diagnostic");
  }

  // ----------------------------------------------------
  // 2. Populated Dashboard State with Real History
  // ----------------------------------------------------
  {
    const attempts: ProgressAttemptRecord[] = [
      {
        id: "att_1",
        testId: "aptis-b2-01",
        mode: "practice",
        skill: "grammarVocabulary",
        rawScore: 23,
        maxRawScore: 25,
        percentage: 92,
        durationSeconds: 900,
        completedAt: "2026-08-21T10:00:00Z",
        disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
      },
      {
        id: "att_2",
        testId: "aptis-b2-01",
        mode: "practice",
        skill: "reading",
        partIdentifier: "part4",
        rawScore: 2,
        maxRawScore: 7,
        percentage: 28.5,
        durationSeconds: 600,
        completedAt: "2026-08-22T08:00:00Z",
        disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
      },
    ];

    for (const att of attempts) {
      saveProgressAttempt(att, memoryAdapter);
    }

    const loadedHistory = loadProgressHistory(memoryAdapter);
    assert.equal(loadedHistory.length, 2);

    const refDate = new Date("2026-08-22T12:00:00Z");
    const streak = calculateDailyStreak(loadedHistory, refDate);
    const stats = calculateOverallStatistics(loadedHistory);
    const heatmap = generateTwelveWeekHeatmap(loadedHistory, refDate);
    const recommendations = generateRecommendations(loadedHistory);

    assert.equal(streak.currentStreak, 2);
    assert.equal(streak.isActiveToday, true);
    assert.equal(stats.totalAttempts, 2);
    assert.equal(stats.strongestSkill, "grammarVocabulary");
    assert.equal(stats.weakestSkill, "reading");
    assert.equal(stats.weakAreas.length, 1);
    assert.equal(stats.weakAreas[0].skill, "reading");
    assert.equal(stats.weakAreas[0].urgency, "critical");

    // Primary recommendation targets Reading Part 4
    assert.equal(recommendations.primaryRecommendation?.skill, "reading");
    assert.equal(recommendations.primaryRecommendation?.partIdentifier, "part4");
    assert.equal(recommendations.primaryRecommendation?.priority, "critical");

    // Heatmap has 2 activities and 25 study minutes
    assert.equal(heatmap.totalActivities, 2);
    assert.equal(heatmap.totalStudyMinutes, 25);
  }

  console.log("  ✓ Empty dashboard initial state pipeline verified");
  console.log("  ✓ Populated dashboard data integration pipeline verified");
  console.log("  ✓ Streak and heatmap data model consistency verified");
  console.log("  ✓ Diagnostic recommendations and weak areas mapping verified");
  console.log("✅ [TEST 10 PASSED] UI Foundation & Dashboard Integration tests completed.\n");
}

// Allow direct CLI execution
if (process.argv[1] === import.meta.filename) {
  runDashboardIntegrationTests();
}
