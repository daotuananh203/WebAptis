/**
 * Content Audit & Inventory Analyzer for D:\APTIS
 */

import fs from "fs";
import path from "path";

const ROOT_DIR = "D:\\APTIS";

interface FileEntry {
  relativePath: string;
  absolutePath: string;
  name: string;
  extension: string;
  sizeBytes: number;
  sizeFormatted: string;
  category: string;
  skill: string;
  isReadable: boolean;
  notes?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function classifyFile(relPath: string, ext: string): { category: string; skill: string } {
  const lower = relPath.toLowerCase();

  if (lower.includes("audio") || ext === ".mp3" || ext === ".wav") {
    return { category: "Audio", skill: "Listening" };
  }
  if (lower.includes("transcript")) {
    return { category: "Transcript", skill: "Listening" };
  }
  if (lower.includes("đáp án") || lower.includes("keys") || lower.includes("key")) {
    return {
      category: "Answer Keys",
      skill: lower.includes("reading") ? "Reading" : lower.includes("listening") ? "Listening" : "General",
    };
  }
  if (ext === ".pptx" || ext === ".ppt") {
    const skill = lower.includes("reading")
      ? "Reading"
      : lower.includes("listening")
      ? "Listening"
      : lower.includes("writing")
      ? "Writing"
      : lower.includes("speaking")
      ? "Speaking"
      : "General";
    return { category: "Bài giảng / Slide", skill };
  }
  if (lower.includes("reading")) {
    return { category: "Reading Practice", skill: "Reading" };
  }
  if (lower.includes("writing")) {
    return { category: "Writing Practice", skill: "Writing" };
  }
  if (lower.includes("speaking")) {
    return { category: "Speaking Practice", skill: "Speaking" };
  }
  if (lower.includes("listening")) {
    return { category: "Listening Practice", skill: "Listening" };
  }

  return { category: "Khác", skill: "General" };
}

function scanDir(dir: string, baseDir: string = dir): FileEntry[] {
  const results: FileEntry[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      results.push(...scanDir(fullPath, baseDir));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      const stats = fs.statSync(fullPath);
      const { category, skill } = classifyFile(relPath, ext);

      results.push({
        relativePath: relPath,
        absolutePath: fullPath,
        name: entry.name,
        extension: ext,
        sizeBytes: stats.size,
        sizeFormatted: formatBytes(stats.size),
        category,
        skill,
        isReadable: true,
      });
    }
  }

  return results;
}

export function generateAudit() {
  const files = scanDir(ROOT_DIR);
  console.log(`[Audit] Total scanned files: ${files.length}`);

  let totalBytes = 0;
  const categoriesCount: Record<string, { count: number; totalBytes: number }> = {};
  const extensionsCount: Record<string, number> = {};
  const skillsCount: Record<string, number> = {};

  for (const f of files) {
    totalBytes += f.sizeBytes;
    categoriesCount[f.category] = categoriesCount[f.category] || { count: 0, totalBytes: 0 };
    categoriesCount[f.category].count++;
    categoriesCount[f.category].totalBytes += f.sizeBytes;

    extensionsCount[f.extension] = (extensionsCount[f.extension] || 0) + 1;
    skillsCount[f.skill] = (skillsCount[f.skill] || 0) + 1;
  }

  console.log(`[Audit] Total Size: ${formatBytes(totalBytes)}`);
  console.log("[Audit] Categories:", categoriesCount);
  console.log("[Audit] Extensions:", extensionsCount);
  console.log("[Audit] Skills:", skillsCount);

  return {
    totalFiles: files.length,
    totalBytes,
    totalFormatted: formatBytes(totalBytes),
    categoriesCount,
    extensionsCount,
    skillsCount,
    files,
  };
}

if (process.argv[1]?.endsWith("audit-aptis-content.ts")) {
  generateAudit();
}
