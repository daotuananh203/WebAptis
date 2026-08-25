import fs from "fs";
import path from "path";
import { UserLearningMemory, RecurringErrorRecord } from "./types";

const MEMORY_DIR = path.resolve(process.cwd(), "data/user-memory");

function getMemoryFilePath(userId: string): string {
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(MEMORY_DIR, `${safeId}-memory.json`);
}

export function loadUserMemory(userId?: string): UserLearningMemory {
  const defaultMemory: UserLearningMemory = {
    userId: userId || "anonymous",
    recurringErrors: [],
    weakSkillSummary: [],
    recommendedFocusTopics: [],
    updatedAt: new Date().toISOString(),
  };

  if (!userId) return defaultMemory;

  const filePath = getMemoryFilePath(userId);
  if (!fs.existsSync(filePath)) {
    return defaultMemory;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return defaultMemory;
  }
}

export function recordUserError(
  userId: string,
  skill: "Grammar" | "Vocabulary" | "Reading" | "Listening" | "Writing" | "Speaking",
  topicId: string,
  topicName: string,
  exampleMistake?: string
): UserLearningMemory {
  const memory = loadUserMemory(userId);
  const now = new Date().toISOString();

  let existing = memory.recurringErrors.find((e) => e.topicId === topicId);
  if (existing) {
    existing.errorCount += 1;
    existing.lastObserved = now;
    if (exampleMistake && !existing.examples.includes(exampleMistake)) {
      existing.examples.push(exampleMistake);
      if (existing.examples.length > 5) existing.examples.shift();
    }
  } else {
    existing = {
      topicId,
      topicName,
      skill,
      errorCount: 1,
      firstObserved: now,
      lastObserved: now,
      examples: exampleMistake ? [exampleMistake] : [],
    };
    memory.recurringErrors.push(existing);
  }

  // Update focus recommendations based on top recurring errors
  memory.recurringErrors.sort((a, b) => b.errorCount - a.errorCount);
  memory.recommendedFocusTopics = memory.recurringErrors
    .slice(0, 3)
    .map((e) => `[${e.skill}] ${e.topicName} (Đã gặp ${e.errorCount} lần)`);

  memory.updatedAt = now;

  // Persist
  try {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
    fs.writeFileSync(getMemoryFilePath(userId), JSON.stringify(memory, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save user learning memory:", err);
  }

  return memory;
}
