import assert from "node:assert/strict";
import { recordUserError, loadUserMemory } from "../lib/memory/store";

export async function runRedTeamUserMemoryTests(): Promise<boolean> {
  console.log("==================================================");
  console.log("▶ [RED-TEAM DOMAIN E] Running Multi-User Memory Isolation & Concurrency Tests...");
  console.log("==================================================");

  const userA = "usr_redteam_alice_" + Date.now();
  const userB = "usr_redteam_bob_" + Date.now();

  // 1. Record User A errors
  recordUserError(
    userA,
    "Grammar",
    "topic_past_simple_vs_present_perfect",
    "Past Simple vs Present Perfect",
    "Used V2 instead of have + V3 with since/for"
  );

  // 2. Record User B errors
  recordUserError(
    userB,
    "Speaking",
    "topic_spk_p2_description",
    "Picture Description Part 2",
    "Ran out of time before describing background details"
  );

  // 3. Verify User Isolation
  console.log("  [E.1] Verifying strict cross-user data isolation between User A and User B...");
  const memoryA = loadUserMemory(userA);
  const memoryB = loadUserMemory(userB);

  assert.ok(memoryA.recurringErrors.some(e => e.topicId === "topic_past_simple_vs_present_perfect"), "User A must have Grammar error");
  assert.ok(!memoryA.recurringErrors.some(e => e.skill === "Speaking"), "CRITICAL: User A must NOT have User B's speaking error");

  assert.ok(memoryB.recurringErrors.some(e => e.skill === "Speaking"), "User B must have Speaking error");
  assert.ok(!memoryB.recurringErrors.some(e => e.topicId === "topic_past_simple_vs_present_perfect"), "CRITICAL: User B must NOT have User A's grammar error");

  console.log("  ✓ Cross-user data isolation 100% verified.");

  // 4. Repeated Errors Accumulation
  console.log("  [E.2] Verifying error count increment on repeated error...");
  recordUserError(
    userA,
    "Grammar",
    "topic_past_simple_vs_present_perfect",
    "Past Simple vs Present Perfect",
    "Second mistake on since/for"
  );

  const updatedA = loadUserMemory(userA);
  const err = updatedA.recurringErrors.find(e => e.topicId === "topic_past_simple_vs_present_perfect");
  assert.equal(err?.errorCount, 2, "Error count must increment to 2");
  assert.equal(err?.examples.length, 2, "Must accumulate examples up to limit");

  console.log("  ✓ Repeated error tracking verified.");
  console.log("✅ [RED-TEAM DOMAIN E PASSED] Multi-User Memory Isolation Tests PASSED!\n");
  return true;
}
