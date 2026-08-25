import fs from "fs";
import path from "path";

const rootEntries = fs.readdirSync("D:\\APTIS", { withFileTypes: true });
console.log("=== ROOT OF D:\\APTIS ===");
for (const e of rootEntries) {
  const fullPath = path.join("D:\\APTIS", e.name);
  const stat = fs.statSync(fullPath);
  console.log(`${e.isDirectory() ? "[DIR]" : "[FILE]"} ${e.name} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
}
