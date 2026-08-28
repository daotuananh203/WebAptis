import { test, expect } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const testsDir = path.resolve(process.cwd(), "data/tests");
const manifest: any[] = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "data/listening-forensics/listening-audio-manifest.json"), "utf8"),
);
const auditBaseUrl = process.env.SPEAKING_AUDIT_BASE_URL ?? "http://localhost:3128";

function fileSha256(filePath: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function artifact(testId: string, blockId: string): any {
  return manifest.find((item) => item.audit.testId === testId)?.artifacts.find((item: any) => item.blockId === blockId);
}

test.describe("Listening source/audio integrity contract", () => {
  for (let number = 1; number <= 16; number += 1) {
    const pad = String(number).padStart(2, "0");
    const testId = `aptis-b2-${pad}`;

    test(`${testId}: dataset, scoring, bytes, and transcript evidence`, () => {
      const pub = JSON.parse(fs.readFileSync(path.join(testsDir, `${testId}-public.json`), "utf8"));
      const answers = JSON.parse(fs.readFileSync(path.join(testsDir, `${testId}-answers.json`), "utf8"));
      const [p1, p2, p3, p4] = pub.listening.parts;
      expect(pub.listening.parts).toHaveLength(4);
      expect(p1.tasks).toHaveLength(13);
      expect(p2.speakers).toHaveLength(4);
      expect(p3.statements).toHaveLength(4);
      expect(p4.monologues).toHaveLength(2);

      if (number === 16) {
        expect(pub.listening.audio.status).toBe("missing");
        for (const part of pub.listening.parts) {
          if (part.audio) expect(part.audio.status).toBe("missing");
          for (const key of ["tasks", "speakers", "statements", "monologues"]) {
            for (const item of part[key] || []) expect(item.audio.status).toBe("missing");
          }
        }
        return;
      }

      const mappings: Array<[string, any]> = [];
      p1.tasks.forEach((item: any, index: number) => {
        expect(item.options).toContain(answers.listening.part1[item.id]);
        mappings.push([`p1-q${String(index + 1).padStart(2, "0")}`, item.audio]);
      });
      const optionIds = p2.statementOptions.map((item: any) => item.id);
      p2.speakers.forEach((item: any, index: number) => {
        expect(optionIds).toContain(answers.listening.part2[item.id]);
        mappings.push([`p2-spk-${"abcd"[index]}`, item.audio]);
      });
      p3.statements.forEach((item: any) => expect(item.options).toContain(answers.listening.part3[item.id]));
      mappings.push(["p3-task-all", p3.audio]);
      p4.monologues.forEach((mono: any, index: number) => {
        mono.questions.forEach((item: any) => expect(item.options).toContain(answers.listening.part4[item.id]));
        mappings.push([`p4-mono${index + 1}`, mono.audio]);
      });
      mappings.push(["p2-task-all", p2.audio], ["p4-task-all", p4.audio]);

      for (const [blockId, audio] of mappings) {
        const item = artifact(testId, blockId);
        expect(item).toBeDefined();
        if (item.status !== "VERIFIED") {
          expect(item.status).toBe("UNCERTAIN");
          expect(audio.status).toBe("NOT_VERIFIED");
          expect(audio.audioSegmentStatus).toBe("NOT_VERIFIED");
          expect(audio.url).toBe("");
          expect(audio.verification.recordingBoundaryVerified).toBe(false);
          continue;
        }
        expect(audio.status).toBe("VERIFIED");
        expect(audio.url).toBe(item.url);
        expect(audio.sha256).toBe(item.sha256);
        const diskPath = path.resolve(process.cwd(), item.path.replace(/^project\//, ""));
        expect(fileSha256(diskPath)).toBe(item.sha256);
        const transcript = JSON.parse(
          fs.readFileSync(path.resolve(process.cwd(), item.transcriptEvidence.replace(/^project\//, "")), "utf8"),
        );
        expect(transcript.audioSha256).toBe(item.sha256);
        expect(transcript.validation.status).toBe("VERIFIED");
        expect(transcript.validation.unexpectedTaskContamination).toEqual([]);
      }
    });
  }

  test("clean Chrome context exposes every verified URL on all 64 Listening part pages", async ({ page, context }) => {
    test.setTimeout(300_000);
    const email = `listening_contract_${Date.now()}@aptis.edu.vn`;
    const response = await page.request.post("/api/auth/register", {
      data: { email, password: "Password123!", name: "Listening Contract E2E" },
    });
    expect(response.ok()).toBeTruthy();
    const cookie = response.headers()["set-cookie"]?.match(/aptis_session=([^;]+)/)?.[1];
    if (cookie) await context.addCookies([{ name: "aptis_session", value: cookie, url: auditBaseUrl }]);

    for (let number = 1; number <= 16; number += 1) {
      const testId = `aptis-b2-${String(number).padStart(2, "0")}`;
      for (let part = 1; part <= 4; part += 1) {
        await page.goto(`/practice/listening/part${part}?testId=${testId}`, { waitUntil: "domcontentloaded" });
        await page.locator("audio").evaluateAll((nodes) =>
          nodes.forEach((node) => (node as HTMLAudioElement).load()),
        );
        if (number !== 16) {
          await page.waitForFunction(() =>
            Array.from(document.querySelectorAll("audio")).every((node) => node.currentSrc.length > 0),
          );
        }
        const currentSources = await page.locator("audio").evaluateAll((nodes) =>
          nodes.map((node) => (node as HTMLAudioElement).currentSrc),
        );
        if (number === 16) {
          expect(currentSources).toEqual([]);
          continue;
        }
        const result = manifest.find((item) => item.audit.testId === testId);
        const expected = result.artifacts
          .filter((item: any) => item.status === "VERIFIED" && (
            part === 1 ? item.blockId.startsWith("p1-q") :
            part === 2 ? item.blockId === "p2-task-all" :
            part === 3 ? item.blockId === "p3-task-all" :
            item.blockId === "p4-task-all"
          ))
          .map((item: any) => item.url);
        for (const url of expected) {
          const expectedArtifact = result.artifacts.find((item: any) => item.url === url);
          expect(
            currentSources.some((current) =>
              new URL(current).pathname === url &&
              new URL(current).searchParams.get("v") === expectedArtifact.sha256.slice(0, 16),
            ),
            `${testId} part${part}: currentSrc missing ${url} with validated hash version`,
          ).toBe(true);
        }
      }
    }
  });

  test("clean Chrome context exposes the source-backed audio for every part of all seven four-skills tests", async ({ page, context }) => {
    test.setTimeout(300_000);
    const email = `listening_source_batch_${Date.now()}@aptis.edu.vn`;
    const response = await page.request.post("/api/auth/register", {
      data: { email, password: "Password123!", name: "Listening Source Batch Audit" },
    });
    expect(response.status()).toBe(201);
    const cookie = response.headers()["set-cookie"]?.match(/aptis_session=([^;]+)/)?.[1];
    if (cookie) await context.addCookies([{ name: "aptis_session", value: cookie, url: auditBaseUrl }]);

    for (let number = 1; number <= 7; number += 1) {
      const testId = `aptis-4skills-${String(number).padStart(2, "0")}`;
      const pub = JSON.parse(fs.readFileSync(path.join(testsDir, `${testId}-public.json`), "utf8"));
      for (let part = 1; part <= 4; part += 1) {
        const listeningPart = pub.listening.parts[part - 1];
        const expectedUrls = part === 1
          ? listeningPart.tasks.map((task: any) => task.audio.url)
          : [listeningPart.audio.url];
        await page.goto(`/practice/listening/part${part}?testId=${testId}`, { waitUntil: "domcontentloaded" });
        const audios = page.locator("audio");
        await expect(audios).toHaveCount(expectedUrls.length);
        await audios.evaluateAll((nodes) => nodes.forEach((node) => (node as HTMLAudioElement).load()));
        await expect.poll(
          () => audios.evaluateAll((nodes) => nodes.every((node) => (node as HTMLAudioElement).currentSrc.length > 0)),
          { timeout: 15_000, message: `${testId} part${part} must resolve source audio in the browser` },
        ).toBeTruthy();
        const sources = await audios.evaluateAll((nodes) => nodes.map((node) => (node as HTMLAudioElement).currentSrc));
        for (const expectedUrl of expectedUrls) {
          expect(sources.some((source) => new URL(source).pathname === expectedUrl), `${testId} part${part} missing ${expectedUrl}`).toBeTruthy();
        }
      }
    }
  });
});
