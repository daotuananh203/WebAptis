import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { loadSpeakingPracticeBank } from "../lib/speaking/practice-bank";
import { getSpeakingTopicDisplayTitle } from "../lib/speaking/topic-title";
import { resolveSpeakingTaskContext } from "../lib/grading/speaking-ai";

function normalize(value: string): string {
  return value.toLowerCase().trim().replace(/[.!?,;:]+/g, " ").replace(/\s+/g, " ");
}

export function runSpeakingPracticeBankIntegrityTests(): boolean {
  console.log("==================================================");
  console.log("▶ [TEST 44] Speaking canonical Practice Bank integrity...");
  console.log("==================================================");
  const bank = loadSpeakingPracticeBank();
  const assignmentMapping = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/speaking/canonical-speaking-mapping.json"), "utf8")) as {
    mappingKind?: string;
    assignmentStatus?: string;
    historicalStandardMapping?: string;
  };
  assert.equal(assignmentMapping.mappingKind, "source-backed-reconstruction");
  assert.equal(assignmentMapping.assignmentStatus, "RECONSTRUCTED_SOURCE_BACKED_NOT_HISTORICAL");
  assert.equal(assignmentMapping.historicalStandardMapping, "NOT_RECOVERED");

  assert.equal(bank.parts.part1.questions.length, 31, "Part 1 must expose the 31 canonical source questions");
  assert.equal(new Set(bank.parts.part1.questions.map((item) => item.questionId)).size, 31, "Part 1 question IDs must be unique");
  assert.equal(new Set(bank.parts.part1.questions.map((item) => normalize(item.question))).size, 31, "Part 1 questions must be unique after normalization");
  for (const item of bank.parts.part1.questions) {
    assert.ok(item.source && item.sourceEvidence && item.questionId, `Part 1 provenance missing: ${item.questionId}`);
  }

  // Guard the generator/ingestion pipeline as well as the canonical bank:
  // every old mock slot must point at a real source question, and the only
  // repeated slots must be explicitly marked as source-limited reuse.
  const canonicalQuestionIds = new Set(bank.parts.part1.questions.map((item) => item.questionId));
  const oldSlots: Array<{ sourceQuestionId: string; intentionalReuse: boolean }> = [];
  for (let testNumber = 1; testNumber <= 16; testNumber += 1) {
    const testId = `aptis-b2-${String(testNumber).padStart(2, "0")}`;
    const dataset = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/tests", `${testId}-public.json`), "utf8"));
    const part = dataset.speaking.parts.find((item: { partNumber: number }) => item.partNumber === 1);
    assert.equal(part.questions.length, 3, `${testId} must retain three Part 1 slots`);
    const withinTestIds = new Set<string>();
    for (const question of part.questions) {
      assert.ok(canonicalQuestionIds.has(question.sourceQuestionId), `${testId} points to an unknown canonical source question`);
      assert.ok(!withinTestIds.has(question.sourceQuestionId), `${testId} repeats a question inside one test`);
      assert.equal(typeof question.intentionalReuse, "boolean", `${testId} reuse flag is missing`);
      withinTestIds.add(question.sourceQuestionId);
      oldSlots.push({ sourceQuestionId: question.sourceQuestionId, intentionalReuse: question.intentionalReuse });
    }
  }
  assert.equal(oldSlots.length, 48, "The 16 old tests must expose 48 Part 1 slots");
  assert.equal(new Set(oldSlots.map((slot) => slot.sourceQuestionId)).size, 31, "All 31 source questions must be used before reuse");
  assert.equal(oldSlots.filter((slot) => slot.intentionalReuse).length, 17, "Only the documented 17 source-limited reuse slots are allowed");
  const slotCounts = new Map<string, number>();
  for (const slot of oldSlots) slotCounts.set(slot.sourceQuestionId, (slotCounts.get(slot.sourceQuestionId) || 0) + 1);
  for (const slot of oldSlots) {
    if ((slotCounts.get(slot.sourceQuestionId) || 0) > 1) {
      assert.ok(slot.intentionalReuse || (slotCounts.get(slot.sourceQuestionId) || 0) === 1 + oldSlots.filter((candidate) => candidate.sourceQuestionId === slot.sourceQuestionId && candidate.intentionalReuse).length, "Repeated source questions must carry explicit reuse provenance");
    }
  }

  assert.equal(bank.parts.part2.itemCount, bank.parts.part2.topics.length, "Part 2 itemCount must match playable source topics");
  assert.ok(bank.parts.part2.topics.length >= 30, "Part 2 source bank must contain at least 30 topics");
  assert.ok(bank.parts.part3.topics.length >= 32, "Part 3 source bank must contain at least 32 topics");
  assert.equal(bank.parts.part4.topics.length, 29, "Part 4 must retain all 29 source records");

  const sourceBank = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/prediction/speaking/speaking-bank.json"), "utf8")) as {
    topics: Array<{ candidateId: string; partNumber: number; questions?: Array<unknown> }>;
  };
  const sourcePart2 = sourceBank.topics.filter((topic) => topic.partNumber === 2);
  const canonicalPart2Ids = new Set(bank.parts.part2.topics.map((topic) => topic.topicId.replace("spk-bank-p2-", "")));
  const unresolvedPart2 = bank.sourceCoverage?.unresolvedSourceCandidates
    .filter((candidate) => candidate.partNumber === 2)
    .map((candidate) => candidate.candidateId);
  assert.equal(sourcePart2.length, bank.parts.part2.sourceRecordCount, "Part 2 source record count must match the source bank");
  assert.deepEqual(unresolvedPart2, ["gdrive_spk_p2_012"], "Only the promptless Part 2 source candidate may remain unresolved");
  for (const sourceTopic of sourcePart2) {
    if ((sourceTopic.questions?.length || 0) === 0) continue;
    assert.ok(canonicalPart2Ids.has(sourceTopic.candidateId), `Source Part 2 candidate missing from canonical bank: ${sourceTopic.candidateId}`);
  }

  // Source recovery guard: all 18 records with one source composite plate must
  // stay available only through same-source crops. Record 038 is a parser
  // continuation of the Version 2 block and carries the exact embedded CID
  // provenance rather than being treated as a missing/guessed image.
  const recoveredPart3Ids = [
    36, 37, 38, 40, 43, 48, 50, 51, 52, 53, 54, 58, 59, 60, 61, 62, 63, 64,
  ].map((number) => `spk-bank-p3-gdrive_spk_p3_${String(number).padStart(3, "0")}`);
  const recoveredSet = new Set(recoveredPart3Ids);
  const recovery = bank.sourceRecovery;
  assert.ok(recovery, "Part 3 source recovery metadata must be present");
  assert.equal(recovery.recoveredCount, 18, "All 18 same-source composite pairs are recoverable");
  assert.deepEqual(recovery.remainingSourceLimited, ["gdrive_spk_p3_035"], "Only the independently unresolved duplicate-image source record may remain limited");
  for (const topicId of recoveredPart3Ids) {
    const topic = bank.parts.part3.topics.find((item) => item.topicId === topicId);
    assert.ok(topic, `Recovered Part 3 topic missing: ${topicId}`);
    assert.equal(topic.availability, "available", `Recovered Part 3 topic is not available: ${topicId}`);
    assert.ok(topic.imageA && topic.imageB, `Recovered Part 3 pair is incomplete: ${topicId}`);
    const derivation = topic.sourceEvidence.imagePairRecovery as Record<string, unknown> | undefined;
    assert.equal(derivation?.type, "source-composite-crop", `Missing crop provenance: ${topicId}`);
    assert.equal(derivation?.crossTopicPairing, false, `Cross-topic pairing is forbidden: ${topicId}`);
    const boxes = derivation?.cropBoxes as { a?: number[]; b?: number[] } | undefined;
    assert.equal(boxes?.a?.length, 4, `Image A crop box missing: ${topicId}`);
    assert.equal(boxes?.b?.length, 4, `Image B crop box missing: ${topicId}`);
  }
  const recovered038 = bank.parts.part3.topics.find((item) => item.topicId === "spk-bank-p3-gdrive_spk_p3_038")!;
  assert.equal(recovered038.availability, "available");
  assert.ok(recovered038.imageA && recovered038.imageB);
  assert.equal(recovered038.sourceEvidence.sourceRelationshipStatus, "VERIFIED");
  const recovery038 = recovered038.sourceEvidence.imagePairRecovery as Record<string, unknown> | undefined;
  const placement038 = recovery038?.sourcePlacement as Record<string, unknown> | undefined;
  assert.equal(placement038?.imageCid, "s-blob-v1-IMAGE-9wHJPoUFATE");
  assert.equal(placement038?.sourceOrder, 36);
  assert.equal(placement038?.documentPosition, 6636);
  assert.equal(placement038?.sourceSha256, "b7b70be095e2baf6d1bf281d5e98fddd27249728e753fd4b8f6b795c3798b13c");
  assert.equal(placement038?.relationship, "SHARED_SOURCE_BLOCK_CONTINUATION_OF_gdrive_spk_p3_037");
  assert.deepEqual(recovery038?.cropBoxes, { a: [0, 0, 442, 324], b: [448, 0, 938, 324] });
  assert.equal(recoveredSet.size, 18);

  for (const part of [bank.parts.part2, bank.parts.part3, bank.parts.part4]) {
    assert.equal(new Set(part.topics.map((item) => item.topicId)).size, part.topics.length, `Part ${part.partNumber} topic IDs must be unique`);
    const signatures = part.topics.map((item) => item.normalizedPrompts.join("|"));
    assert.equal(new Set(signatures).size, signatures.length, `Part ${part.partNumber} contains an accidental full-topic duplicate`);
    for (const item of part.topics) {
      assert.ok(item.source && item.sourceEvidence && item.selectionPolicy, `Topic provenance missing: ${item.topicId}`);
      assert.ok(getSpeakingTopicDisplayTitle(item).trim().length > 0, `Topic display title is not usable: ${item.topicId}`);
      if (/^(version\s+\d+\s*:|topic\s+\d+$|hoặc|between these 2 locations)/i.test(item.title.trim())) {
        assert.match(getSpeakingTopicDisplayTitle(item), /^Speaking Part [1-4] · Source topic /, `Raw continuation title leaked into UI: ${item.topicId}`);
      }
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
  assert.equal(p3Topic.availability, "source-limited");
  assert.equal(p3Context.imageUrls, undefined, "Source-limited duplicate-image topic must not expose contaminated visuals");
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
