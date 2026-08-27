import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export function runListeningT16SourceParserTest(): void {
  const sourceProbe = [
    "import dataclasses, json, sys",
    "sys.path.insert(0, 'scripts')",
    "from listening_contract_audit import parse_source_blocks",
    "_, blocks = parse_source_blocks(16)",
    "print(json.dumps([dataclasses.asdict(block) for block in blocks]))",
  ].join("; ");
  const result = spawnSync(
    process.env.PYTHON || "python",
    ["-c", sourceProbe],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const blocks = JSON.parse(result.stdout) as Array<{
    block_id?: string;
    source_text?: string;
  }>;
  assert.equal(blocks.length, 20);
  assert.ok(
    blocks.every(
      (block) => typeof block.source_text === "string" && block.source_text.trim().length > 2,
    ),
  );
  assert.deepEqual(
    blocks.slice(13, 17).map((block) => block.block_id),
    ["p2-spk-a", "p2-spk-b", "p2-spk-c", "p2-spk-d"],
  );
}

runListeningT16SourceParserTest();
