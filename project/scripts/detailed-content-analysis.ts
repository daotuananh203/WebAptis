import fs from "fs";
import path from "path";
import { generateAudit } from "./audit-aptis-content";

const res = generateAudit();

console.log("\n==================================================");
console.log("DETAILED APTIS CONTENT AUDIT BREAKDOWN");
console.log("==================================================");

const byFolder: Record<string, typeof res.files> = {};
for (const f of res.files) {
  const dir = path.dirname(f.relativePath);
  byFolder[dir] = byFolder[dir] || [];
  byFolder[dir].push(f);
}

for (const [dir, files] of Object.entries(byFolder)) {
  console.log(`\n📁 FOLDER: ${dir} (${files.length} files)`);
  for (const f of files) {
    console.log(`   • [${f.extension}] ${f.name} (${f.sizeFormatted}) [${f.category}]`);
  }
}

// ----------------------------------------------------
// Specific check: Listening tests vs Audio vs Transcripts vs Keys
// ----------------------------------------------------
console.log("\n==================================================");
console.log("LISTENING SUITE: 1-to-1 MATRIX CHECK (ĐỀ 1..16)");
console.log("==================================================");

const listeningTests = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

for (const num of listeningTests) {
  const hasDe = res.files.some(
    (f) =>
      f.relativePath.includes("01. Đề thi") &&
      (f.name.includes(`Đề ${num}.`) || f.name.includes(`Đề ${num} `) || f.name.startsWith(`Đề ${num}`))
  );
  const hasAudio = res.files.some(
    (f) =>
      f.relativePath.includes("03. Audio") &&
      (f.name.includes(`Đề ${num}.`) || f.name.includes(`Đề ${num} `) || f.name.startsWith(`Đề ${num}`))
  );
  const hasTranscript = res.files.some(
    (f) =>
      f.relativePath.includes("04. Transcript") &&
      (f.name.includes(`Đề ${num}.`) || f.name.includes(`Đề ${num} `) || f.name.startsWith(`Đề ${num}`))
  );
  const hasKey = res.files.some(
    (f) =>
      f.relativePath.includes("Đáp án") &&
      (f.name.includes(`Đề ${num}.`) || f.name.includes(`Đề ${num} `) || f.name.startsWith(`Đề ${num}`) || f.name.includes(`Đề ${num} -`))
  );

  console.log(
    `Đề ${num.toString().padStart(2, " ")}: [Đề: ${hasDe ? "✓" : "✗"}] [Audio: ${hasAudio ? "✓" : "✗"}] [Transcript: ${hasTranscript ? "✓" : "✗"}] [Đáp án: ${hasKey ? "✓" : "✗"}]`
  );
}
