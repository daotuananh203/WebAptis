import { NextRequest, NextResponse } from "next/server";
import { GradingError } from "@/lib/grading/errors";
import {
  gradeSpeakingSubmission,
  resolveSpeakingTaskContext,
} from "@/lib/grading/speaking-ai";
import { SpeakingGradingInputSchema } from "@/lib/grading/speaking-schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate request payload structure
    const parseResult = SpeakingGradingInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid speaking request payload",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      testId,
      partNumber,
      taskId,
      audioBase64,
      mimeType,
      durationSeconds,
      clientTranscript,
    } = parseResult.data;

    // 2. Resolve task context from public dataset
    const taskContext = resolveSpeakingTaskContext(testId, partNumber, taskId);

    // 3. Execute AI grading with Gemini 3.7 Flash multimodal audio
    const gradingResult = await gradeSpeakingSubmission(taskContext, {
      audioBase64,
      mimeType,
      durationSeconds,
      clientTranscript,
    }, undefined, parseResult.data.userId);

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
        error:
          error instanceof Error ? error.message : "Internal speaking grading error",
      },
      { status: 500 }
    );
  }
}
