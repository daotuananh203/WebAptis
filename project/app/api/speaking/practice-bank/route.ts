import { NextRequest, NextResponse } from "next/server";
import { getSpeakingPracticePart, getSpeakingPracticeItem } from "@/lib/speaking/practice-bank";

// Query parameters select the part/item, so this endpoint must not be cached
// as one static response for the first requested part.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const rawPart = request.nextUrl.searchParams.get("part") || "1";
    const part = Number(rawPart);
    if (![1, 2, 3, 4].includes(part)) {
      return NextResponse.json({ success: false, error: "Invalid Speaking Practice part" }, { status: 400 });
    }
    const itemId = request.nextUrl.searchParams.get("itemId") || undefined;
    const partData = getSpeakingPracticePart(part);
    const item = getSpeakingPracticeItem(part, itemId);
    if (itemId && !item) {
      return NextResponse.json({ success: false, error: "Speaking Practice item not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: {
        bankId: "aptis-speaking-practice-bank-v1",
        partNumber: part,
        itemCount: partData.itemCount,
        items: "questions" in partData
          ? partData.questions.map((question) => ({ questionId: question.questionId, question: question.question, source: question.source }))
          : partData.topics.map((topic) => ({ topicId: topic.topicId, title: topic.title, availability: topic.availability, source: topic.source })),
        item,
      },
    });
  } catch (error) {
    console.error("[Speaking practice bank API] load failed", {
      errorType: error instanceof Error ? error.name : typeof error,
    });
    return NextResponse.json({ success: false, error: "Unable to load Speaking Practice bank" }, { status: 500 });
  }
}
