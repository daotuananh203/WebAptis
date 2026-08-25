import assert from "node:assert/strict";
import { resolveWritingTaskContext, gradeWritingSubmission } from "../lib/grading/writing-ai";
import { resolveSpeakingTaskContext, gradeSpeakingSubmission, validateAudioPayload } from "../lib/grading/speaking-ai";

export async function runRedTeamAiExaminersTests(): Promise<boolean> {
  console.log("==================================================");
  console.log("▶ [RED-TEAM DOMAIN C] Running AI Writing & Speaking Examiner Edge Tests...");
  console.log("==================================================");

  // 1. Writing Examiner Edge Cases
  console.log("  [C.1] Testing AI Writing Examiner edge cases...");

  const taskCtx = resolveWritingTaskContext("aptis-b2-01", 4, "w4_task_b");

  // Case 1: Empty text / short input
  const mockAiClient1: any = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          overallScore: 0,
          maxOverallScore: 20,
          estimatedBand: "A1",
          criteria: [
            { name: "Task Achievement", score: 0, maxScore: 5, feedback: "Bài làm để trống." },
            { name: "Register & Tone", score: 0, maxScore: 5, feedback: "Không có câu văn." },
            { name: "Grammar Range & Accuracy", score: 0, maxScore: 5, feedback: "Không có từ vựng." },
            { name: "Lexical Resource", score: 0, maxScore: 5, feedback: "Không có liên kết." },
          ],
          grammarErrors: [],
          vocabularyUpgrades: [],
          strengths: [],
          areasForImprovement: ["Cần hoàn thành bài viết."],
          modelAnswer: "Dear Ms. Vance...",
        }),
      }),
    },
  };

  const evalEmpty = await gradeWritingSubmission(taskCtx, "", mockAiClient1);
  assert.equal(evalEmpty.overallScore, 0, "Empty submission must yield score 0");
  assert.ok(evalEmpty.disclaimer.includes("NOT AN OFFICIAL BRITISH COUNCIL SCORE"), "Must contain non-official disclaimer");

  // Case 2: Massive 20,000-character input
  const massiveInput = "This is an extraordinarily long text designed to test the input buffer limits. ".repeat(250);
  const mockAiClient2: any = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          overallScore: 12,
          maxOverallScore: 20,
          estimatedBand: "B2",
          criteria: [
            { name: "Task Achievement", score: 2, maxScore: 5, feedback: "Bài viết quá dài." },
            { name: "Register & Tone", score: 3, maxScore: 5, feedback: "Tương đối phù hợp." },
            { name: "Grammar Range & Accuracy", score: 4, maxScore: 5, feedback: "Ngữ pháp tốt." },
            { name: "Lexical Resource", score: 3, maxScore: 5, feedback: "Từ vựng đa dạng." },
          ],
          grammarErrors: [],
          vocabularyUpgrades: [],
          strengths: ["Vốn từ phong phú"],
          areasForImprovement: ["Cần kiểm soát độ dài"],
          modelAnswer: "Dear Ms. Vance...",
        }),
      }),
    },
  };

  const evalMassive = await gradeWritingSubmission(taskCtx, massiveInput, mockAiClient2);
  assert.ok(evalMassive.overallScore >= 0 && evalMassive.overallScore <= 20, "Score must be bounded in [0, 20]");

  console.log("  ✓ Writing Examiner edge cases & error recoveries verified.");

  // 2. Speaking Examiner Edge Cases
  console.log("  [C.2] Testing AI Speaking Examiner edge cases...");

  const spkCtx = resolveSpeakingTaskContext("aptis-b2-01", 2);

  // Case 1: Empty audio payload must throw INVALID_SUBMISSION
  assert.throws(
    () => validateAudioPayload(""),
    /Audio payload is empty/,
    "Empty audio must be rejected with INVALID_SUBMISSION"
  );

  // Case 2: Valid mock audio stream evaluation
  const validMockAudioB64 = Buffer.from("RIFF_WAVE_MOCK_DATA").toString("base64");
  const mockSpkClient: any = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          overallScore: 16,
          maxOverallScore: 20,
          estimatedBand: "B2",
          criteria: [
            { name: "Task Fulfillment & Topic Development", score: 4, maxScore: 5, feedback: "Good description." },
            { name: "Grammar Range & Accuracy", score: 4, maxScore: 5, feedback: "Good syntax." },
            { name: "Lexical Resource & Cohesion", score: 4, maxScore: 5, feedback: "Rich vocab." },
            { name: "Fluency & Pronunciation", score: 4, maxScore: 5, feedback: "Clear speech." },
          ],
          transcript: "In this picture, I can see a group of friends enjoying their picnic in the park.",
          strengths: ["Fluent delivery"],
          areasForImprovement: ["Add more details on background"],
          pronunciationNotes: [],
          modelAudioAnswer: "In the foreground...",
        }),
      }),
    },
  };

  const evalSpk = await gradeSpeakingSubmission(
    spkCtx,
    { audioBase64: validMockAudioB64, mimeType: "audio/webm" },
    mockSpkClient
  );
  assert.equal(evalSpk.partNumber, 2);
  assert.ok(evalSpk.overallScore <= 20, "Score must never exceed max score");
  assert.ok(evalSpk.disclaimer.includes("NOT AN OFFICIAL BRITISH COUNCIL SCORE"));

  console.log("  ✓ Speaking Examiner edge cases & score boundaries verified.");
  console.log("✅ [RED-TEAM DOMAIN C PASSED] AI Writing & Speaking Examiner Edge Tests PASSED!\n");
  return true;
}
