import { NextResponse } from "next/server";
import { isDatabaseConfigured, queryOne } from "@/lib/db/client";
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
  let dbStatus = "memory_fallback";
  if (isDatabaseConfigured()) {
    try {
      await queryOne("SELECT 1 as alive;");
      dbStatus = "connected";
    } catch {
      dbStatus = "connection_failed";
    }
  }

  // 3. Check Knowledge Store Availability
  const compiledVaultPath = path.join(process.cwd(), "data/knowledge/vault-compiled.json");
  const isCompiledVaultReady = fs.existsSync(compiledVaultPath);
  const isLiveVaultReady = isObsidianVaultAvailable();

  // 4. Check Listening Master Audio Assets
  const audioDir = path.join(process.cwd(), "public/audio/listening");
  const hasAudioAssets = fs.existsSync(audioDir) && fs.readdirSync(audioDir).filter(f => f.endsWith(".mp3")).length >= 15;

  const isHealthy = (isCompiledVaultReady || isLiveVaultReady) && hasAudioAssets && dbStatus !== "connection_failed";
  // Vercel exposes this immutable build identifier to server functions.  Keep
  // it in health output so a production audit can prove which Git commit is
  // serving traffic instead of inferring it from deployment timing.
  const buildCommit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || null;

  const healthData = {
    status: isHealthy ? "healthy" : "degraded",
    timestamp,
    uptimeSeconds,
    version: "1.0.0",
    buildCommit,
    checks: {
      aiProvider: isAiConfigured ? "configured" : "unconfigured",
      database: dbStatus,
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
