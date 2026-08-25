import fs from "fs";
import path from "path";
import { generateAudit } from "../../project/scripts/audit-aptis-content";

const audit = generateAudit();

// Add detailed test mapping metadata to inventory
const testMapping: Record<string, any> = {};
for (let i = 1; i <= 16; i++) {
  const testKey = `aptis-b2-${i.toString().padStart(2, "0")}`;
  testMapping[testKey] = {
    testNumber: i,
    hasListening: true,
    hasReading: true,
    hasWriting: true,
    hasSpeaking: true,
    audioFile: i === 16 ? null : `Đề ${i}.mp3`,
    transcriptFile: `Đề ${i}.docx`,
    answerKeyFile: i === 14 ? `Đề 14_.docx` : `Đề ${i}.docx`,
    isComplete: i !== 16,
  };
}

(audit as any).testMapping = testMapping;
(audit as any).standaloneReadingTests = [
  "reading-drill-01",
  "reading-drill-02",
  "reading-drill-03",
  "reading-drill-04",
];

const paths = [
  path.join(process.cwd(), "resources", "edulife", "content-inventory.json"),
  path.join(process.cwd(), "..", "resources", "edulife", "content-inventory.json"),
];

for (const p of paths) {
  try {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, JSON.stringify(audit, null, 2), "utf8");
    console.log(`[Success] Written inventory to: ${p}`);
  } catch (err) {
    console.warn(`[Warning] Could not write to ${p}:`, err);
  }
}
