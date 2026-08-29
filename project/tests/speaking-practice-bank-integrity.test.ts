import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { loadSpeakingPracticeBank } from "../lib/speaking/practice-bank";
import { resolveSpeakingTaskContext } from "../lib/grading/speaking-ai";

function normalize(value: string): string {
  return value.toLowerCase().trim().replace(/[.!?,;:]+/g, " ").replace(/\s+/g, " ");
}

export function runSpeakingPracticeBankIntegrityTests(): boolean {
  console.log("==================================================");
  console.log("▶ [TEST 44] Speaking canonical Practice Bank integrity...");
  console.log("==================================================");
  const bank = loadSpeakingPracticeBank();

  assert.equal(bank.parts.part1.questions.length, 31, "Part 1 must expose the 31 canonical source questions");
  assert.equal(new Set(bank.parts.part1.questions.map((item) => item.questionId)).size, 31, "Part 1 question IDs must be unique");
  assert.equal(new Set(bank.parts.part1.questions.map((item) => normalize(item.question))).size, 31, "Part 1 questions must be unique after normalization");
  for (const item of bank.parts.part1.questions) {
    assert.ok(item.source && item.sourceEvidence && item.questionId, `Part 1 provenance missing: ${item.questionId}`);
  }

  assert.ok(bank.parts.part2.topics.length >= 30, "Part 2 source bank must contain at least 30 topics");
  assert.ok(bank.parts.part3.topics.length >= 32, "Part 3 source bank must contain at least 32 topics");
  assert.equal(bank.parts.part4.topics.length, 29, "Part 4 must retain all 29 source records");

  for (const part of [bank.parts.part2, bank.parts.part3, bank.parts.part4]) {
    assert.equal(new Set(part.topics.map((item) => item.topicId)).size, part.topics.length, `Part ${part.partNumber} topic IDs must be unique`);
    const signatures = part.topics.map((item) => item.normalizedPrompts.join("|"));
    assert.equal(new Set(signatures).size, signatures.length, `Part ${part.partNumber} contains an accidental full-topic duplicate`);
    for (const item of part.topics) {
      assert.ok(item.source && item.sourceEvidence && item.selectionPolicy, `Topic provenance missing: ${item.topicId}`);
      for (const image of [item.image, item.imageA, item.imageB]) {
        if (!image) continue;
        assert.ok(image.startsWith("/images/speaking/"), `Non-source image path: ${image}`);
        assert.ok(!/test_\d+_part[23]/i.test(image), `Placeholder image leaked into Practice Bank: ${image}`);
        assert.ok(fs.existsSync(path.join(process.cwd(), "public", image.slice(1))), `Missing source image: ${image}`);
      }
      if (item.partNumber === 3 && item.availability === "available") {
        assert.ok(item.imageA && item.imageB, `Available Part 3 topic lacks Image A/B: ${item.topicId}`);
        assert.notEqual(item.imageA, item.imageB, `Part 3 Image A/B collide: ${item.topicId}`);
      }
    }
  }

  for (const [testId, topicId] of Object.entries(bank.newTestReuse.part2)) {
    assert.ok(bank.parts.part2.topics.some((item) => item.topicId === topicId), `Part 2 reuse target missing for ${testId}`);
  }
  for (const [testId, topicId] of Object.entries(bank.newTestReuse.part3)) {
    assert.ok(bank.parts.part3.topics.some((item) => item.topicId === topicId), `Part 3 reuse target missing for ${testId}`);
  }
  assert.equal(bank.historicalMapping, "NOT_RECOVERED_FOR_OLD_MOCK_PARTS_2_3");
  const p2Topic = bank.parts.part2.topics.find((item) => item.topicId === "spk-bank-p2-gdrive_spk_p2_002")!;
  const p2Context = resolveSpeakingTaskContext("speaking-practice-bank", 2, `${p2Topic.topicId}-q2`, p2Topic.topicId);
  assert.equal(p2Context.practiceItemId, p2Topic.topicId);
  assert.equal(p2Context.prompt, p2Topic.prompts[1]);
  assert.deepEqual(p2Context.imageUrls, [p2Topic.image]);
  const p3Topic = bank.parts.part3.topics.find((item) => item.topicId === "spk-bank-p3-gdrive_spk_p3_035")!;
  const p3Context = resolveSpeakingTaskContext("speaking-practice-bank", 3, `${p3Topic.topicId}-q1`, p3Topic.topicId);
  assert.deepEqual(p3Context.imageUrls, [p3Topic.imageA, p3Topic.imageB]);
  assert.equal(p3Context.prompt, p3Topic.prompts[0]);
  assert.throws(
    () => resolveSpeakingTaskContext("speaking-practice-bank", 3, `${p3Topic.topicId}-q999`, p3Topic.topicId),
    /outside the topic prompt range/,
    "A task id outside the canonical topic prompt range must not fall back to prompt 1",
  );
  console.log(`  ✓ P1 ${bank.parts.part1.itemCount}; P2 ${bank.parts.part2.itemCount}; P3 ${bank.parts.part3.itemCount}; P4 ${bank.parts.part4.itemCount}`);
  console.log(`  ✓ source-limited P3 topics: ${bank.parts.part3.topics.filter((item) => item.availability === "source-limited").length}`);
  return true;
}
