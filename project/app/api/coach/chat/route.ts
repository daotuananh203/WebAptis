import { NextRequest, NextResponse } from "next/server";
import { getCoachAdvice } from "@/lib/coach/advisor";
import { AICoachChatInputSchema } from "@/lib/coach/types";
import { GradingError } from "@/lib/grading/errors";
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
        { success: false, error: "Invalid coach chat request payload" },
        { status: 400 },
      );
    }

    // 1. Validate request payload structure
    const parseResult = AICoachChatInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid coach chat request payload",
        },
        { status: 400 }
      );
    }

    // 2. Generate conversational advice using Gemini 3.7 Flash
    const advice = await getCoachAdvice({ ...parseResult.data, userId: session.userId });

    // 3. Return client-safe structured response
    return NextResponse.json(
      {
        success: true,
        data: advice,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof GradingError) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: "Unable to process this coach request",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "AI Coach is temporarily unavailable. Please try again later.",
      },
      { status: 500 }
    );
  }
}
