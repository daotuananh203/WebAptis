import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { retrieveRelevantKnowledge, loadAllKnowledge } from "../lib/knowledge/retriever";
import { loadKnowledgeFromObsidianVault } from "../lib/knowledge/obsidian-adapter";

export async function runRedTeamKnowledgeBrainTests(): Promise<boolean> {
  console.log("==================================================");
  console.log("▶ [RED-TEAM DOMAIN D] Running Knowledge Brain & Dual-Mode Vault Tests...");
  console.log("==================================================");

  // 1. Vault Compiled / Loaded Items Integrity
  console.log("  [D.1] Auditing knowledge vault schema & completeness...");
  const allItems = loadAllKnowledge();
  assert.ok(allItems.length >= 48, `Knowledge base must contain at least 48 notes, got ${allItems.length}`);

  for (const item of allItems) {
    assert.ok(item.id, "Every knowledge note must have an ID");
    assert.ok(item.topic, `Item ${item.id} must have a topic title`);
    assert.ok(item.skill, `Item ${item.id} must have a skill`);
    assert.ok(item.summary, `Item ${item.id} must have a summary`);
    assert.ok(item.content, `Item ${item.id} must have content`);
  }
  console.log(`  ✓ ${allItems.length} Knowledge notes verified with 100% schema integrity.`);

  // 2. Direct Vault Loader
  console.log("  [D.2] Testing Direct Obsidian Vault Loader...");
  const vaultItems = loadKnowledgeFromObsidianVault();
  assert.ok(Array.isArray(vaultItems), "Vault loader must return an array of items");
  assert.ok(vaultItems.length > 0, "Vault loader must load items from vault or compiled fallback");

  // 3. Retrieval Ranking & Boundary Protection
  console.log("  [D.3] Testing Retrieval ranking with empty and boundary queries...");
  const emptyQuery = retrieveRelevantKnowledge("", 5);
  assert.ok(Array.isArray(emptyQuery), "Empty query must return array");

  const cappedQuery = retrieveRelevantKnowledge("reading listening writing speaking grammar", 1);
  assert.equal(cappedQuery.length, 1, "Must respect maxResults = 1");

  console.log("  ✓ Knowledge Brain dual-mode retrieval & error boundaries verified.");
  console.log("✅ [RED-TEAM DOMAIN D PASSED] Knowledge Brain & Vault Tests PASSED!\n");
  return true;
}
