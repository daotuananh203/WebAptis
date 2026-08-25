/**
 * Optional Live Gemini API Writing Grader Integration Test
 * Run manually via: npx tsx tests/live-writing-test.ts
 * Will skip safely if GEMINI_API_KEY is not configured in environment.
 */

import { gradeWritingSubmission, resolveWritingTaskContext } from "../lib/grading/writing-ai";
import { getGeminiConfig } from "../lib/gemini/config";

async function main() {
  console.log("==================================================");
  console.log("LIVE GEMINI 3.7 FLASH WRITING GRADING INTEGRATION");
  console.log("==================================================\n");

  const config = getGeminiConfig();
  if (!config.apiKey || config.apiKey === "your_api_key_here") {
    console.log("⚠️ LIVE GEMINI TEST NOT RUN — API KEY NOT PROVIDED IN .env.local");
    console.log("This is expected in offline / local development without live keys.");
    process.exit(0);
  }

  try {
    console.log("📡 Connecting to Gemini 3.7 Flash API...");
    const taskContext = resolveWritingTaskContext("aptis-b2-01", 4, "w4_task_a");

    const sampleSubmission =
      "Hi Sam, I just heard about the cancellation of our photo exhibition! I am really upset about it because I worked hard on my photos. Personally, I would prefer postponing it until the end of the year rather than having an online gallery. What do you think?";

    const startTime = Date.now();
    const result = await gradeWritingSubmission(taskContext, sampleSubmission);
    const latency = Date.now() - startTime;

    console.log(`✅ Live Gemini call succeeded in ${latency}ms`);
    console.log(`Overall Score: ${result.overallScore}/${result.maxOverallScore}`);
    console.log(`Estimated Band: ${result.estimatedBand}`);
    console.log(`Word count: ${result.wordCount} (${result.wordCountStatus})`);
    console.log(`Criteria evaluated: ${result.criteria.length}`);
    console.log("Strengths:", result.strengths);
    console.log("Model Answer excerpt:", result.modelAnswer.slice(0, 100) + "...");
    console.log("\n==================================================");
    console.log("🎉 LIVE INTEGRATION TEST PASSED");
    console.log("==================================================");
  } catch (error) {
    console.error("❌ Live integration error:", error);
    process.exit(1);
  }
}

main();
