import { getGeminiClient } from "../lib/gemini/client";

async function checkModels() {
  const client = getGeminiClient();
  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-2.5-pro",
  ];

  for (const m of models) {
    try {
      const res = await client.models.generateContent({
        model: m,
        contents: "Hello, reply with 1 word",
      });
      console.log(`[MODEL ${m}]: OK -> "${res.text?.trim()}"`);
    } catch (err: any) {
      console.log(`[MODEL ${m}]: FAILED -> ${err.message || err}`);
    }
  }
}

checkModels();
