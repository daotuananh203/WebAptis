import { test, expect, BrowserContext, Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.SPEAKING_AUDIT_BASE_URL ?? "http://localhost:3128";
const testIds = [
  ...Array.from({ length: 16 }, (_, index) => `aptis-b2-${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 7 }, (_, index) => `aptis-4skills-${String(index + 1).padStart(2, "0")}`),
];

function verifiedListeningPart1Count(testId: string): number {
  const dataset = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "tests", `${testId}-public.json`), "utf8")
  );
  return dataset.listening.parts[0].tasks.filter(
    (task: any) => task.audio?.status === "VERIFIED" && Boolean(task.audio?.url)
  ).length;
}

async function registerAndAuthenticate(page: Page, context: BrowserContext, label: string) {
  const email = `final_audit_${label}_${Date.now()}_${Math.floor(Math.random() * 100000)}@aptis.edu.vn`;
  const response = await page.request.post("/api/auth/register", {
    data: { email, password: "Password123!", name: `Final Audit ${label}` },
  });
  expect(response.status(), `registration for ${label}`).toBe(201);
  const token = response.headers()["set-cookie"]?.match(/aptis_session=([^;]+)/)?.[1];
  expect(token, `authenticated session cookie for ${label}`).toBeTruthy();
  await context.addCookies([{ name: "aptis_session", value: token!, url: baseUrl }]);
  return email;
}

test.use({ baseURL: baseUrl });

test.describe("Final browser learner audit", () => {
  test("a learner can enter every one of 23 tests and render every core skill", async ({ page, context }) => {
    test.setTimeout(300_000);
    // Vercel serverless functions can cold-start while the learner shell is
    // already visible.  Keep the content assertions strict, but allow the
    // page a realistic readiness window before declaring a broken flow.
    const readinessTimeout = 30_000;
    await registerAndAuthenticate(page, context, "catalog");

    await page.goto("/mock-test", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Bắt đầu thi thử" })).toHaveCount(23, { timeout: readinessTimeout });

    for (const testId of testIds) {
      await page.goto(`/mock-test/session/${testId}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Grammar & Vocabulary").first(), `${testId} mock entry`).toBeVisible({ timeout: readinessTimeout });

      await page.goto(`/practice/grammarVocabulary/part1?testId=${testId}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("button").first(), `${testId} grammar UI`).toBeVisible({ timeout: readinessTimeout });

      await page.goto(`/practice/reading/part1?testId=${testId}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("button").first(), `${testId} reading UI`).toBeVisible({ timeout: readinessTimeout });

      await page.goto(`/practice/listening/part1?testId=${testId}`, { waitUntil: "domcontentloaded" });
      const audios = page.locator("audio");
      const verifiedAudioCount = verifiedListeningPart1Count(testId);
      await expect(audios, `${testId} Listening Part 1 verified audio controls`).toHaveCount(verifiedAudioCount, { timeout: readinessTimeout });
      if (verifiedAudioCount === 0) {
        await expect(page.getByText("Thông báo: Chưa có audio bản nghe cho đề thi này")).toBeVisible({ timeout: readinessTimeout });
      } else if (verifiedAudioCount < 13) {
        await expect(page.getByText("Audio nguồn của câu này chưa chứng minh đủ nội dung nên tạm thời không phát.")).toHaveCount(13 - verifiedAudioCount, { timeout: readinessTimeout });
      }
      await audios.evaluateAll((nodes) => nodes.forEach((node) => (node as HTMLAudioElement).load()));
      await expect.poll(
        () => audios.evaluateAll((nodes) => nodes.every((node) => (node as HTMLAudioElement).currentSrc.length > 0)),
        { timeout: readinessTimeout, message: `${testId} Listening Part 1 browser sources` },
      ).toBeTruthy();

      await page.goto(`/practice/writing/part1?testId=${testId}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("input[type=text]").first(), `${testId} Writing Part 1 input`).toBeVisible({ timeout: readinessTimeout });

      await page.goto(`/practice/speaking/part1?testId=${testId}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Ghi âm câu trả lời trực tiếp"), `${testId} Speaking recorder`).toBeVisible({ timeout: readinessTimeout });
    }
  });

  test("responsive layouts retain visible content at phone, tablet, and desktop widths", async ({ page, context }) => {
    await registerAndAuthenticate(page, context, "responsive");
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/mock-test", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("button", { name: "Bắt đầu thi thử" }).first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();

      await page.goto("/practice/speaking/part3?testId=aptis-4skills-07", { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("speaking-image")).toHaveCount(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    }
  });

  test("empty Writing and denied microphone remain actionable without calling an examiner", async ({ page, context }) => {
    await registerAndAuthenticate(page, context, "edge-inputs");

    await page.goto("/practice/writing/part2?testId=aptis-b2-01", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Nộp bài" }).click();
    await expect(page.getByText("Vui lòng nhập bài viết trước khi nộp để AI chấm.")).toBeVisible();

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: () => Promise.reject(new DOMException("Permission denied", "NotAllowedError")),
        },
      });
    });
    await page.goto("/practice/speaking/part2?testId=aptis-4skills-01", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Bắt đầu ghi âm" }).click();
    await expect(page.getByText("Không thể truy cập Microphone. Vui lòng cấp quyền truy cập micro trong trình duyệt để thực hiện bài nói.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Nộp bài" })).toBeVisible();
  });

  test("submitted practice result survives refresh without duplicate grading", async ({ page, context }) => {
    test.setTimeout(90_000);
    await registerAndAuthenticate(page, context, "refresh-submit");

    await page.goto("/practice/reading/part1?testId=aptis-b2-01", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Luyện Đọc — PART1")).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "station" }).click();
    const gradingResponse = page.waitForResponse(
      (response) => response.url().includes("/api/grade/deterministic"),
      { timeout: 30_000 },
    );
    await page.getByRole("button", { name: "Nộp bài" }).click();
    await expect((await gradingResponse).status()).toBe(200);
    await expect(page.getByText(/Kết quả:/)).toBeVisible({ timeout: 30_000 });

    const health = await page.request.get("/api/health");
    const healthData = await health.json();
    const databaseIsPersistent = healthData.checks?.database === "connected";
    if (databaseIsPersistent) {
      await expect.poll(
        async () => {
          const response = await page.request.get("/api/user/progress");
          const data = await response.json();
          return data.data.filter(
            (record: { testId: string; skill: string; partIdentifier: string }) =>
              record.testId === "aptis-b2-01" && record.skill === "reading" && record.partIdentifier === "part1",
          ).length;
        },
        { timeout: 15_000, message: "submitted practice result must sync before refresh" },
      ).toBe(1);
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Kết quả:/)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "Nộp bài" })).toHaveCount(0);

    if (databaseIsPersistent) {
      await expect.poll(
        async () => {
          const response = await page.request.get("/api/user/progress");
          const data = await response.json();
          return data.data.filter(
            (record: { testId: string; skill: string; partIdentifier: string }) =>
              record.testId === "aptis-b2-01" && record.skill === "reading" && record.partIdentifier === "part1",
          ).length;
        },
        { timeout: 15_000, message: "refresh must not create a duplicate practice result" },
      ).toBe(1);
    }
  });

  test("AI routes, session integrity, and progress records stay isolated by user", async ({ browser }) => {
    test.setTimeout(90_000);
    const anonymous = await browser.newContext({ baseURL: baseUrl });
    const anonymousPage = await anonymous.newPage();
    const unauthWriting = await anonymousPage.request.post("/api/grade/writing", {
      data: { testId: "aptis-b2-01", partNumber: 2, submissionText: "A valid but unauthenticated response." },
    });
    const unauthSpeaking = await anonymousPage.request.post("/api/grade/speaking", {
      data: { testId: "aptis-b2-01", partNumber: 2, audioBase64: "AA==", mimeType: "audio/webm" },
    });
    expect(unauthWriting.status()).toBe(401);
    expect(unauthSpeaking.status()).toBe(401);
    await anonymousPage.goto("/dashboard");
    await expect(anonymousPage).toHaveURL(/\/login/);
    await anonymous.close();

    const first = await browser.newContext({ baseURL: baseUrl });
    const firstPage = await first.newPage();
    await registerAndAuthenticate(firstPage, first, "owner");
    const second = await browser.newContext({ baseURL: baseUrl });
    const secondPage = await second.newPage();
    await registerAndAuthenticate(secondPage, second, "other");

    const attemptId = `final_audit_progress_${Date.now()}`;
    const attempt = {
      id: attemptId,
      testId: "aptis-b2-01",
      mode: "practice",
      skill: "listening",
      partIdentifier: "part1",
      rawScore: 13,
      maxRawScore: 13,
      percentage: 100,
      completedAt: new Date().toISOString(),
    };
    const firstSave = await firstPage.request.post("/api/user/progress", { data: attempt });
    expect(firstSave.status()).toBe(200);
    const duplicateSave = await firstPage.request.post("/api/user/progress", { data: attempt });
    expect(duplicateSave.status()).toBe(200);

    const firstProgress = await firstPage.request.get("/api/user/progress");
    expect(firstProgress.status()).toBe(200);
    const firstData = await firstProgress.json();
    const health = await firstPage.request.get("/api/health");
    const healthData = await health.json();
    const databaseIsPersistent = healthData.checks?.database === "connected";
    if (databaseIsPersistent) {
      expect(firstData.data.filter((record: { id: string }) => record.id === attemptId)).toHaveLength(1);
    } else {
      // The local test server deliberately uses the explicit in-memory store;
      // production verification below exercises the database-backed branch.
      expect(firstData.data).toEqual([]);
    }

    const secondProgress = await secondPage.request.get("/api/user/progress");
    expect(secondProgress.status()).toBe(200);
    const secondData = await secondProgress.json();
    expect(secondData.data.some((record: { id: string }) => record.id === attemptId)).toBeFalsy();

    const token = (await first.cookies()).find((cookie) => cookie.name === "aptis_session")?.value;
    expect(token).toBeTruthy();
    const tampered = await browser.newContext({ baseURL: baseUrl });
    await tampered.addCookies([{ name: "aptis_session", value: `${token!.slice(0, -1)}x`, url: baseUrl }]);
    const tamperedPage = await tampered.newPage();
    const tamperedAi = await tamperedPage.request.post("/api/grade/writing", {
      data: { testId: "aptis-b2-01", partNumber: 2, submissionText: "Tampered-session request." },
    });
    expect(tamperedAi.status()).toBe(401);
    await tamperedPage.goto("/dashboard");
    await expect(tamperedPage).toHaveURL(/\/login/);

    await Promise.all([first.close(), second.close(), tampered.close()]);
  });
});
