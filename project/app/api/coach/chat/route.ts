import { NextRequest, NextResponse } from "next/server";
import { getCoachAdvice } from "@/lib/coach/advisor";
import { AICoachChatInputSchema } from "@/lib/coach/types";
import { GradingError } from "@/lib/grading/errors";
import { getAuthenticatedSessionAsync } from "@/lib/auth/api";
import { coachErrorStatus, coachPublicErrorCode, coachPublicErrorMessage } from "@/lib/coach/error-taxonomy";
import { getRequestId } from "@/lib/observability/request-id";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers.get("x-request-id"));
  const json = (body: Record<string, unknown>, status: number) =>
    NextResponse.json({ ...body, requestId }, { status, headers: { "x-request-id": requestId } });

  try {
    const session = await getAuthenticatedSessionAsync(req);
    if (!session) {
      return json({ success: false, code: "AUTHENTICATION_REQUIRED", error: "Authentication required" }, 401);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ success: false, code: "INVALID_REQUEST", error: "Invalid coach chat request payload" }, 400);
    }

    // 1. Validate request payload structure
    const parseResult = AICoachChatInputSchema.safeParse(body);
    if (!parseResult.success) {
      return json({ success: false, code: "INVALID_REQUEST", error: "Invalid coach chat request payload" }, 400);
    }

    // 2. Generate conversational advice using Gemini 3.7 Flash
    const advice = await getCoachAdvice(
      { ...parseResult.data, userId: session.userId },
      undefined,
      undefined,
      undefined,
      { requestId },
    );

    // 3. Return client-safe structured response
    return json({ success: true, data: advice }, 200);
  } catch (error) {
    if (error instanceof GradingError) {
      const status = coachErrorStatus(error.code);
      console.warn("[AI Coach API] request failed", { requestId, code: error.code, status });
      return json(
        {
          success: false,
          code: coachPublicErrorCode(error.code),
          error: coachPublicErrorMessage(error.code),
        },
        status,
      );
    }

    console.error("[AI Coach API] unexpected request failure", {
      requestId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return json(
      {
        success: false,
        error: "AI Coach is temporarily unavailable. Please try again later.",
      },
      500,
    );
  }
}
