import { DEFAULT_TASK_MODELS, GEMINI_MODELS, GeminiTaskModelMapping } from "./models";

export interface GeminiConfig {
  apiKey: string;
  defaultModel: string;
  taskModels: GeminiTaskModelMapping;
}

export function getGeminiConfig(): GeminiConfig {
  const apiKey = process.env.GEMINI_API_KEY || "";

  return {
    apiKey,
    defaultModel: process.env.GEMINI_MODEL || GEMINI_MODELS.FLASH,
    taskModels: {
      writingGrading: process.env.GEMINI_MODEL_WRITING || process.env.GEMINI_MODEL_REASONING || DEFAULT_TASK_MODELS.writingGrading,
      speakingGrading: process.env.GEMINI_MODEL_SPEAKING || process.env.GEMINI_MODEL || DEFAULT_TASK_MODELS.speakingGrading,
      aiCoach: process.env.GEMINI_MODEL_COACH || process.env.GEMINI_MODEL || DEFAULT_TASK_MODELS.aiCoach,
      fastAuxiliary: process.env.GEMINI_MODEL_FAST || DEFAULT_TASK_MODELS.fastAuxiliary,
    },
  };
}
