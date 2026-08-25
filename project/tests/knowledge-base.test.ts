import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { KnowledgeItemSchema } from "../lib/knowledge/types";
import {
  loadAllKnowledge,
  retrieveKnowledgeBySkill,
  retrieveKnowledgeByCategory,
  retrieveRelevantKnowledge,
} from "../lib/knowledge/retriever";

export function runKnowledgeBaseTests() {
  console.log("\n==================================================");
  console.log("▶ [TEST 17] Running Edulife Knowledge Base Tests...");
  console.log("==================================================");

  // 1. Validate Schema and Completeness of Knowledge Base
  console.log("  [17.1] Validating Knowledge Base Items Schema & Completeness...");
  const kbPath = path.join(process.cwd(), "data/knowledge/index.json");
  assert.ok(fs.existsSync(kbPath), "Knowledge index.json must exist");

  const raw = fs.readFileSync(kbPath, "utf-8");
  const data = JSON.parse(raw);

  assert.ok(data.items.length >= 25, "Knowledge base must contain at least 25 items");

  const seenIds = new Set<string>();
  for (const item of data.items) {
    // Unique ID check
    assert.strictEqual(seenIds.has(item.id), false, `Duplicate knowledge ID found: ${item.id}`);
    seenIds.add(item.id);

    // Zod schema parse
    const parseRes = KnowledgeItemSchema.safeParse(item);
    if (!parseRes.success) {
      console.error(`Schema error on item ${item.id}:`, parseRes.error.issues);
    }
    assert.ok(parseRes.success, `Knowledge item ${item.id} must conform to schema`);

    // Non-empty checks
    assert.ok(item.topic.length > 5, `Topic must be descriptive: ${item.id}`);
    assert.ok(item.summary.length > 10, `Summary must be descriptive: ${item.id}`);
    assert.ok(item.content.length > 30, `Content must have substantive text: ${item.id}`);

    // Source transparency check
    assert.strictEqual(item.sourceType, "edulife", `Source type must be edulife for ${item.id}`);
    assert.strictEqual(item.isOfficialBritishCouncil, false, `isOfficialBritishCouncil must be false for ${item.id}`);
    assert.ok(item.sourceFile.length > 0, `sourceFile must be traceable for ${item.id}`);
  }
  console.log(`  ✓ All ${data.items.length} knowledge items conform to schema and source rules.`);

  // 2. Validate Category Coverage (9 Categories)
  console.log("  [17.2] Validating Category Coverage across 9 Core Domains...");
  const expectedCategories = [
    "Grammar",
    "Vocabulary",
    "Reading Strategy",
    "Listening Strategy",
    "Writing Strategy",
    "Speaking Strategy",
    "Exam Strategy",
    "Common Mistakes",
    "B2 Language Tips",
  ];

  for (const cat of expectedCategories) {
    const items = retrieveKnowledgeByCategory(cat as any);
    assert.ok(items.length > 0, `Category '${cat}' must have at least 1 knowledge item`);
    console.log(`    • ${cat}: ${items.length} items verified`);
  }

  // 3. Retrieval by Skill
  console.log("  [17.3] Testing Skill-based Knowledge Retrieval...");
  const readingItems = retrieveKnowledgeBySkill("Reading");
  assert.ok(readingItems.length >= 4, "Must retrieve Reading knowledge items");
  assert.ok(readingItems.some((it) => it.part === "1"));
  assert.ok(readingItems.some((it) => it.part === "4"));

  const writingItems = retrieveKnowledgeBySkill("Writing");
  assert.ok(writingItems.length >= 4, "Must retrieve Writing knowledge items");
  assert.ok(writingItems.some((it) => it.topic.includes("Email")));

  // 4. Keyword / Question Retrieval Search
  console.log("  [17.4] Testing AI Coach Query-based Knowledge Retrieval...");
  const formalEmailQuery = retrieveRelevantKnowledge("how to write formal email dear sir madam", 2);
  assert.ok(formalEmailQuery.length > 0);
  assert.ok(formalEmailQuery[0].tags.includes("formal-email") || formalEmailQuery[0].tags.includes("part4"));

  const conditionalQuery = retrieveRelevantKnowledge("conditional sentences inversion had you", 2);
  assert.ok(conditionalQuery.length > 0);
  assert.ok(conditionalQuery[0].tags.includes("conditionals") || conditionalQuery[0].tags.includes("inversion"));

  console.log("  ✓ Query-based retrieval engine returns targeted knowledge items.");

  console.log("✅ [TEST 17 PASSED] Edulife Knowledge Base tests completed successfully.");
}

if (process.argv[1]?.endsWith("knowledge-base.test.ts")) {
  runKnowledgeBaseTests();
}
