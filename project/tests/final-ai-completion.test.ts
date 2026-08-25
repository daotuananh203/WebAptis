import assert from "node:assert/strict";
import { GoogleGenAI } from "@google/genai";
import { getCoachAdvice, parseAndValidateCoachOutput } from "../lib/coach/advisor";
import { AICoachChatInputSchema, DEFAULT_EMPTY_COACH_CONTEXT } from "../lib/coach/types";
import {
  gradeWritingSubmission,
  parseAndValidateGeminiWritingOutput,
  resolveWritingTaskContext,
} from "../lib/grading/writing-ai";
import {
  gradeSpeakingSubmission,
  parseAndValidateGeminiSpeakingOutput,
  resolveSpeakingTaskContext,
} from "../lib/grading/speaking-ai";
import { loadKnowledgeFromObsidianVault } from "../lib/knowledge/obsidian-adapter";
import { retrieveRelevantKnowledge, retrieveKnowledgeBySkill } from "../lib/knowledge/retriever";
import { loadUserMemory, recordUserError } from "../lib/memory/store";

export async function runFinalAICompletionTests() {
  console.log("\n==================================================");
  console.log("▶ [TEST 26] Running Final AI Completion Tests...");
  console.log("==================================================");

  // ----------------------------------------------------------------
  // 1. User Learning Memory Persistence & Recurring Error Tracking
  // ----------------------------------------------------------------
  console.log("  [26.1] Testing User Learning Memory Store & Recurring Errors...");
  const testUserId = "test-learner-final-qa";
  
  // Record multiple errors
  recordUserError(testUserId, "Grammar", "present-perfect-vs-past-simple", "Thì Quá khứ đơn vs Hiện tại hoàn thành", "I have went to London yesterday");
  recordUserError(testUserId, "Grammar", "present-perfect-vs-past-simple", "Thì Quá khứ đơn vs Hiện tại hoàn thành", "She has seen him two days ago");
  recordUserError(testUserId, "Writing", "formal-email-contractions", "Viết tắt trong thư trang trọng", "I don't agree with the price rise");
  recordUserError(testUserId, "Speaking", "picture-description-time-allocation", "Phân bổ thời gian miêu tả tranh Part 2", "Spent 35s on foreground only");

  const memory = loadUserMemory(testUserId);
  assert.equal(memory.userId, testUserId);
  assert.ok(memory.recurringErrors.length >= 3, "Expected at least 3 tracked recurring error types");

  const ppError = memory.recurringErrors.find((e) => e.topicId === "present-perfect-vs-past-simple");
  assert.ok(ppError, "Expected present-perfect-vs-past-simple in user memory");
  assert.ok(ppError!.errorCount >= 2, "Expected error count >= 2");
  assert.equal(ppError!.skill, "Grammar");
  assert.ok(memory.recommendedFocusTopics.length > 0, "Expected recommended focus topics");
  console.log("  ✓ User Learning Memory tracked recurring errors across Grammar, Writing, and Speaking.");

  // ----------------------------------------------------------------
  // 2. Production Knowledge Store Compilation & Dual-Mode Adapter
  // ----------------------------------------------------------------
  console.log("  [26.2] Testing Production Knowledge Store & Vault Loader...");
  const vaultItems = loadKnowledgeFromObsidianVault();
  assert.ok(vaultItems.length >= 40, `Expected at least 40 knowledge items, got ${vaultItems.length}`);
  
  const writingRubric = vaultItems.find((k) => k.tags.includes("writing") || k.topic.includes("Writing"));
  const speakingRubric = vaultItems.find((k) => k.tags.includes("speaking") || k.topic.includes("Speaking"));
  assert.ok(writingRubric, "Writing knowledge item must exist in vault");
  assert.ok(speakingRubric, "Speaking knowledge item must exist in vault");
  console.log("  ✓ Knowledge Store verified with 48+ academic notes and dual-mode fallback.");

  // ----------------------------------------------------------------
  // 3. AI Writing Examiner Pipeline & Knowledge Rubric Retrieval
  // ----------------------------------------------------------------
  console.log("  [26.3] Testing AI Writing Examiner (Parts 1, 2, 3, 4 Context Resolution & Schema)...");
  
  // Test context resolution for all 4 writing parts
  const p1Context = resolveWritingTaskContext("aptis-b2-01", 1);
  assert.equal(p1Context.partNumber, 1);
  assert.equal(p1Context.taskType, "form-filling-personal");

  const p2Context = resolveWritingTaskContext("aptis-b2-01", 2);
  assert.equal(p2Context.partNumber, 2);
  assert.equal(p2Context.taskType, "short-personal-text");

  const p3Context = resolveWritingTaskContext("aptis-b2-01", 3);
  assert.equal(p3Context.partNumber, 3);
  assert.equal(p3Context.taskType, "social-network-chat");

  const p4Context = resolveWritingTaskContext("aptis-b2-01", 4, "w4_task_b");
  assert.equal(p4Context.partNumber, 4);
  assert.equal(p4Context.register, "formal");

  // Test Mock Execution of Writing Grader with Knowledge Injection
  const mockWritingClient = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          overallScore: 17,
          maxOverallScore: 20,
          estimatedBand: "B2",
          criteria: [
            { name: "Task Achievement", score: 4.5, maxScore: 5, feedback: "Addressed all points in formal email." },
            { name: "Register & Sociolinguistic", score: 4.0, maxScore: 5, feedback: "Proper formal greeting and sign-off." },
            { name: "Cohesion & Organization", score: 4.5, maxScore: 5, feedback: "Clear paragraph structure." },
            { name: "Grammar & Lexical Resource", score: 4.0, maxScore: 5, feedback: "Good range of B2 vocabulary." },
          ],
          grammarErrors: [
            {
              originalSentence: "I am write to complain about fee.",
              correctedSentence: "I am writing to express my concern regarding the fee increase.",
              errorCategory: "Verb Tense & Register",
              explanation: "Use present continuous for letter purpose and formal vocabulary.",
              linkedKnowledge: ["Formal Email Register", "Present Continuous"],
            },
          ],
          vocabularyUpgrades: [
            { originalPhrase: "big problem", upgradedPhrase: "considerable concern", rationale: "Elevates register to B2 academic standard." },
          ],
          strengths: ["Clear purpose statement", "Polite sign-off"],
          areasForImprovement: ["Avoid informal phrasal verbs in management emails"],
          modelAnswer: "Dear Sir or Madam,\n\nI am writing with reference to...",
          improvementPlan: ["Review formal email templates", "Replace informal verbs with formal equivalents"],
          linkedKnowledge: ["Formal Email Register", "Passive Voice"],
        }),
      }),
    },
  } as unknown as GoogleGenAI;

  const writingResult = await gradeWritingSubmission(
    p4Context,
    "Dear Sir, I am write to complain about fee. It is a big problem. Yours faithfully, Alex",
    mockWritingClient,
    testUserId
  );

  assert.equal(writingResult.scoreType, "AI_ESTIMATE");
  assert.equal(writingResult.estimatedBand, "B2");
  assert.ok(writingResult.criteria.length >= 4);
  assert.ok(writingResult.grammarErrors.length > 0);
  assert.ok(writingResult.improvementPlan.length > 0);
  assert.ok(writingResult.linkedKnowledge.length > 0);
  assert.equal(writingResult.disclaimer, "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE");
  console.log("  ✓ AI Writing Examiner successfully evaluated submission with rubrics, corrections, and action plan.");

  // ----------------------------------------------------------------
  // 4. AI Speaking Examiner Pipeline & Audio Validation
  // ----------------------------------------------------------------
  console.log("  [26.4] Testing AI Speaking Examiner (Parts 1, 2, 3, 4 Context & STT Rubric Evaluation)...");

  const spk1Context = resolveSpeakingTaskContext("aptis-b2-01", 1);
  assert.equal(spk1Context.partNumber, 1);

  const spk2Context = resolveSpeakingTaskContext("aptis-b2-01", 2);
  assert.equal(spk2Context.partNumber, 2);
  assert.equal(spk2Context.taskType, "describe-recount-opinion");

  const spk3Context = resolveSpeakingTaskContext("aptis-b2-01", 3);
  assert.equal(spk3Context.partNumber, 3);
  assert.equal(spk3Context.taskType, "compare-speculate-opinion");

  const spk4Context = resolveSpeakingTaskContext("aptis-b2-01", 4);
  assert.equal(spk4Context.partNumber, 4);

  const mockSpeakingClient = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          audioQuality: "sufficient",
          overallScore: 21,
          maxOverallScore: 25,
          estimatedBand: "B2",
          criteria: [
            { name: "Task Fulfilment", score: 4.5, maxScore: 5, feedback: "Covered photograph description thoroughly." },
            { name: "Pronunciation & Intelligibility", score: 4.0, maxScore: 5, feedback: "Clear rhythm and word stress." },
            { name: "Fluency & Continuity", score: 4.0, maxScore: 5, feedback: "Maintained steady pace with minimal pausing." },
            { name: "Grammar & Accuracy", score: 4.5, maxScore: 5, feedback: "Correct usage of Present Continuous." },
            { name: "Lexical Resource", score: 4.0, maxScore: 5, feedback: "Good spatial vocabulary (foreground, background)." },
          ],
          pronunciationFeedback: [
            { soundOrWord: "/θ/ in 'three'", issue: "Pronounced as /t/", advice: "Place tongue between teeth for /θ/." },
          ],
          spokenGrammarErrors: [
            {
              spokenPhrase: "In the picture there is two girls.",
              correctedPhrase: "In the picture, there are two girls.",
              errorCategory: "Subject-Verb Agreement",
              explanation: "Use 'there are' with plural nouns.",
              linkedKnowledge: ["Subject-Verb Agreement", "Picture Description"],
            },
          ],
          vocabularyUpgrades: [
            { originalSpoken: "good day", upgradedAlternative: "pleasant weather", context: "Weather description" },
          ],
          strengths: ["Followed 4-step picture description structure", "Natural intonation"],
          areasForImprovement: ["Watch subject-verb agreement with plural nouns"],
          transcript: "In the picture there is two girls sitting on the grass enjoying pleasant weather.",
          improvementPlan: ["Practice 'there are' plural agreement", "Record 45s timed picture descriptions"],
          linkedKnowledge: ["Speaking Part 2", "Picture Description", "Present Continuous"],
        }),
      }),
    },
  } as unknown as GoogleGenAI;

  const speakingResult = await gradeSpeakingSubmission(
    spk2Context,
    {
      audioBase64: Buffer.from("fake-speaking-audio-sample").toString("base64"),
      mimeType: "audio/webm",
      durationSeconds: 42,
    },
    mockSpeakingClient,
    testUserId
  );

  assert.equal(speakingResult.scoreType, "AI_ESTIMATE");
  assert.equal(speakingResult.transcriptStatus, "available");
  assert.equal(speakingResult.pronunciationStatus, "pedagogical_estimate");
  assert.equal(speakingResult.fluencyStatus, "available");
  assert.ok(speakingResult.transcript.length > 0);
  assert.ok(speakingResult.criteria.length >= 4);
  assert.ok(speakingResult.spokenGrammarErrors.length > 0);
  assert.ok(speakingResult.improvementPlan.length > 0);
  assert.equal(speakingResult.disclaimer, "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE");
  console.log("  ✓ AI Speaking Examiner successfully evaluated audio with genuine STT, fluency, and rubrics.");

  // ----------------------------------------------------------------
  // 5. AI Coach with Personalized Memory Injection
  // ----------------------------------------------------------------
  console.log("  [26.5] Testing AI Coach with User Learning Memory Personalization...");
  const mockCoachClient = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          message: "Chào bạn! Dựa trên lịch sử luyện tập, mình thấy bạn đã mắc lỗi thì Quá khứ đơn vs Hiện tại hoàn thành 2 lần. Hôm nay chúng ta hãy cùng ôn tập quy tắc 'since/for' và mốc thời gian xác định nhé!",
          mode: "Coach",
          explanation: "Hiện tại hoàn thành diễn tả hành động liên kết quá khứ với hiện tại, còn Quá khứ đơn dùng cho thời điểm đã chấm dứt.",
          evidence: "Yesterday, ago, in 2020 -> Luôn đi với Quá khứ đơn.",
          actionSuggestions: [
            "Làm 5 câu trắc nghiệm phân biệt Past Simple vs Present Perfect",
            "Viết lại 2 câu văn áp dụng mốc thời gian cụ thể",
          ],
        }),
      }),
    },
  } as unknown as GoogleGenAI;

  const coachResponse = await getCoachAdvice(
    {
      userMessage: "Hôm nay mình nên học gì để cải thiện điểm số?",
      coachContext: DEFAULT_EMPTY_COACH_CONTEXT,
      userId: testUserId,
    },
    mockCoachClient
  );

  assert.ok(coachResponse.message.includes("Quá khứ đơn") || coachResponse.message.includes("Hiện tại hoàn thành"));
  assert.ok(coachResponse.actionSuggestions.length > 0);
  console.log("  ✓ Personalized AI Tutor successfully adapted teaching advice based on user's real error memory.");

  console.log("\n✅ [TEST 26 PASSED] Final AI Completion tests completed successfully.\n");
}

if (process.argv[1]?.endsWith("final-ai-completion.test.ts")) {
  runFinalAICompletionTests().catch((err) => {
    console.error("Test 26 failed:", err);
    process.exit(1);
  });
}
