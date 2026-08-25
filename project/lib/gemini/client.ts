import { GoogleGenAI } from "@google/genai";
import { getGeminiConfig } from "./config";

let aiClientInstance: GoogleGenAI | null = null;

/**
 * Get or initialize the singleton GoogleGenAI SDK client.
 * Strictly runs on the server side to keep GEMINI_API_KEY secure.
 */
export function getGeminiClient(): GoogleGenAI {
  if (typeof window !== "undefined") {
    throw new Error("Security violation: getGeminiClient() cannot be called from the client browser.");
  }

  const { apiKey } = getGeminiConfig();

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing. Please configure it in .env.local (server-side only)."
    );
  }

  if (!aiClientInstance) {
    aiClientInstance = new GoogleGenAI({ apiKey });
  }

  return aiClientInstance;
}
