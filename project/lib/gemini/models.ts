/**
 * Centralized Gemini model constants and role definitions.
 * Configured based on live active Google GenAI endpoint availability.
 */

export const GEMINI_MODELS = {
  // Primary active high-throughput workhorse model
  FLASH: "gemini-3.5-flash-lite",

  // High-intelligence Flash models
  FLASH_3_6: "gemini-3.6-flash",
  FLASH_3_7: "gemini-3.7-flash",
  FLASH_LITE: "gemini-3.5-flash-lite",

  // Flagship deep reasoning preview model
  PRO: "gemini-3.1-pro-preview",
} as const;

export type GeminiModelName = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS] | string;

export const CANDIDATE_GEMINI_MODELS: string[] = [
  GEMINI_MODELS.FLASH,
  GEMINI_MODELS.FLASH_3_6,
  GEMINI_MODELS.FLASH_3_7,
];

export interface GeminiTaskModelMapping {
  writingGrading: GeminiModelName;
  speakingGrading: GeminiModelName;
  aiCoach: GeminiModelName;
  fastAuxiliary: GeminiModelName;
}

export const DEFAULT_TASK_MODELS: GeminiTaskModelMapping = {
  writingGrading: GEMINI_MODELS.FLASH,
  speakingGrading: GEMINI_MODELS.FLASH,
  aiCoach: GEMINI_MODELS.FLASH,
  fastAuxiliary: GEMINI_MODELS.FLASH_LITE,
};
