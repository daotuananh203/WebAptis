import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/client";
import { isObsidianVaultAvailable } from "@/lib/knowledge/obsidian-adapter";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  const uptimeSeconds = Math.floor(process.uptime());

  // 1. Check AI Provider Key Configuration
  const isAiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-gemini-api-key-here");

  // 2. Check Database Connectivity / Configuration
  const dbConfigured = isDatabaseConfigured();

  // 3. Check Knowledge Store Availability
  const compiledVaultPath = path.join(process.cwd(), "data/knowledge/vault-compiled.json");
  const isCompiledVaultReady = fs.existsSync(compiledVaultPath);
  const isLiveVaultReady = isObsidianVaultAvailable();

  // 4. Check Listening Master Audio Assets
  const audioDir = path.join(process.cwd(), "public/audio/listening");
  const hasAudioAssets = fs.existsSync(audioDir) && fs.readdirSync(audioDir).filter(f => f.endsWith(".mp3")).length >= 15;

  const isHealthy = (isCompiledVaultReady || isLiveVaultReady) && hasAudioAssets;

  const healthData = {
    status: isHealthy ? "healthy" : "degraded",
    timestamp,
    uptimeSeconds,
    version: "1.0.0",
    checks: {
      aiProvider: isAiConfigured ? "configured" : "unconfigured",
      database: dbConfigured ? "configured" : "memory_fallback",
      knowledgeBrain: isCompiledVaultReady ? "compiled_ready" : (isLiveVaultReady ? "live_vault_ready" : "missing"),
      listeningAudio: hasAudioAssets ? "available" : "incomplete",
    },
  };

  return NextResponse.json(healthData, {
    status: isHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}
