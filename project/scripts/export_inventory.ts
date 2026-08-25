import fs from "fs";
import path from "path";
import { generateAudit } from "../../project/scripts/audit-aptis-content";

const outDir = path.join(process.cwd(), "resources", "edulife");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const auditData = generateAudit();
const jsonPath = path.join(outDir, "content-inventory.json");
fs.writeFileSync(jsonPath, JSON.stringify(auditData, null, 2), "utf8");
console.log(`[Success] Written content-inventory.json to ${jsonPath}`);
