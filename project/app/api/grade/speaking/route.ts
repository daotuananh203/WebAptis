import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { GradingError } from "@/lib/grading/errors";
import {
  gradeSpeakingSubmission,
  resolveSpeakingTaskContext,
} from "@/lib/grading/speaking-ai";
import { SpeakingGradingInputSchema } from "@/lib/grading/speaking-schema";
import { getAuthenticatedSessionAsync, unauthorizedResponse } from "@/lib/auth/api";

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

function publicMessageForGradingCode(code: GradingError["code"]): string {
  switch (code) {
    case "NO_SPEECH":
      return "Không phát hiện giọng nói đủ rõ trong bản ghi.";
    case "INVALID_AUDIO":
      return "Tệp âm thanh không hợp lệ.";
    case "GRADING_TIMEOUT":
      return "Chấm Speaking đang mất nhiều thời gian hơn dự kiến. Vui lòng thử lại.";
    case "AI_PROVIDER_ERROR":
    case "INVALID_AI_RESPONSE":
      return "Dịch vụ chấm Speaking tạm thời không khả dụng. Vui lòng thử lại.";
    default:
      return "Không thể chấm bài Speaking với dữ liệu hiện tại.";
  }
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || randomUUID();
  const responseOptions = (status: number) => ({
    status,
    headers: { "x-request-id": requestId },
  });
  try {
    const session = await getAuthenticatedSessionAsync(req);
    if (!session) {
      const response = unauthorizedResponse();
      response.headers.set("x-request-id", requestId);
      return response;
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, code: "INVALID_ANSWER_FORMAT", error: "Invalid JSON request body", requestId },
        responseOptions(400),
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
          requestId,
        },
        responseOptions(400)
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
    }, undefined, session.userId, { requestId });

    // 4. Return client-safe structured result
    return NextResponse.json(
      {
        success: true,
        data: gradingResult,
        requestId,
      },
      responseOptions(200)
    );
  } catch (error) {
    if (error instanceof GradingError) {
      console.warn("[Speaking API] grading error", { requestId, code: error.code });
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: publicMessageForGradingCode(error.code),
          requestId,
        },
        responseOptions(statusForGradingCode(error.code))
      );
    }

    console.error("[Speaking API] unexpected grading failure", {
      requestId,
      errorType: error instanceof Error ? error.name : typeof error,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Speaking grading is temporarily unavailable. Please try again later.",
        requestId,
      },
      responseOptions(500)
    );
  }
}
