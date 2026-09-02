import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import {
  gradeGrammarPart,
  gradeVocabularyPart,
  gradeReadingPart1,
  gradeReadingPart2,
  gradeReadingPart3,
  gradeReadingPart4,
  gradeListeningPart1,
  gradeListeningPart2,
  gradeListeningPart3,
  gradeListeningPart4,
} from "@/lib/grading/deterministic";
import { createGradingError, GradingError } from "@/lib/grading/errors";
import { ServerAnswerKey } from "@/lib/exam/types";
import { getAuthenticatedSessionAsync, unauthorizedResponse } from "@/lib/auth/api";
import { ALL_EXAM_TEST_CATALOG } from "@/lib/exam/test-catalog";

const ALLOWED_PARTS: Record<string, string[]> = {
  grammarVocabulary: ["grammar", "vocabulary"],
  reading: ["part1", "part2", "part3", "part4"],
  listening: ["part1", "part2", "part3", "part4"],
};

function isSafeAnswerValue(value: unknown): boolean {
  return typeof value === "string" ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"));
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSessionAsync(req);
    if (!session) return unauthorizedResponse();
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid grading request payload" },
        { status: 400 },
      );
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Invalid grading request payload" },
        { status: 400 },
      );
    }
    const {
      testId,
      skill,
      partIdentifier,
      answers: rawAnswers,
    } = body as Record<string, unknown>;
    const answers = rawAnswers as Record<string, any>;

    if (
      typeof testId !== "string" ||
      !/^[A-Za-z0-9_-]+$/.test(testId) ||
      !ALL_EXAM_TEST_CATALOG.some((entry) => entry.testId === testId) ||
      typeof skill !== "string" ||
      !Object.prototype.hasOwnProperty.call(ALLOWED_PARTS, skill) ||
      (partIdentifier !== undefined &&
        (typeof partIdentifier !== "string" || !ALLOWED_PARTS[skill].includes(partIdentifier))) ||
      !answers ||
      typeof answers !== "object" ||
      Array.isArray(answers) ||
      Object.keys(answers).length > 1000 ||
      Object.values(answers).some((value) => !isSafeAnswerValue(value))
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid grading request payload" },
        { status: 400 }
      );
    }

    const answersPath = path.join(process.cwd(), `data/tests/${testId}-answers.json`);

    if (!fs.existsSync(answersPath)) {
      throw createGradingError(
        "UNKNOWN_QUESTION",
        `Server answer key not found for testId: ${testId}`
      );
    }

    const serverAnswers: ServerAnswerKey = JSON.parse(
      fs.readFileSync(answersPath, "utf-8")
    );

    let result;

    if (skill === "grammarVocabulary") {
      if (partIdentifier === "grammar") {
        result = gradeGrammarPart(answers, serverAnswers.grammarVocabulary.grammarAnswers);
      } else if (partIdentifier === "vocabulary") {
        result = gradeVocabularyPart(answers, serverAnswers.grammarVocabulary.vocabularyAnswers);
      } else {
        const gRes = gradeGrammarPart(answers, serverAnswers.grammarVocabulary.grammarAnswers);
        const vRes = gradeVocabularyPart(answers, serverAnswers.grammarVocabulary.vocabularyAnswers);
        result = {
          sectionName: "grammarVocabulary",
          rawScore: gRes.rawScore + vRes.rawScore,
          maxRawScore: gRes.maxRawScore + vRes.maxRawScore,
          percentage:
            Math.round(
              ((gRes.rawScore + vRes.rawScore) /
                (gRes.maxRawScore + vRes.maxRawScore)) *
                1000
            ) / 10,
          parts: {
            grammar: gRes,
            vocabulary: vRes,
          },
        };
      }
    } else if (skill === "reading") {
      if (partIdentifier === "part1") {
        result = gradeReadingPart1(answers, serverAnswers.reading.part1);
      } else if (partIdentifier === "part2") {
        result = gradeReadingPart2(answers, serverAnswers.reading.part2);
      } else if (partIdentifier === "part3") {
        result = gradeReadingPart3(answers, serverAnswers.reading.part3);
      } else if (partIdentifier === "part4") {
        result = gradeReadingPart4(answers, serverAnswers.reading.part4);
      } else {
        const p1 = gradeReadingPart1(answers, serverAnswers.reading.part1);
        const p2 = gradeReadingPart2(answers, serverAnswers.reading.part2);
        const p3 = gradeReadingPart3(answers, serverAnswers.reading.part3);
        const p4 = gradeReadingPart4(answers, serverAnswers.reading.part4);
        const totalRaw = p1.rawScore + p2.rawScore + p3.rawScore + p4.rawScore;
        const totalMax = p1.maxRawScore + p2.maxRawScore + p3.maxRawScore + p4.maxRawScore;
        result = {
          sectionName: "reading",
          rawScore: totalRaw,
          maxRawScore: totalMax,
          percentage: totalMax > 0 ? Math.round((totalRaw / totalMax) * 1000) / 10 : 0,
          parts: {
            part1: p1,
            part2: p2,
            part3: p3,
            part4: p4,
          },
        };
      }
    } else if (skill === "listening") {
      if (partIdentifier === "part1") {
        result = gradeListeningPart1(answers, serverAnswers.listening.part1);
      } else if (partIdentifier === "part2") {
        result = gradeListeningPart2(answers, serverAnswers.listening.part2);
      } else if (partIdentifier === "part3") {
        result = gradeListeningPart3(answers, serverAnswers.listening.part3);
      } else if (partIdentifier === "part4") {
        result = gradeListeningPart4(answers, serverAnswers.listening.part4);
      } else {
        const p1 = gradeListeningPart1(answers, serverAnswers.listening.part1);
        const p2 = gradeListeningPart2(answers, serverAnswers.listening.part2);
        const p3 = gradeListeningPart3(answers, serverAnswers.listening.part3);
        const p4 = gradeListeningPart4(answers, serverAnswers.listening.part4);
        const totalRaw = p1.rawScore + p2.rawScore + p3.rawScore + p4.rawScore;
        const totalMax = p1.maxRawScore + p2.maxRawScore + p3.maxRawScore + p4.maxRawScore;
        result = {
          sectionName: "listening",
          rawScore: totalRaw,
          maxRawScore: totalMax,
          percentage: totalMax > 0 ? Math.round((totalRaw / totalMax) * 1000) / 10 : 0,
          parts: {
            part1: p1,
            part2: p2,
            part3: p3,
            part4: p4,
          },
        };
      }
    } else {
      throw createGradingError("UNKNOWN_QUESTION", `Unsupported deterministic skill: ${skill}`);
    }

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    if (error instanceof GradingError) {
      return NextResponse.json(
        { success: false, code: error.code, error: "Unable to grade this submission" },
        { status: 400 }
      );
    }
    console.error("[Deterministic Grading Error]", error);
    return NextResponse.json({ success: false, error: "Internal grading error" }, { status: 500 });
  }
}
