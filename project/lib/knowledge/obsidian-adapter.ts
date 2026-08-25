import fs from "fs";
import path from "path";
import { KnowledgeItem, KnowledgeCategory } from "./types";

interface ParsedFrontmatter {
  type?: string;
  skill?: string;
  part?: string | number;
  level?: string;
  provider?: string;
  source_file?: string;
  source_type?: string;
  verified?: boolean;
  confidence?: string;
  tags?: string[];
  [key: string]: unknown;
}

function parseFrontmatter(rawContent: string): { meta: ParsedFrontmatter; body: string } {
  if (!rawContent.startsWith("---")) {
    return { meta: {}, body: rawContent };
  }

  const parts = rawContent.split("---", 3);
  if (parts.length < 3) {
    return { meta: {}, body: rawContent };
  }

  const yamlText = parts[1];
  const body = parts[2].trim();
  const meta: ParsedFrontmatter = {};

  for (const line of yamlText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx > 0) {
      const key = trimmed.slice(0, colonIdx).trim();
      let value = trimmed.slice(colonIdx + 1).trim();
      const commentIdx = value.indexOf("#");
      if (commentIdx >= 0) {
        value = value.slice(0, commentIdx).trim();
      }
      value = value.replace(/^["']|["']$/g, "");

      if (value.toLowerCase() === "true") {
        meta[key] = true;
      } else if (value.toLowerCase() === "false") {
        meta[key] = false;
      } else if (/^\d+$/.test(value)) {
        meta[key] = parseInt(value, 10);
      } else if (value.startsWith("[") && value.endsWith("]")) {
        meta[key] = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else {
        meta[key] = value;
      }
    }
  }

  return { meta, body };
}

function mapSkill(rawSkill?: string, filePath?: string): KnowledgeItem["skill"] {
  const s = (rawSkill || "").toLowerCase();
  const p = (filePath || "").toLowerCase();

  if (s.includes("grammar") || p.includes("01_grammar")) return "Grammar";
  if (s.includes("vocab") || p.includes("02_vocabulary")) return "Vocabulary";
  if (s.includes("read") || p.includes("03_reading")) return "Reading";
  if (s.includes("listen") || p.includes("04_listening")) return "Listening";
  if (s.includes("writ") || p.includes("05_writing")) return "Writing";
  if (s.includes("speak") || p.includes("06_speaking")) return "Speaking";

  return "General";
}

function mapCategory(meta: ParsedFrontmatter, filePath: string): KnowledgeCategory {
  const p = filePath.toLowerCase();
  const t = (meta.type || "").toLowerCase();

  if (t.includes("exam") || p.includes("exam-strategy") || p.includes("chienthuat")) return "Exam Strategy";
  if (t.includes("reading") || p.includes("03_reading")) return "Reading Strategy";
  if (t.includes("listening") || p.includes("04_listening")) return "Listening Strategy";
  if (t.includes("writing") || p.includes("05_writing")) return "Writing Strategy";
  if (t.includes("speaking") || p.includes("06_speaking")) return "Speaking Strategy";
  if (t.includes("mistake") || p.includes("mistake") || p.includes("loithuonggap")) return "Common Mistakes";
  if (t.includes("grammar") || p.includes("01_grammar") || p.includes("nguphap")) return "Grammar";
  if (t.includes("vocab") || p.includes("02_vocabulary") || p.includes("tuvung")) return "Vocabulary";
  if (t.includes("tip") || p.includes("tip") || p.includes("meo")) return "B2 Language Tips";

  return "Exam Strategy";
}

let cachedVaultKnowledge: KnowledgeItem[] | null = null;
let lastVaultLoadTime = 0;

/**
 * Load Knowledge directly from Obsidian Vault Markdown notes or Production JSON.
 */
export function loadKnowledgeFromObsidianVault(): KnowledgeItem[] {
  const now = Date.now();
  if (cachedVaultKnowledge && now - lastVaultLoadTime < 60000) {
    return cachedVaultKnowledge;
  }

  // 1. Primary in Production: Statically-scoped Production Knowledge Store
  const compiledPath = path.join(process.cwd(), "data", "knowledge", "vault-compiled.json");
  if (fs.existsSync(compiledPath)) {
    try {
      const raw = fs.readFileSync(compiledPath, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data.items) && data.items.length > 0) {
        cachedVaultKnowledge = data.items;
        lastVaultLoadTime = now;
        return data.items;
      }
    } catch {
      // fallback
    }
  }

  // 2. Development / Local Environment Live Vault
  if (process.env.NODE_ENV !== "production") {
    const vaultRoot = path.join(process.cwd(), "Aptis-AI-Brain");
    if (fs.existsSync(vaultRoot)) {
      try {
        if (fs.statSync(vaultRoot).isDirectory()) {
          const items: KnowledgeItem[] = [];

          function walk(dir: string) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const ent of entries) {
              if (ent.name.startsWith(".") || ent.name === "node_modules") continue;
              const fullPath = path.join(dir, ent.name);
              if (ent.isDirectory()) {
                walk(fullPath);
              } else if (ent.isFile() && ent.name.endsWith(".md")) {
                try {
                  const raw = fs.readFileSync(fullPath, "utf-8");
                  const relPath = path.relative(vaultRoot, fullPath).replace(/\\/g, "/");
                  const { meta, body } = parseFrontmatter(raw);

                  const h1Match = body.match(/^#\s+(.+)$/m);
                  const topicTitle = h1Match ? h1Match[1].replace(/^[^\w\s\u00C0-\u1EF9]+/, "").trim() : path.basename(ent.name, ".md");

                  const cleanBody = body.replace(/^#+.*$/gm, "").replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1").trim();
                  const summary = cleanBody.slice(0, 280).replace(/\r?\n+/g, " ") + "...";

                  const skill = mapSkill(meta.skill, relPath);
                  const category = mapCategory(meta, relPath);
                  const safeId = "obs-" + relPath.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

                  const tags = Array.isArray(meta.tags) ? meta.tags.map((t) => String(t).toLowerCase()) : [];
                  tags.push(skill.toLowerCase());
                  tags.push(category.toLowerCase().replace(/\s+/g, "-"));
                  if (meta.part) tags.push(`part${meta.part}`, `part-${meta.part}`);

                  const wikiLinks = body.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g) || [];
                  for (const wl of wikiLinks) {
                    const cleanLink = wl.slice(2, -2).split("|")[0].split("/").pop()?.toLowerCase();
                    if (cleanLink) tags.push(cleanLink);
                  }

                  items.push({
                    id: safeId,
                    skill,
                    part: meta.part ? String(meta.part) : undefined,
                    category,
                    topic: topicTitle,
                    summary,
                    content: body,
                    tags: Array.from(new Set(tags)),
                    sourceFile: meta.source_file || path.basename(relPath),
                    sourceName: meta.provider ? `Edulife ${meta.provider}` : "Edulife Knowledge Vault",
                    sourceType: "edulife",
                    isOfficialBritishCouncil: false,
                  });
                } catch (err) {
                  console.error(`Error parsing vault note ${fullPath}:`, err);
                }
              }
            }
          }

          walk(vaultRoot);

          if (items.length > 0) {
            cachedVaultKnowledge = items;
            lastVaultLoadTime = now;
            return items;
          }
        }
      } catch {
        // continue
      }
    }
  }

  return [];
}

export function isObsidianVaultAvailable(): boolean {
  const compiledPath = path.join(process.cwd(), "data", "knowledge", "vault-compiled.json");
  if (fs.existsSync(compiledPath)) return true;

  if (process.env.NODE_ENV !== "production") {
    const vaultRoot = path.join(process.cwd(), "Aptis-AI-Brain");
    if (fs.existsSync(vaultRoot)) {
      try {
        if (fs.statSync(vaultRoot).isDirectory()) return true;
      } catch {
        // continue
      }
    }
  }
  return false;
}
