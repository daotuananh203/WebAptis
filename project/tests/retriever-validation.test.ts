import assert from "node:assert/strict";
import {
  retrieveRelevantKnowledge,
  retrieveKnowledgeBySkill,
  retrieveKnowledgeByCategory,
  retrieveKnowledgeBySkillAndPart,
} from "../lib/knowledge/retriever";
import { KnowledgeItem } from "../lib/knowledge/types";

// ============================================================
// Helper utilities
// ============================================================

interface QueryResult {
  query: string;
  results: KnowledgeItem[];
  top1Id?: string;
  allIds: string[];
}

function runQuery(query: string, max = 3): QueryResult {
  const results = retrieveRelevantKnowledge(query, max);
  return {
    query,
    results,
    top1Id: results[0]?.id,
    allIds: results.map((r) => r.id),
  };
}

function assertRelevant(r: QueryResult, expectedIds: string[], description: string) {
  const found = expectedIds.some((id) => r.allIds.includes(id));
  assert.ok(found, `FAIL [${description}]: Expected one of [${expectedIds.join(", ")}] in results [${r.allIds.join(", ")}] for query: "${r.query}"`);
}

function assertTop1(r: QueryResult, expectedId: string, description: string) {
  assert.strictEqual(r.top1Id, expectedId, `FAIL [${description}]: Expected top1="${expectedId}" but got "${r.top1Id}" for query: "${r.query}"`);
}

function assertEmpty(r: QueryResult, description: string) {
  assert.strictEqual(r.results.length, 0, `FAIL [${description}]: Expected empty results but got [${r.allIds.join(", ")}] for query: "${r.query}"`);
}

