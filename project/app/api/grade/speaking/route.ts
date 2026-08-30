import { NextRequest, NextResponse } from "next/server";
import { GradingError } from "@/lib/grading/errors";
import {
  gradeSpeakingSubmission,
  resolveSpeakingTaskContext,
} from "@/lib/grading/speaking-ai";
import { SpeakingGradingInputSchema } from "@/lib/grading/speaking-schema";
import { getAuthenticatedSession, unauthorizedResponse } from "@/lib/auth/api";

// Vercel must leave enough headroom for one bounded Gemini multimodal call.
// The application timeout is still enforced by withAiGradingTimeout; this
// declaration prevents the platform default from killing the request first.
export const maxDuration = 60;

function statusForGradingCode(code: GradingError["code"]): number {
  switch (code) {
    case "GRADING_TIMEOUT":
      return 504;
    case "AI_PROVIDER_ERROR":
    case "INVALID_AI_RESPONSE":
      return 502;
    case "NO_SPEECH":
      return 422;
    case "UNKNOWN_QUESTION":
    case "INVALID_TASK_CONTEXT":
    case "INVALID_AUDIO":
    case "INVALID_SUBMISSION":
    case "INVALID_ANSWER_FORMAT":
    default:
      return 400;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getAuthenticatedSession(req);
    if (!session) return unauthorizedResponse();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, code: "INVALID_ANSWER_FORMAT", error: "Invalid JSON request body" },
        { status: 400 },
      );
    }

    // 1. Validate request payload structure
    const parseResult = SpeakingGradingInputSchema.safeParse(body);
    if (!parseResult.success) {
      const audioIssue = parseResult.error.issues.some((issue) =>
        issue.path.includes("audioBase64") || issue.path.includes("mimeType") || issue.path.includes("durationSeconds"),
      );
      return NextResponse.json(
        {
          success: false,
          code: audioIssue ? "INVALID_AUDIO" : "INVALID_ANSWER_FORMAT",
          error: "Invalid speaking request payload",
        },
        { status: 400 }
      );
    }

    const {
      testId,
      practiceItemId,
      partNumber,
      taskId,
      audioBase64,
      mimeType,
      durationSeconds,
      clientTranscript,
    } = parseResult.data;

    // 2. Resolve task context from public dataset
    const taskContext = resolveSpeakingTaskContext(testId, partNumber, taskId, practiceItemId);

    // 3. Execute AI grading with Gemini 3.7 Flash multimodal audio
    const gradingResult = await gradeSpeakingSubmission(taskContext, {
      audioBase64,
      mimeType,
      durationSeconds,
      clientTranscript,
    }, undefined, session.userId);

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
        { status: statusForGradingCode(error.code) }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Speaking grading is temporarily unavailable. Please try again later.",
      },
      { status: 500 }
    );
  }
}
