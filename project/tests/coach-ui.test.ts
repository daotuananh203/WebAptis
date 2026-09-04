import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { prepareAICoachContext } from "../lib/recommendations";
import { ProgressAttemptRecord } from "../lib/progress/types";
import {
  clearProgressHistory,
  loadProgressHistory,
  MemoryStorageAdapter,
  saveProgressAttempt,
} from "../lib/storage";

export function runCoachUITests() {
  console.log("▶ [TEST 13] Running AI Coach Chat UI Unit Tests...");

  const memoryAdapter = new MemoryStorageAdapter();

  // Auth/session recovery is wired into the actual client components, not
  // only into the pure message mapper.
  {
    const coachShellSource = fs.readFileSync(
      path.join(process.cwd(), "components", "coach", "coach-shell.tsx"),
      "utf8",
    );
    const topBarSource = fs.readFileSync(
      path.join(process.cwd(), "components", "layout", "top-bar.tsx"),
      "utf8",
    );
    const dashboardSource = fs.readFileSync(
      path.join(process.cwd(), "components", "dashboard", "dashboard-view.tsx"),
      "utf8",
    );
    assert.match(coachShellSource, /refreshUser/);
    assert.match(coachShellSource, /credentials:\s*["']include["']/);
    assert.match(coachShellSource, /AUTHENTICATION_REQUIRED/);
    assert.equal(topBarSource.includes("dao tuan anh"), false);
    assert.equal(dashboardSource.includes("dao tuan anh"), false);
    assert.match(topBarSource, /\{user \?/);
  }

  // ----------------------------------------------------
  // 1. Context Preparation for Empty History
  // ----------------------------------------------------
  {
    clearProgressHistory(memoryAdapter);
    const history = loadProgressHistory(memoryAdapter);
    const context = prepareAICoachContext(history);

    assert.equal(context.overallStats.totalAttempts, 0);
    assert.equal(context.overallStats.weakAreas.length, 0);
    assert.ok(context.recommendations.length > 0);
    assert.equal(context.recommendations[0].basedOn, "initial_diagnostic");
    assert.equal(context.recentHistorySummary.totalAttempts, 0);
  }

  // ----------------------------------------------------
  // 2. Context Preparation for Populated History & Recommendation Matching
  // ----------------------------------------------------
  {
    const attempts: ProgressAttemptRecord[] = [
      {
        id: "att_coach_1",
        testId: "aptis-b2-01",
        mode: "practice",
        skill: "grammarVocabulary",
        rawScore: 24,
        maxRawScore: 25,
        percentage: 96,
        completedAt: "2026-08-21T10:00:00Z",
        disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
      },
      {
        id: "att_coach_2",
        testId: "aptis-b2-01",
        mode: "practice",
        skill: "reading",
        partIdentifier: "part4",
        rawScore: 2,
        maxRawScore: 7,
        percentage: 28.5,
        completedAt: "2026-08-22T10:00:00Z",
        disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE",
      },
    ];

    for (const att of attempts) {
      saveProgressAttempt(att, memoryAdapter);
    }

    const history = loadProgressHistory(memoryAdapter);
    const context = prepareAICoachContext(history);

    assert.equal(context.overallStats.totalAttempts, 2);
    assert.equal(context.overallStats.strongestSkill, "grammarVocabulary");
    assert.equal(context.overallStats.weakestSkill, "reading");
    assert.equal(context.recentHistorySummary.lastActiveSkill, "reading");

    // Match recommendation by ID
    const targetRecId = context.recommendations[0]?.id;
    assert.ok(targetRecId);

    const matched = context.recommendations.find((r) => r.id === targetRecId);
    assert.ok(matched);
    assert.equal(matched?.skill, "reading");
    assert.equal(matched?.partIdentifier, "part4");
  }

  console.log("  ✓ AI Coach context preparation for empty history verified");
  console.log("  ✓ AI Coach context preparation for populated history verified");
  console.log("  ✓ Recommendation resolution by ID verified");
  console.log("✅ [TEST 13 PASSED] AI Coach Chat UI tests completed.\n");
}

// Allow direct CLI execution
if (process.argv[1] === import.meta.filename) {
  runCoachUITests();
}
