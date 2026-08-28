/**
 * Client-safe aggregation for the free-response sections of a full mock.
 *
 * The API still resolves every task context on the server. This module only
 * enumerates the answers that the learner actually supplied, invokes the
 * existing authenticated examiner endpoints, and makes an aggregate result
 * explicit about missing or failed evaluations. It never manufactures a zero
 * score for a submission that was not evaluated.
 */

type SubjectiveSkill = "writing" | "speaking";

interface WritingSubmission {
  partNumber: number;
  taskId?: string;
  submissionText: string;
}

interface SpeakingSubmission {
  partNumber: number;
  taskId?: string;
  audioData: string;
}

export interface MockSubjectiveScore {
  status: "AI_ESTIMATE" | "AI_PARTIAL" | "NOT_SUBMITTED";
  rawScore?: number;
  maxRawScore?: number;
  percentage?: number;
  estimatedBand?: string;
  evaluatedResponses: number;
  expectedResponses: number;
  unevaluatedResponses: number;
  evaluationErrors: string[];
}

function textAnswer(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function collectMockWritingSubmissions(
  writing: any,
  answers: Record<string, unknown>
): WritingSubmission[] {
  const parts = writing?.parts || [];
  const submissions: WritingSubmission[] = [];

  for (const prompt of parts[0]?.prompts || []) {
    const text = textAnswer(answers[prompt.id]);
    if (text) submissions.push({ partNumber: 1, taskId: prompt.id, submissionText: text });
  }

  const part2 = parts[1];
  const part2Text = textAnswer(answers[part2?.id || "writing_part2"]);
  if (part2Text) submissions.push({ partNumber: 2, taskId: part2?.id, submissionText: part2Text });

  for (const message of parts[2]?.chatMessages || []) {
    const text = textAnswer(answers[message.id]);
    if (text) submissions.push({ partNumber: 3, taskId: message.id, submissionText: text });
  }

  for (const task of parts[3]?.tasks || []) {
    const text = textAnswer(answers[task.id]);
    if (text) submissions.push({ partNumber: 4, taskId: task.id, submissionText: text });
  }

  return submissions;
}

export function expectedMockWritingResponses(writing: any): number {
  const parts = writing?.parts || [];
  return (parts[0]?.prompts?.length || 0) + (parts[1] ? 1 : 0) + (parts[2]?.chatMessages?.length || 0) + (parts[3]?.tasks?.length || 0);
}

export function collectMockSpeakingSubmissions(
  speaking: any,
  answers: Record<string, unknown>
): SpeakingSubmission[] {
  const parts = speaking?.parts || [];
  const submissions: SpeakingSubmission[] = [];

  for (let index = 0; index < 3; index += 1) {
    const part = parts[index];
    for (const question of part?.questions || []) {
      if (!question || typeof question !== "object" || !question.id) continue;
      const audioData = textAnswer(answers[`${question.id}__speaking_audio`]);
      if (audioData?.startsWith("data:audio/")) {
        submissions.push({ partNumber: index + 1, taskId: question.id, audioData });
      }
    }
  }

  const part4Audio = textAnswer(answers.speaking_audio);
  if (part4Audio?.startsWith("data:audio/")) {
    submissions.push({ partNumber: 4, audioData: part4Audio });
  }

  return submissions;
}

export function expectedMockSpeakingResponses(speaking: any): number {
  const parts = speaking?.parts || [];
  return (parts[0]?.questions?.length || 0) + (parts[1]?.questions?.length || 0) + (parts[2]?.questions?.length || 0) + (parts[3] ? 1 : 0);
}

function decodeAudioDataUri(audioData: string): { audioBase64: string; mimeType: string } | null {
  const match = audioData.match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  return { mimeType: match[1], audioBase64: match[2] };
}

async function runWithConcurrency<T, R>(
  input: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(input.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, input.length) }, async () => {
    while (cursor < input.length) {
      const current = cursor++;
      try {
        results[current] = { status: "fulfilled", value: await worker(input[current]) };
      } catch (reason) {
        results[current] = { status: "rejected", reason };
      }
    }
  });
  await Promise.all(runners);
  return results;
}

function scoreFromSettled(
  settled: PromiseSettledResult<any>[],
  expectedResponses: number
): MockSubjectiveScore {
  const successful = settled
    .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((result) => Number.isFinite(result?.overallScore) && Number.isFinite(result?.maxOverallScore));
  const errors = settled
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => result.reason instanceof Error ? result.reason.message : "AI evaluation was unavailable");

  if (successful.length === 0) {
    return {
      status: "NOT_SUBMITTED",
      evaluatedResponses: 0,
      expectedResponses,
      unevaluatedResponses: expectedResponses,
      evaluationErrors: errors,
    };
  }

  const rawScore = successful.reduce((sum, result) => sum + result.overallScore, 0);
  const maxRawScore = successful.reduce((sum, result) => sum + result.maxOverallScore, 0);
  const isComplete = successful.length === expectedResponses && errors.length === 0;
  return {
    status: isComplete ? "AI_ESTIMATE" : "AI_PARTIAL",
    rawScore,
    maxRawScore,
    percentage: Math.round((rawScore / maxRawScore) * 100),
    estimatedBand: successful[successful.length - 1]?.estimatedBand,
    evaluatedResponses: successful.length,
    expectedResponses,
    unevaluatedResponses: Math.max(0, expectedResponses - successful.length),
    evaluationErrors: errors,
  };
}

async function postGrade(endpoint: string, body: Record<string, unknown>): Promise<any> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error(payload?.error || `AI evaluation request failed (${response.status})`);
  }
  return payload.data;
}

export async function gradeMockSubjectiveSection(params: {
  testId: string;
  skill: SubjectiveSkill;
  sectionData: any;
  answers: Record<string, unknown>;
}): Promise<MockSubjectiveScore> {
  if (params.skill === "writing") {
    const submissions = collectMockWritingSubmissions(params.sectionData, params.answers);
    const expectedResponses = expectedMockWritingResponses(params.sectionData);
    if (submissions.length === 0) {
      return { status: "NOT_SUBMITTED", evaluatedResponses: 0, expectedResponses, unevaluatedResponses: expectedResponses, evaluationErrors: [] };
    }
    const settled = await runWithConcurrency(submissions, 2, (submission) =>
      postGrade("/api/grade/writing", {
        testId: params.testId,
        partNumber: submission.partNumber,
        taskId: submission.taskId,
        submissionText: submission.submissionText,
      })
    );
    return scoreFromSettled(settled, expectedResponses);
  }

  const submissions = collectMockSpeakingSubmissions(params.sectionData, params.answers);
  const expectedResponses = expectedMockSpeakingResponses(params.sectionData);
  if (submissions.length === 0) {
    return { status: "NOT_SUBMITTED", evaluatedResponses: 0, expectedResponses, unevaluatedResponses: expectedResponses, evaluationErrors: [] };
  }
  const settled = await runWithConcurrency(submissions, 2, (submission) => {
    const decoded = decodeAudioDataUri(submission.audioData);
    if (!decoded) throw new Error("Recorded audio is not a valid base64 audio data URI");
    return postGrade("/api/grade/speaking", {
      testId: params.testId,
      partNumber: submission.partNumber,
      taskId: submission.taskId,
      audioBase64: decoded.audioBase64,
      mimeType: decoded.mimeType,
    });
  });
  return scoreFromSettled(settled, expectedResponses);
}
