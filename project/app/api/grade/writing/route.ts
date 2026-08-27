import { NextRequest, NextResponse } from "next/server";
import { GradingError } from "@/lib/grading/errors";
import {
  gradeWritingSubmission,
  resolveWritingTaskContext,
} from "@/lib/grading/writing-ai";
import { WritingGradingInputSchema } from "@/lib/grading/writing-schema";
import { getAuthenticatedSession, unauthorizedResponse } from "@/lib/auth/api";

export async function POST(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    if (!session) return unauthorizedResponse();

    const body = await req.json();

    // 1. Validate request payload structure
    const parseResult = WritingGradingInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
          details: parseResult.error.issues,
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

    // 2. Resolve task context from public dataset
    const taskContext = resolveWritingTaskContext(testId, partNumber, taskId);

    // 3. Execute AI grading with Gemini 3.7 Flash
    const gradingResult = await gradeWritingSubmission(
      taskContext,
      finalSubmissionText,
      undefined,
      session.userId
    );

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
          error: error.message,
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
