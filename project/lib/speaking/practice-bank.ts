import fs from "node:fs";
import path from "node:path";
import rawBank from "@/data/speaking/canonical-speaking-practice-bank.json";
import { resolveSpeakingImageUrl } from "@/lib/speaking/image-availability";

export type SpeakingPracticePart = 1 | 2 | 3 | 4;

export interface SpeakingPracticeQuestion {
  questionId: string;
  question: string;
  normalizedQuestion: string;
  source: string;
  sourceEvidence: Record<string, unknown>;
}

export interface SpeakingPracticeTopic {
  topicId: string;
  partNumber: SpeakingPracticePart;
  title: string;
  prompts: string[];
  normalizedPrompts: string[];
  image?: string | null;
  imageSha256?: string | null;
  imageA?: string | null;
  imageB?: string | null;
  imageASha256?: string | null;
  imageBSha256?: string | null;
  source: string;
  sourceOrder: number | null;
  sourceEvidence: Record<string, unknown>;
  sourceVariants?: Array<Record<string, unknown>>;
  availability: "available" | "source-limited";
  selectionPolicy: string;
}

export interface SpeakingPracticeBank {
  bankId: string;
  bankVersion: string;
  sourceStatus: string;
  historicalMapping: string;
  architecture: string;
  sourceOfTruth: string[];
  parts: {
    part1: { partNumber: 1; itemCount: number; questions: SpeakingPracticeQuestion[]; sourceExtensions: Array<Record<string, unknown>>; assignmentPolicy: Record<string, unknown> };
    part2: { partNumber: 2; itemCount: number; sourceRecordCount: number; topics: SpeakingPracticeTopic[] };
    part3: { partNumber: 3; itemCount: number; sourceRecordCount: number; topics: SpeakingPracticeTopic[]; imagePolicy: string };
    part4: { partNumber: 4; itemCount: number; sourceRecordCount: number; topics: SpeakingPracticeTopic[] };
  };
  newTestReuse: { part2: Record<string, string>; part3: Record<string, string> };
  generatedAt: string;
}

let validated: SpeakingPracticeBank | null = null;

function asPart(value: number): SpeakingPracticePart {
  if (value === 1 || value === 2 || value === 3 || value === 4) return value;
  throw new Error(`Invalid Speaking Practice part: ${value}`);
}

function validateAsset(url: string | null | undefined, required: boolean): void {
  if (!url) {
    if (required) throw new Error("Speaking Practice source image is missing");
    return;
  }
  const resolved = resolveSpeakingImageUrl(url);
  if (!resolved) throw new Error(`Speaking Practice image is not an allowed source asset: ${url}`);
  const absolute = path.resolve(process.cwd(), "public", resolved.slice(1));
  const publicRoot = path.resolve(process.cwd(), "public");
  const relative = path.relative(publicRoot, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative) || !fs.existsSync(absolute)) {
    throw new Error(`Speaking Practice image asset is unavailable: ${url}`);
  }
  const stat = fs.statSync(absolute);
  if (!stat.isFile() || stat.size <= 0) throw new Error(`Speaking Practice image asset is empty: ${url}`);
}

function validateBank(value: SpeakingPracticeBank): SpeakingPracticeBank {
  const questions = value.parts.part1.questions;
  if (questions.length !== 31) throw new Error(`Speaking Practice Part 1 must expose 31 source questions; found ${questions.length}`);
  const questionIds = new Set<string>();
  const normalizedQuestions = new Set<string>();
  for (const question of questions) {
    if (!question.questionId || !question.question || !question.source || !question.sourceEvidence) throw new Error("Speaking Practice Part 1 provenance is incomplete");
    if (questionIds.has(question.questionId)) throw new Error(`Duplicate Speaking Practice question ID: ${question.questionId}`);
    if (normalizedQuestions.has(question.normalizedQuestion)) throw new Error(`Duplicate canonical Part 1 question: ${question.normalizedQuestion}`);
    questionIds.add(question.questionId);
    normalizedQuestions.add(question.normalizedQuestion);
  }
  for (const part of [2, 3, 4] as const) {
    const partData = value.parts[`part${part}`];
    if (partData.topics.length < (part === 2 ? 30 : part === 3 ? 32 : 1)) throw new Error(`Speaking Practice Part ${part} has too few source topics`);
    const ids = new Set<string>();
    for (const topic of partData.topics) {
      if (ids.has(topic.topicId)) throw new Error(`Duplicate Speaking Practice topic ID: ${topic.topicId}`);
      if (!topic.title || !topic.source || !topic.sourceEvidence || !topic.selectionPolicy) throw new Error(`Speaking Practice Part ${part} provenance is incomplete`);
      if (topic.prompts.length === 0) throw new Error(`Speaking Practice topic has no prompts: ${topic.topicId}`);
      ids.add(topic.topicId);
      if (part === 2) validateAsset(topic.image, false);
      if (part === 3) {
        // Source-limited records remain visible to the audit but never receive a
        // placeholder or a duplicated image. Available records must have A+B.
        if (topic.availability === "available") {
          validateAsset(topic.imageA, true);
          validateAsset(topic.imageB, true);
          if (topic.imageA === topic.imageB) throw new Error(`Part 3 Image A/B collide: ${topic.topicId}`);
        } else {
          validateAsset(topic.imageA, false);
          validateAsset(topic.imageB, false);
        }
      }
    }
  }
  return value;
}

export function loadSpeakingPracticeBank(): SpeakingPracticeBank {
  if (!validated) validated = validateBank(rawBank as SpeakingPracticeBank);
  return validated;
}

export function getSpeakingPracticePart(partNumber: number) {
  const bank = loadSpeakingPracticeBank();
  const part = asPart(partNumber);
  return bank.parts[`part${part}`];
}

export function getSpeakingPracticeItem(partNumber: number, itemId?: string) {
  const part = getSpeakingPracticePart(partNumber);
  const items = "questions" in part ? part.questions : part.topics;
  if (!itemId) return items[0] ?? null;
  return items.find((item) => ("questionId" in item ? item.questionId : item.topicId) === itemId) ?? null;
}

export function speakingPracticeItemId(item: SpeakingPracticeQuestion | SpeakingPracticeTopic): string {
  return "questionId" in item ? item.questionId : item.topicId;
}
