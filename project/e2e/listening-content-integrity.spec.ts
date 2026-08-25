import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("Listening Content Forensic Integrity Golden Test Suite", () => {
  const testsDir = path.resolve(process.cwd(), "data/tests");

  for (let i = 1; i <= 16; i++) {
    const pad = i.toString().padStart(2, "0");
    const testId = `aptis-b2-${pad}`;
    const pubPath = path.join(testsDir, `${testId}-public.json`);
    const ansPath = path.join(testsDir, `${testId}-answers.json`);

    test(`Verify ${testId} listening public dataset & answer key contract integrity`, () => {
      expect(fs.existsSync(pubPath)).toBe(true);
      expect(fs.existsSync(ansPath)).toBe(true);

      const pub = JSON.parse(fs.readFileSync(pubPath, "utf-8"));
      const ans = JSON.parse(fs.readFileSync(ansPath, "utf-8"));

      expect(pub.listening).toBeDefined();
      expect(pub.listening.officialDurationMinutes).toBe(40);
      expect(Array.isArray(pub.listening.parts)).toBe(true);
      expect(pub.listening.parts.length).toBe(4);

      // Part 1
      const p1 = pub.listening.parts[0];
      expect(p1.partNumber).toBe(1);
      expect(p1.taskType).toBe("information-recognition");
      expect(p1.tasks.length).toBe(13);

      for (let qIdx = 0; qIdx < 13; qIdx++) {
        const task = p1.tasks[qIdx];
        const qNum = qIdx + 1;
        const qPad = qNum.toString().padStart(2, "0");
        const expectedTaskId = `t${pad}_l1_q${qPad}`;

        expect(task.id).toBe(expectedTaskId);
        expect(task.questionNumber).toBe(qNum);
        expect(typeof task.questionText).toBe("string");
        expect(task.questionText.trim().length).toBeGreaterThan(0);
        expect(Array.isArray(task.options)).toBe(true);
        expect(task.options.length).toBeGreaterThanOrEqual(2);

        // Audio
        if (i === 16) {
          expect(task.audio.status).toBe("missing");
        } else {
          expect(task.audioUrl).toBe(`/audio/listening/segments/aptis-b2-${pad}/part-1/q${qPad}.mp3`);
          expect(task.audio.status).toBe("VERIFIED");
          expect(task.audio.audioSegmentStatus).toBe("VERIFIED");
        }

        // Answer
        const p1Ans = ans.listening?.part1?.[expectedTaskId];
        expect(p1Ans).toBeDefined();
        expect(task.options).toContain(p1Ans);
      }

      // Part 2
      const p2 = pub.listening.parts[1];
      expect(p2.partNumber).toBe(2);
      expect(p2.taskType).toBe("speaker-information-matching");
      expect(p2.speakers.length).toBe(4);
      expect(p2.statementOptions.length).toBeGreaterThanOrEqual(2);

      const optIds = new Set(p2.statementOptions.map((o: any) => o.id));
      for (let sIdx = 1; sIdx <= 4; sIdx++) {
        const spkId = `t${pad}_l2_spk_${sIdx}`;
        const p2Ans = ans.listening?.part2?.[spkId];
        expect(p2Ans).toBeDefined();
        expect(optIds.has(p2Ans)).toBe(true);
      }

      // Part 3
      const p3 = pub.listening.parts[2];
      expect(p3.partNumber).toBe(3);
      expect(p3.taskType).toBe("opinion-discussion");
      expect(p3.statements.length).toBe(4);

      for (let sIdx = 1; sIdx <= 4; sIdx++) {
        const stmtId = `t${pad}_l3_stmt_${sIdx}`;
        const p3Ans = ans.listening?.part3?.[stmtId];
        expect(p3Ans).toBeDefined();
        expect(["Man", "Woman", "Both"]).toContain(p3Ans);
      }

      // Part 4
      const p4 = pub.listening.parts[3];
      expect(p4.partNumber).toBe(4);
      expect(p4.taskType).toBe("extended-monologue");
      expect(p4.monologues.length).toBe(2);

      const expectedQIds = [
        `t${pad}_l4_m1_q1`,
        `t${pad}_l4_m1_q2`,
        `t${pad}_l4_m2_q1`,
        `t${pad}_l4_m2_q2`
      ];

      const actualQIds: string[] = [];
      p4.monologues.forEach((m: any) => {
        expect(m.questions.length).toBe(2);
        m.questions.forEach((q: any) => {
          actualQIds.push(q.id);
          const p4Ans = ans.listening?.part4?.[q.id];
          expect(p4Ans).toBeDefined();
          expect(q.options).toContain(p4Ans);
        });
      });
      expect(actualQIds).toEqual(expectedQIds);
    });
  }
});
