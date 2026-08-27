export interface ExamTestCatalogEntry {
  testId: string;
  /** Display order in the combined practice/mock catalog. */
  catalogNumber: number;
  label: string;
  sourceBatch?: "standard-16" | "aptis-4skills-2026-08";
  hasListeningAudio: boolean;
}

export const STANDARD_TEST_CATALOG: ExamTestCatalogEntry[] = Array.from(
  { length: 16 },
  (_, index) => {
    const sourceNumber = index + 1;
    const label = sourceNumber.toString().padStart(2, "0");
    return {
      testId: `aptis-b2-${label}`,
      catalogNumber: sourceNumber,
      label: `Đề ${label}`,
      sourceBatch: "standard-16",
      hasListeningAudio: sourceNumber !== 16,
    };
  }
);

export const SOURCE_BATCH_TEST_CATALOG: ExamTestCatalogEntry[] = Array.from(
  { length: 7 },
  (_, index) => {
    const sourceNumber = index + 1;
    const label = sourceNumber.toString().padStart(2, "0");
    return {
      testId: `aptis-4skills-${label}`,
      catalogNumber: 16 + sourceNumber,
      label: `Bộ 4 kỹ năng ${label}`,
      sourceBatch: "aptis-4skills-2026-08",
      hasListeningAudio: true,
    };
  }
);

export const ALL_EXAM_TEST_CATALOG: ExamTestCatalogEntry[] = [
  ...STANDARD_TEST_CATALOG,
  ...SOURCE_BATCH_TEST_CATALOG,
];

export function formatTestDisplayName(testId: string): string {
  const entry = ALL_EXAM_TEST_CATALOG.find((item) => item.testId === testId);
  return entry?.label ?? testId;
}
