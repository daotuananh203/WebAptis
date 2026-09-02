import { ALL_EXAM_TEST_CATALOG } from "./test-catalog";
import canonicalSpeakingBank from "@/data/speaking/canonical-speaking-practice-bank.json";

export const EXAM_CATALOG_SUMMARY = {
  testCount: ALL_EXAM_TEST_CATALOG.length,
  skillCounts: {
    listening: `${ALL_EXAM_TEST_CATALOG.length} bộ đề`,
    reading: `${ALL_EXAM_TEST_CATALOG.length} bộ đề`,
    writing: `${ALL_EXAM_TEST_CATALOG.length} bộ đề`,
    grammarVocabulary: `${ALL_EXAM_TEST_CATALOG.length} bộ đề`,
    speaking: `Practice Bank canonical (${canonicalSpeakingBank.parts.part1.itemCount + canonicalSpeakingBank.parts.part2.itemCount + canonicalSpeakingBank.parts.part3.itemCount + canonicalSpeakingBank.parts.part4.itemCount} topic)`,
  },
} as const;
