/**
 * Optional Live Gemini API Speaking Grader Integration Test
 * Run manually via: npx tsx tests/live-speaking-test.ts
 * Will skip safely if GEMINI_API_KEY is not configured in environment.
 */

import { gradeSpeakingSubmission, resolveSpeakingTaskContext } from "../lib/grading/speaking-ai";
import { getGeminiConfig } from "../lib/gemini/config";

async function main() {
  console.log("==================================================");
  console.log("LIVE GEMINI 3.7 FLASH SPEAKING GRADING INTEGRATION");
  console.log("==================================================\n");

  const config = getGeminiConfig();
  if (!config.apiKey || config.apiKey === "your_api_key_here") {
    console.log("⚠️ LIVE SPEAKING TEST NOT RUN — API KEY NOT PROVIDED IN .env.local");
    console.log("This is expected in offline / local development without live keys.");
    process.exit(0);
  }

  try {
    console.log("📡 Connecting to Gemini 3.7 Flash Multimodal API...");
    const taskContext = resolveSpeakingTaskContext("aptis-b2-01", 1, "s1_q1");

    // Minimal valid 1-second 8kHz mono PCM WAV base64 header + silence payload
    const dummyAudioBase64 =
      "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

    const startTime = Date.now();
    const result = await gradeSpeakingSubmission(taskContext, {
      audioBase64: dummyAudioBase64,
      mimeType: "audio/wav",
      durationSeconds: 15,
    });
    const latency = Date.now() - startTime;

    console.log(`✅ Live Gemini Speaking call succeeded in ${latency}ms`);
    console.log(`Audio Quality: ${result.audioQuality}`);
    console.log(`Overall Score: ${result.overallScore}/${result.maxOverallScore}`);
    console.log(`Estimated Band: ${result.estimatedBand}`);
    console.log(`Criteria evaluated: ${result.criteria.length}`);
    console.log("\n==================================================");
    console.log("🎉 LIVE SPEAKING INTEGRATION TEST PASSED");
    console.log("==================================================");
  } catch (error) {
    console.error("❌ Live speaking integration error:", error);
    process.exit(1);
  }
}

main();
