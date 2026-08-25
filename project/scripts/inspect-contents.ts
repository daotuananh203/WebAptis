import fs from "fs";
import path from "path";

// Inspect Reading, Writing, Speaking files
const readingDir = "D:\\APTIS\\Reading";
const writingDir = "D:\\APTIS\\Writing";
const speakingDir = "D:\\APTIS\\Speaking";

function inspectFiles() {
  console.log("=== INSPECTING READING FILES ===");
  for (const f of fs.readdirSync(readingDir)) {
    const full = path.join(readingDir, f);
    const stat = fs.statSync(full);
    console.log(`- ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
  }

  console.log("\n=== INSPECTING WRITING FILES ===");
  for (const f of fs.readdirSync(writingDir)) {
    const full = path.join(writingDir, f);
    const stat = fs.statSync(full);
    console.log(`- ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
  }

  console.log("\n=== INSPECTING SPEAKING FILES ===");
  for (const f of fs.readdirSync(speakingDir)) {
    const full = path.join(speakingDir, f);
    const stat = fs.statSync(full);
    console.log(`- ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
  }
}

inspectFiles();
