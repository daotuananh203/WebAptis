import { getGeminiClient } from "../lib/gemini/client";

async function testQuota() {
  const client = getGeminiClient();
  const models = [
    "gemini-3.5-flash-lite",
    "gemini-2.0-flash-exp",
    "gemini-3.1-pro-preview",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
  ];

  for (const m of models) {
    try {
      const res = await client.models.generateContent({
        model: m,
        contents: "Hi",
      });
      console.log(`[MODEL ${m}]: ACTIVE -> "${res.text?.trim()}"`);
    } catch (e: any) {
      console.log(`[MODEL ${m}]: FAILED -> ${e.status || e.message}`);
    }
  }
}

testQuota();
