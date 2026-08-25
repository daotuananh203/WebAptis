import { NextRequest, NextResponse } from "next/server";
import { getCoachAdvice } from "@/lib/coach/advisor";
import { AICoachChatInputSchema } from "@/lib/coach/types";
import { GradingError } from "@/lib/grading/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate request payload structure
    const parseResult = AICoachChatInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid coach chat request payload",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    // 2. Generate conversational advice using Gemini 3.7 Flash
    const advice = await getCoachAdvice(parseResult.data);

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
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Internal AI Coach error",
      },
      { status: 500 }
    );
  }
}