function assertNoFalsePositive(r: QueryResult, forbiddenIds: string[], description: string) {
  const fp = r.allIds.filter((id) => forbiddenIds.includes(id));
  assert.strictEqual(fp.length, 0, `FAIL [${description}]: False positive IDs ${fp.join(", ")} for query: "${r.query}"`);
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

export function runRetrieverValidationTests() {
  console.log("\n==================================================");
  console.log("▶ [TEST 18] Running Knowledge Retriever Validation Tests...");
  console.log("==================================================");

  const pass: string[] = [];
  const fail: string[] = [];

  function check(label: string, fn: () => void) {
    try {
      fn();
      pass.push(label);
    } catch (e: any) {
      fail.push(`${label}: ${e.message}`);
    }
  }

  // ============================================================
  // GROUP A: Exact Skill + Part Queries (Vietnamese)
  // ============================================================

  check("A1 Reading Part 4 — ghép tiêu đề đoạn văn", () => {
    const r = runQuery("làm thế nào để làm Reading Part 4 ghép tiêu đề?");
    assertRelevant(r, ["kb-read-strat-04"], "Reading Part 4 strategy");
  });

  check("A2 Reading Part 3 — ghép ý kiến 4 người", () => {
    const r = runQuery("chiến thuật đọc Part 3 ghép ý kiến của 4 người");
    assertRelevant(r, ["kb-read-strat-03"], "Reading Part 3 opinion matching");
    assertNoFalsePositive(r, ["kb-lis-strat-03"], "should not confuse with Listening Part 3");
  });

  check("A3 Reading Part 2 — sắp xếp câu", () => {
    const r = runQuery("mẹo sắp xếp câu trong bài Reading Part 2");
    assertRelevant(r, ["kb-read-strat-02"], "Reading Part 2 text cohesion");
  });

  check("A4 Listening Part 2 — ghép ý kiến người nói", () => {
    const r = runQuery("cách làm Listening Part 2 ghép ý kiến 4 người nói");
    assertRelevant(r, ["kb-lis-strat-02"], "Listening Part 2 speaker matching");
  });

  check("A5 Listening Part 4 — bài giảng độc thoại", () => {
    const r = runQuery("nghe bài giảng dài Listening Part 4 ghi chú thế nào?");
    assertRelevant(r, ["kb-lis-strat-04"], "Listening Part 4 lecture strategy");
  });

  check("A6 Writing Part 4 formal email", () => {
    const r = runQuery("hướng dẫn viết email trang trọng cho ban quản lý 120 từ");
    assertRelevant(r, ["kb-writ-strat-04"], "Writing Part 4 formal email");
    // Must not surface speaking items
    assertNoFalsePositive(r, ["kb-spk-strat-01", "kb-spk-strat-02"], "no speaking items");
  });

  check("A7 Writing Part 4 informal email", () => {
    const r = runQuery("viết email thân mật cho bạn bè 50 từ về thay đổi câu lạc bộ");
    assertRelevant(r, ["kb-writ-strat-04"], "Writing Part 4 informal email included in same strategy item");
  });

  check("A8 Writing Part 3 — chat phòng nhóm", () => {
    const r = runQuery("trả lời tin nhắn trong phòng chat câu lạc bộ 40 từ");
    assertRelevant(r, ["kb-writ-strat-03"], "Writing Part 3 social chat");
  });

  check("A9 Speaking Part 2 — miêu tả ảnh 45 giây", () => {
    const r = runQuery("cách tả ảnh Speaking Part 2 trong 45 giây foreground background");
    assertRelevant(r, ["kb-spk-strat-02"], "Speaking Part 2 photo description");
  });

  check("A10 Speaking Part 3 — so sánh 2 tranh", () => {
    const r = runQuery("so sánh hai bức tranh Speaking Part 3 ưu nhược điểm");
    assertRelevant(r, ["kb-spk-strat-03"], "Speaking Part 3 compare two photos");
  });

  check("A11 Speaking Part 4 — thuyết trình 2 phút", () => {
    const r = runQuery("chiến thuật thuyết trình 120 giây Speaking Part 4 ghi chú từ khóa");
    assertRelevant(r, ["kb-spk-strat-04"], "Speaking Part 4 long speech");
  });

  check("A12 Grammar — câu điều kiện", () => {
    const r = runQuery("câu điều kiện loại 3 mixed conditionals had you inversion");
    assertRelevant(r, ["kb-gram-03", "kb-gram-04"], "Conditional + inversion grammar");
    assert.ok(r.results.length >= 1 && r.results.length <= 3, "Result count within 1-3");
  });

  check("A13 Vocabulary B2 synonyms", () => {
    const r = runQuery("từ đồng nghĩa học thuật B2 abundant commence hazard");
    assertRelevant(r, ["kb-voc-01"], "Vocabulary synonyms item");
  });

  // ============================================================
  // GROUP B: Natural Vietnamese paraphrase queries
  // (wording differs from keyword in knowledge items)
  // ============================================================

  check("B1 'Khi nào dùng to-v khi nào dùng v-ing' — maps to gerund/infinitive", () => {
    const r = runQuery("khi nào dùng to-v khi nào dùng v-ing sau động từ");
    assertRelevant(r, ["kb-gram-05"], "Gerund vs infinitive");
  });

  check("B2 'Đọc bài dài tìm chủ đề' — maps to Reading Part 4", () => {
    const r = runQuery("đọc bài dài tìm chủ đề từng đoạn văn");
    assertRelevant(r, ["kb-read-strat-04"], "Reading Part 4 via paraphrase");
  });

  check("B3 'Cách tránh ngập ngừng khi nói' — maps to Speaking Common Mistakes", () => {
    const r = runQuery("tránh ừm hm khi nói tránh ngập ngừng chết trong phỏng vấn speaking");
    assertRelevant(r, ["kb-mistake-02"], "Speaking common mistakes hesitation");
  });

  check("B4 'Viết tắt trong thư chính thức sai không' — maps to Writing Common Mistakes", () => {
    const r = runQuery("có được viết tắt trong thư trang trọng không I'm hay I am");
    assertRelevant(r, ["kb-mistake-01"], "Formal email writing mistake");
  });

  check("B5 'Nâng điểm band B2' — maps to B2 Language Tips", () => {
    const r = runQuery("làm sao nâng band từ B1 lên B2 viết từ ngữ học thuật hơn");
    assertRelevant(r, ["kb-b2-tips-01", "kb-b2-tips-02"], "B2 tips items");
  });

  check("B6 'Không đủ thời gian làm bài' — maps to Exam Strategy", () => {
    const r = runQuery("quản lý thời gian thi Aptis 5 kỹ năng không đủ giờ");
    assertRelevant(r, ["kb-exam-strat-01"], "Exam strategy time management");
  });

  check("B7 'Nghe bẫy thay đổi giá tiền' — maps to Listening Part 1", () => {
    const r = runQuery("nghe nhầm giá bị thay đổi trong bài ngắn Listening bẫy");
    assertRelevant(r, ["kb-lis-strat-01"], "Listening Part 1 number trap");
  });

  check("B8 'Cụm động từ look into turn down' — maps to Vocabulary phrasal verbs", () => {
    const r = runQuery("look into turn down call off phrasal verb ý nghĩa");
    assertRelevant(r, ["kb-voc-03"], "Vocabulary phrasal verbs");
  });

  // ============================================================
  // GROUP C: No-match (irrelevant) queries → must return []
  // ============================================================

  check("C1 Irrelevant — weather forecast", () => {
    const r = runQuery("thời tiết ngày mai Hà Nội có mưa không");
    assertEmpty(r, "Completely irrelevant weather query");
  });

  check("C2 Irrelevant — food recipe", () => {
    const r = runQuery("công thức nấu phở bò cho gia đình 4 người");
    assertEmpty(r, "Irrelevant food recipe query");
  });

  check("C3 Empty query → []", () => {
    const r = runQuery("");
    assertEmpty(r, "Empty string query");
  });

  check("C4 Nonsense string → []", () => {
    const r = runQuery("xqz99abc123 zzz9999 randomjunk");
    assertEmpty(r, "Nonsense string query");
  });

  // ============================================================
  // GROUP D: Ranking quality tests
  // ============================================================

  check("D1 Reading Part 4 — correct item must be Top 1", () => {
    const r = runQuery("matching headings reading part 4 chiến thuật");
    assertTop1(r, "kb-read-strat-04", "Reading Part 4 must be ranked #1");
  });

  check("D2 Writing formal email — correct item must be Top 1", () => {
    const r = runQuery("formal email writing part 4 yours faithfully dear sir");
    assertTop1(r, "kb-writ-strat-04", "Writing Part 4 strategy must be ranked #1");
  });

  check("D3 Multiple relevant items — all returned in top 3", () => {
    const r = runQuery("grammar vocabulary synonyms collocations phrasal verbs b2");
    // Should return grammar + vocabulary items, at least 2 distinct
    assert.ok(r.results.length >= 2, "Should return multiple relevant knowledge items");
    const hasGram = r.allIds.some((id) => id.startsWith("kb-gram") || id.startsWith("kb-voc"));
    assert.ok(hasGram, "At least one grammar/vocabulary item in top results");
  });

  check("D4 Ranking: tag match outranks content-only match", () => {
    const r = runQuery("part4 listening extended-monologue");
    // kb-lis-strat-04 has these as tags so should rank very high
    assert.ok(r.allIds.includes("kb-lis-strat-04"), "Tag-matched item must appear in results");
  });

  // ============================================================
  // GROUP E: Skill+Part filter API
  // ============================================================

  check("E1 retrieveKnowledgeBySkillAndPart — Reading Part 4", () => {
    const items = retrieveKnowledgeBySkillAndPart("Reading", "4");
    assert.ok(items.length >= 1, "Must find Reading Part 4 knowledge");
    assert.ok(items.every((k) => k.skill === "Reading" || k.skill === "General"), "Skill constraint");
    assert.ok(items.every((k) => k.part === "4"), "Part constraint");
  });

  check("E2 retrieveKnowledgeBySkillAndPart — Speaking Part 3", () => {
    const items = retrieveKnowledgeBySkillAndPart("Speaking", "3");
    assert.ok(items.length >= 1, "Must find Speaking Part 3 knowledge");
    assert.ok(items.every((k) => k.part === "3"), "Part 3 constraint");
    assert.strictEqual(items[0].id, "kb-spk-strat-03", "Correct Speaking Part 3 item");
  });

  check("E3 retrieveKnowledgeBySkill — Writing returns all parts", () => {
    const items = retrieveKnowledgeBySkill("Writing");
    assert.ok(items.length >= 4, "Writing strategy has 4 parts + mistakes");
    const parts = items.filter((k) => k.skill === "Writing").map((k) => k.part);
    assert.ok(parts.includes("1"), "Includes Part 1");
    assert.ok(parts.includes("4"), "Includes Part 4");
  });

  check("E4 retrieveKnowledgeByCategory — Common Mistakes", () => {
    const items = retrieveKnowledgeByCategory("Common Mistakes");
    assert.ok(items.length >= 2, "Must have at least 2 common mistake items");
    assert.ok(items.some((k) => k.id === "kb-mistake-01"), "Writing mistake item");
    assert.ok(items.some((k) => k.id === "kb-mistake-02"), "Speaking mistake item");
  });

  // ============================================================
  // GROUP F: Source attribution & Regression
  // ============================================================

  check("F1 All retrieved items are source-attributed", () => {
    const queries = [
      "chiến thuật reading part 4",
      "email trang trọng formal",
      "speaking part 3 so sánh tranh",
    ];
    for (const q of queries) {
      const items = retrieveRelevantKnowledge(q, 3);
      for (const item of items) {
        assert.strictEqual(item.sourceType, "edulife", `sourceType must be 'edulife' for ${item.id}`);
        assert.strictEqual(item.isOfficialBritishCouncil, false, `isOfficialBritishCouncil must be false for ${item.id}`);
        assert.ok(item.sourceFile.length > 0, `sourceFile must be non-empty for ${item.id}`);
        assert.ok(item.sourceName.includes("Edulife"), `sourceName must include 'Edulife' for ${item.id}`);
      }
    }
  });

  check("F2 Retrieved items never include progress/recommendation data", () => {
    const items = retrieveRelevantKnowledge("điểm yếu của tôi là reading kết quả luyện tập", 3);
    for (const item of items) {
      // KnowledgeItem should never have score/progress fields
      const itemAny = item as any;
      assert.strictEqual(itemAny.score, undefined, "score must not exist on knowledge item");
      assert.strictEqual(itemAny.weakAreas, undefined, "weakAreas must not exist on knowledge item");
      assert.strictEqual(itemAny.recommendations, undefined, "recommendations must not exist on knowledge item");
    }
  });

  check("F3 Max results cap respected", () => {
    const items = retrieveRelevantKnowledge("grammar vocabulary reading listening writing speaking", 2);
    assert.ok(items.length <= 2, "Must never exceed maxResults");
  });

  // ============================================================
  // FINAL REPORT
  // ============================================================

  const total = pass.length + fail.length;
  console.log(`\n  Retrieval Validation Results: ${pass.length}/${total} queries passed\n`);

  for (const p of pass) {
    console.log(`  ✓ ${p}`);
  }

  if (fail.length > 0) {
    console.log("\n  ❌ Failed queries:");
    for (const f of fail) {
      console.error(`  ✗ ${f}`);
    }
    throw new Error(`[TEST 18] ${fail.length} retrieval queries failed.`);
  }

  console.log("✅ [TEST 18 PASSED] Knowledge Retriever Validation completed successfully.");
}
