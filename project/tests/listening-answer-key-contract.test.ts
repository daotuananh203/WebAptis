import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

export function runListeningAnswerKeyContractTests(): boolean {
  const root = process.cwd();
  for (let testNumber = 1; testNumber <= 16; testNumber += 1) {
    const testId = `aptis-b2-${String(testNumber).padStart(2, "0")}`;
    const dataset = JSON.parse(fs.readFileSync(path.join(root, `data/tests/${testId}-public.json`), "utf8"));
    const answers = JSON.parse(fs.readFileSync(path.join(root, `data/tests/${testId}-answers.json`), "utf8"));
    const [part1, part2, part3, part4] = dataset.listening.parts;

    for (const task of part1.tasks) {
      assert.ok(task.options.includes(answers.listening.part1[task.id]), `${task.id}: answer must be a displayed option`);
    }
    const part2OptionIds = new Set(part2.statementOptions.map((option: { id: string }) => option.id));
    for (const speaker of part2.speakers) {
      assert.ok(part2OptionIds.has(answers.listening.part2[speaker.id]), `${speaker.id}: answer must map to a displayed statement`);
    }
    for (const statement of part3.statements) {
      assert.ok(statement.options.includes(answers.listening.part3[statement.id]), `${statement.id}: answer must be Man, Woman, or Both`);
    }
    for (const monologue of part4.monologues) {
      for (const question of monologue.questions) {
        assert.ok(question.options.includes(answers.listening.part4[question.id]), `${question.id}: answer must be a displayed option`);
      }
    }
  }

  const sourceAudit = JSON.parse(
    fs.readFileSync(path.join(root, "data/listening-forensics/answer-key-style-audit.json"), "utf8"),
  );
  const sourceSelected = sourceAudit.flatMap((test: { findings: Array<{ status: string; match: boolean | null }> }) =>
    test.findings.filter((finding) => finding.status === "SOURCE_SELECTED"),
  );
  assert.ok(sourceSelected.length >= 300, "Style-aware source audit must cover the large majority of deterministic answers");
  assert.equal(sourceSelected.filter((finding: { match: boolean | null }) => finding.match === false).length, 0);

  const part2SourceMap = JSON.parse(
    fs.readFileSync(path.join(root, "data/listening-forensics/part2-answer-source-map.json"), "utf8"),
  );
  for (const [testId, source] of Object.entries(part2SourceMap.tests) as Array<[
    string,
    { evidence: string[]; answers: string[] },
  ]>) {
    const answerKey = JSON.parse(fs.readFileSync(path.join(root, `data/tests/${testId}-answers.json`), "utf8"));
    const actual = Object.entries(answerKey.listening.part2)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, answer]) => answer);
    assert.equal(source.evidence.length, 4, `${testId}: four source mappings required`);
    assert.deepEqual(actual, source.answers, `${testId}: Part 2 scoring must match style-aware source mapping`);
  }

  const test01 = JSON.parse(fs.readFileSync(path.join(root, "data/tests/aptis-b2-01-public.json"), "utf8"));
  const test03 = JSON.parse(fs.readFileSync(path.join(root, "data/tests/aptis-b2-03-public.json"), "utf8"));
  const test06 = JSON.parse(fs.readFileSync(path.join(root, "data/tests/aptis-b2-06-public.json"), "utf8"));
  assert.deepEqual(test01.listening.parts[1].statementOptions.map((item: { id: string }) => item.id), [
    "t01_l2_opt_3", "t01_l2_opt_4", "t01_l2_opt_5", "t01_l2_opt_6", "t01_l2_opt_7",
  ]);
  assert.deepEqual(test03.listening.parts[1].statementOptions.map((item: { id: string }) => item.id), [
    "t03_l2_opt_5", "t03_l2_opt_6", "t03_l2_opt_7", "t03_l2_opt_8",
  ]);
  assert.deepEqual(test06.listening.parts[1].statementOptions.map((item: { id: string }) => item.id), [
    "t06_l2_opt_5", "t06_l2_opt_6", "t06_l2_opt_7", "t06_l2_opt_8", "t06_l2_opt_9",
  ]);

  const vercel = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
  const audioRule = vercel.headers.find((rule: { source: string }) => rule.source === "/audio/(.*)");
  assert.equal(audioRule.headers.find((header: { key: string }) => header.key === "Cache-Control").value, "public, max-age=0, must-revalidate");
  const renderer = fs.readFileSync(path.join(root, "components/practice/question-renderer.tsx"), "utf8");
  assert.match(renderer, /20260826-contract-v1/);
  assert.doesNotMatch(renderer, /src=\{taskAudioUrl\}/);

  console.log("✅ [LISTENING ANSWER CONTRACT] Source-styled answer keys, displayed options, and cache-busting passed.");
  return true;
}

if (process.argv[1]?.endsWith("listening-answer-key-contract.test.ts")) {
  runListeningAnswerKeyContractTests();
}
