import { NextRequest, NextResponse } from "next/server";
import { GradingError } from "@/lib/grading/errors";
import {
  aggregateWritingResults,
  gradeWritingSubmissions,
  resolveWritingTaskSubmissions,
} from "@/lib/grading/writing-ai";
import { WritingGradingInputSchema } from "@/lib/grading/writing-schema";
import { getAuthenticatedSessionAsync, unauthorizedResponse } from "@/lib/auth/api";

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

    const submissions = resolveWritingTaskSubmissions(parseResult.data);
    const taskResults = await gradeWritingSubmissions(submissions, undefined, session.userId);

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
        {
          status: ["AI_PROVIDER_ERROR", "INVALID_AI_RESPONSE", "GRADING_TIMEOUT"].includes(error.code)
            ? 502
            : 400,
        }
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
