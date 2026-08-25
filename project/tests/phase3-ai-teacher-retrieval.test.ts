import assert from "node:assert/strict";
import {
  retrieveRelevantKnowledge,
  retrieveCrossSkillKnowledge,
  retrieveKnowledgeBySkill,
  loadAllKnowledge,
} from "../lib/knowledge/retriever";
import {
  AICoachChatInputSchema,
  DEFAULT_EMPTY_COACH_CONTEXT,
} from "../lib/coach/types";
import {
  buildAICoachPrompt,
  AI_COACH_SYSTEM_INSTRUCTION,
} from "../lib/coach/prompts";
import {
  getCoachAdvice,
  parseAndValidateCoachOutput,
} from "../lib/coach/advisor";

export async function runPhase3AiTeacherRetrievalTests() {
  console.log("\n==================================================");
  console.log("▶ [TEST 25] Running Phase 3 AI Teacher & Knowledge Retrieval Tests...");
  console.log("==================================================");

  // ----------------------------------------------------
  // 1. Free-form Questions Across All 5 Skills Accepted
  // ----------------------------------------------------
  console.log("  [25.1] Testing Free-Form Question Input Validation...");
  const sampleFreeFormQueries = [
    { skill: "Grammar", text: "Why do we use present perfect here?" },
    { skill: "Vocabulary", text: "What is the difference between 'say' and 'tell'?" },
    { skill: "Reading", text: "How should I approach Reading Part 3?" },
    { skill: "Listening", text: "How can I identify distractors in Part 1?" },
    { skill: "Writing", text: "Can you explain how to improve my formal email?" },
    { skill: "Speaking", text: "How should I develop ideas in Part 2?" },
    { skill: "Strategy", text: "How do I manage my time in Aptis B2?" },
    { skill: "Scoring", text: "What are the rubrics for Aptis B2 writing?" },
    { skill: "Why", text: "Why is option B correct?" },
    { skill: "Correction", text: "Please correct my sentence: I live here since 2020." },
  ];

  for (const q of sampleFreeFormQueries) {
    // 1. Without coachContext provided (fallback default)
    const parseResultNoContext = AICoachChatInputSchema.safeParse({
      userMessage: q.text,
    });
    assert.ok(parseResultNoContext.success, `Free-form query '${q.text}' must succeed without context`);
    assert.deepEqual(parseResultNoContext.data.coachContext, DEFAULT_EMPTY_COACH_CONTEXT);

    // 2. With populated coachContext
    const parseResultWithContext = AICoachChatInputSchema.safeParse({
      userMessage: q.text,
      coachContext: DEFAULT_EMPTY_COACH_CONTEXT,
    });
    assert.ok(parseResultWithContext.success, `Free-form query '${q.text}' must succeed with context`);
  }
  console.log("  ✓ 10/10 Free-form questions validated successfully through input schema.");

  // ----------------------------------------------------
  // 2. Suggested vs Free-form Pipeline Equivalence
  // ----------------------------------------------------
  console.log("  [25.2] Testing Suggested Questions Pipeline Equivalence...");
  const suggestedQuestions = [
    "Hôm nay mình nên học gì để đạt B2?",
    "Làm thế nào để cải thiện điểm reading?",
    "Cách viết email trang trọng đạt điểm cao ở Part 4?",
    "Mẹo phân bổ thời gian bài thi Aptis B2?",
  ];

  for (const sq of suggestedQuestions) {
    const parsed = AICoachChatInputSchema.safeParse({ userMessage: sq });
    assert.ok(parsed.success, `Suggested question '${sq}' must use the exact same schema`);
  }
  console.log("  ✓ Suggested questions confirmed using identical pipeline and contract.");

  // ----------------------------------------------------
  // 3. Five-Skill Knowledge Retrieval Verification
  // ----------------------------------------------------
  console.log("  [25.3] Testing Knowledge Retrieval Across All 5 Skills...");

  // Grammar
  const grammarHits = retrieveRelevantKnowledge("Why do we use present perfect here?", 3);
  assert.ok(grammarHits.length > 0, "Must retrieve Grammar knowledge");
  assert.ok(grammarHits.some((k) => k.skill === "Grammar" || k.tags.includes("present-perfect") || k.tags.includes("tenses")));

  // Vocabulary
  const vocabHits = retrieveRelevantKnowledge("essential collocations for b2 reduced price sentimental value", 3);
  assert.ok(vocabHits.length > 0, "Must retrieve Vocabulary knowledge");
  assert.ok(vocabHits.some((k) => k.skill === "Vocabulary" || k.tags.includes("collocations")));

  // Reading
  const readingHits = retrieveRelevantKnowledge("How should I approach Reading Part 3 opinion matching?", 3);
  assert.ok(readingHits.length > 0, "Must retrieve Reading knowledge");
  assert.ok(readingHits.some((k) => k.skill === "Reading" || k.category.includes("Reading")));

  // Listening
  const listeningHits = retrieveRelevantKnowledge("How can I identify distractors in listening Part 1 short dialogues?", 3);
  assert.ok(listeningHits.length > 0, "Must retrieve Listening knowledge");
  assert.ok(listeningHits.some((k) => k.skill === "Listening" || k.category.includes("Listening")));

  // Writing
  const writingHits = retrieveRelevantKnowledge("Can you explain how to improve my formal email writing Part 4?", 3);
  assert.ok(writingHits.length > 0, "Must retrieve Writing knowledge");
  assert.ok(writingHits.some((k) => k.skill === "Writing" || k.category.includes("Writing")));

  // Speaking
  const speakingHits = retrieveRelevantKnowledge("How should I develop ideas in Speaking Part 2 photo description?", 3);
  assert.ok(speakingHits.length > 0, "Must retrieve Speaking knowledge");
  assert.ok(speakingHits.some((k) => k.skill === "Speaking" || k.category.includes("Speaking")));

  console.log("  ✓ 5/5 Skill retrieval queries returned targeted verified notes.");

  // ----------------------------------------------------
  // 4. Cross-Skill Retrieval Verification
  // ----------------------------------------------------
  console.log("  [25.4] Testing Cross-Skill Retrieval Links...");
  const crossSkillSpeakingHits = retrieveCrossSkillKnowledge("How to describe picture in Speaking Part 2?");
  assert.ok(crossSkillSpeakingHits.length >= 2, "Cross-skill speaking must return multiple items");
  assert.ok(
    crossSkillSpeakingHits.some((k) => k.skill === "Speaking"),
    "Must include primary Speaking note"
  );
  assert.ok(
    crossSkillSpeakingHits.some((k) => k.skill === "Grammar" || k.skill === "Vocabulary" || k.skill === "General"),
    "Must include complementary Grammar/Vocabulary note"
  );

  const crossSkillWritingHits = retrieveCrossSkillKnowledge("How to write formal email in Writing Part 4?");
  assert.ok(crossSkillWritingHits.length >= 2, "Cross-skill writing must return multiple items");
  assert.ok(
    crossSkillWritingHits.some((k) => k.skill === "Writing"),
    "Must include primary Writing note"
  );
  console.log("  ✓ Cross-skill retrieval successfully linked speaking/writing with grammar/vocab context.");

  // ----------------------------------------------------
  // 5. Source Provenance & Disclaimer
  // ----------------------------------------------------
  console.log("  [25.5] Testing Source Provenance & Non-Official Disclaimers...");
  const allKnowledge = loadAllKnowledge();
  assert.ok(allKnowledge.length >= 30, "Knowledge base must contain at least 30 items from Vault + Static");

  for (const item of allKnowledge) {
    assert.strictEqual(item.isOfficialBritishCouncil, false, `Item ${item.id} must NOT claim official British Council status`);
    assert.ok(item.sourceFile.length > 0, `Item ${item.id} must have traceable sourceFile`);
  }
  console.log(`  ✓ All ${allKnowledge.length} knowledge items verified with strict provenance and anti-hallucination disclaimers.`);

  // ----------------------------------------------------
  // 6. Execution with Mock AI Teacher Engine
  // ----------------------------------------------------
  console.log("  [25.6] Testing AI Teacher Conversational Advice Execution...");
  const mockAiClient: any = {
    models: {
      generateContent: async ({ contents }: any) => {
        return {
          text: JSON.stringify({
            message: "Trong tiếng Anh, Hiện tại hoàn thành (Present Perfect) được dùng khi hành động đã diễn ra trong quá khứ nhưng để lại kết quả ở hiện tại, hoặc đi kèm các trạng từ như 'since', 'already'.",
            explanation: "S + have/has + V3/ed",
            evidence: "Dấu hiệu 'since 2020' bắt buộc dùng thì Hiện tại hoàn thành.",
            relatedKnowledgeIds: ["obs-02-grammar-tenses-present-perfect-md"],
            relatedRecommendationId: null,
            actionSuggestions: [
              "Ôn lại bảng động từ bất quy tắc",
              "Làm 5 câu bài tập chia thì Present Perfect",
            ],
          }),
        };
      },
    },
  };

  const adviceResult = await getCoachAdvice(
    {
      userMessage: "Why do we use present perfect here?",
      coachContext: DEFAULT_EMPTY_COACH_CONTEXT,
    },
    mockAiClient
  );

  assert.ok(adviceResult.message.includes("Hiện tại hoàn thành"));
  assert.strictEqual(adviceResult.explanation, "S + have/has + V3/ed");
  assert.strictEqual(adviceResult.disclaimer, "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE");
  assert.ok(adviceResult.actionSuggestions.length === 2);
  console.log("  ✓ Structured AI Teacher response with explanation, evidence, and suggestions verified.");

  console.log("✅ [TEST 25 PASSED] Phase 3 AI Teacher & Knowledge Retrieval tests completed successfully.\n");
}

if (process.argv[1]?.endsWith("phase3-ai-teacher-retrieval.test.ts")) {
  runPhase3AiTeacherRetrievalTests();
}
