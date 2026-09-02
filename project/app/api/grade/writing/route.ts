import { NextRequest, NextResponse } from "next/server";
import { GradingError } from "@/lib/grading/errors";
import {
  gradeWritingSubmission,
  resolveWritingTaskContext,
} from "@/lib/grading/writing-ai";
import { WritingGradingInputSchema } from "@/lib/grading/writing-schema";
import { getAuthenticatedSessionAsync, unauthorizedResponse } from "@/lib/auth/api";
import { WritingGradingResult } from "@/lib/grading/writing-schema";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSessionAsync(req);
    if (!session) return unauthorizedResponse();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request payload" },
        { status: 400 },
      );
    }

    // 1. Validate request payload structure
    const parseResult = WritingGradingInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
        },
        { status: 400 }
      );
    }

    const { testId, partNumber, taskId, submissionText, userResponses } =
      parseResult.data;

    const finalSubmissionText =
      submissionText ||
      Object.entries(userResponses || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n\n");

    // Bind every provided response to its own canonical task context. This
    // prevents Part 3/4 submissions from inheriting the first task's prompt.
    const taskEntries = userResponses && Object.keys(userResponses).length > 0
      ? Object.entries(userResponses)
      : [[taskId ?? "", finalSubmissionText] as [string, string]];
    const taskResults: WritingGradingResult[] = [];
    for (const [entryTaskId, entryText] of taskEntries) {
      const taskContext = resolveWritingTaskContext(testId, partNumber, entryTaskId || taskId);
      taskResults.push(await gradeWritingSubmission(taskContext, entryText, undefined, session.userId));
    }

    const gradingResult = taskResults.length === 1
      ? taskResults[0]
      : aggregateWritingResults(taskResults);

    // 4. Return client-safe structured result
    return NextResponse.json(
      {
        success: true,
        data: gradingResult,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof GradingError) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: "Unable to grade this writing submission",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Writing grading is temporarily unavailable. Please try again later.",
      },
      { status: 500 }
    );
  }
}

function aggregateWritingResults(results: WritingGradingResult[]): WritingGradingResult & { taskResults: WritingGradingResult[] } {
  const maxOverallScore = results.reduce((sum, result) => sum + result.maxOverallScore, 0);
  const overallScore = results.reduce((sum, result) => sum + result.overallScore, 0);
  const percentage = maxOverallScore > 0 ? (overallScore / maxOverallScore) * 100 : 0;
  const estimatedBand = percentage >= 85 ? "C" : percentage >= 70 ? "B2" : percentage >= 50 ? "B1" : percentage >= 30 ? "A2" : percentage >= 15 ? "A1" : "A0";
  return {
    ...results[0],
    taskType: "multi-task",
    wordCount: results.reduce((sum, result) => sum + result.wordCount, 0),
    overallScore,
    maxOverallScore,
    percentage,
    estimatedBand,
    criteria: results.flatMap((result, index) => result.criteria.map((criterion) => ({ ...criterion, name: `Task ${index + 1} — ${criterion.name}` }))),
    grammarErrors: results.flatMap((result) => result.grammarErrors),
    vocabularyUpgrades: results.flatMap((result) => result.vocabularyUpgrades),
    strengths: results.flatMap((result) => result.strengths),
    areasForImprovement: results.flatMap((result) => result.areasForImprovement),
    improvementPlan: results.flatMap((result) => result.improvementPlan),
    modelAnswer: results.map((result, index) => `Task ${index + 1}:\n${result.modelAnswer}`).join("\n\n"),
    taskResults: results,
  };
}
