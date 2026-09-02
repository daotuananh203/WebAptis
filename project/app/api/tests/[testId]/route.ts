import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { AptisPublicTestDataset } from "@/lib/exam/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params;
    if (!/^[A-Za-z0-9_-]+$/.test(testId)) {
      return NextResponse.json(
        { success: false, error: "Invalid test identifier" },
        { status: 400 }
      );
    }
    const publicPath = path.join(process.cwd(), `data/tests/${testId}-public.json`);

    if (!fs.existsSync(publicPath)) {
      // Check if candidate topic exists in speaking-bank.json
      const speakingBankPath = path.join(process.cwd(), "data/prediction/speaking/speaking-bank.json");
      if (fs.existsSync(speakingBankPath)) {
        try {
          const bankRaw = fs.readFileSync(speakingBankPath, "utf-8");
          const bank = JSON.parse(bankRaw);
          const topic = bank.topics?.find((t: any) => t.candidateId === testId);
          if (topic) {
            const speakingDataset = {
              testId: topic.candidateId,
              testNumber: 1,
              speaking: {
                officialDurationMinutes: 12,
                parts: [
                  {
                    partNumber: topic.partNumber,
                    taskType:
                      topic.partNumber === 2
                        ? "describe-recount-opinion"
                        : topic.partNumber === 3
                        ? "compare-speculate-opinion"
                        : "abstract-topic-extended",
                    instructions:
                      topic.partNumber === 2
                        ? "Describe the photograph and answer the two follow-up questions. You have 45 seconds for each response."
                        : topic.partNumber === 3
                        ? "Compare the two photographs and answer the two follow-up questions. You have 45 seconds for each response."
                        : "In this part, you will speak for two minutes on a topic. You will have one minute to prepare your response.",
                    topic: topic.topic,
                    imageUrl: topic.images?.[0] || undefined,
                    images: topic.images || undefined,
                    questions: topic.questions?.map((q: any, idx: number) => ({
                      id: `${topic.candidateId}_q${idx + 1}`,
                      prompt: typeof q === "string" ? q : q.questionText || q.prompt,
                      preparationTimeSeconds: topic.partNumber === 4 ? 60 : 0,
                      responseTimeSeconds: topic.partNumber === 4 ? 120 : 45,
                    })),
                  },
                ],
              },
            };
            return NextResponse.json({ success: true, data: speakingDataset }, { status: 200 });
          }
        } catch {
          // Fall through to 404
        }
      }

      return NextResponse.json(
        { success: false, error: "Test dataset not found" },
        { status: 404 }
      );
    }

    const raw = fs.readFileSync(publicPath, "utf-8");
    const data: AptisPublicTestDataset = JSON.parse(raw);

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("[Tests API] dataset load failed", {
      errorType: error instanceof Error ? error.name : typeof error,
    });
    return NextResponse.json(
      { success: false, error: "Failed to load test" },
      { status: 500 }
    );
  }
}
