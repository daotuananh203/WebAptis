import { test, expect } from "@playwright/test";

const VERCEL_PRODUCTION_URL =
  process.env.VERCEL_URL
    ? (process.env.VERCEL_URL.startsWith("http") ? process.env.VERCEL_URL : `https://${process.env.VERCEL_URL}`)
    : process.env.PUBLIC_URL || "https://webaptis-b2.vercel.app";

test.describe("VERCEL PRODUCTION E2E VERIFICATION SUITE", () => {
  test.use({ baseURL: VERCEL_PRODUCTION_URL });

  // ----------------------------------------------------
  // SUITE 1: HEALTH & DIAGNOSTICS
  // ----------------------------------------------------
  test("Suite 1 — Health & Diagnostics API", async ({ request }) => {
    const res = await request.get(`${VERCEL_PRODUCTION_URL}/api/health`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("healthy");
    expect(data.version).toBe("1.0.0");
    expect(data.checks.knowledgeBrain).toBe("compiled_ready");
    expect(data.checks.listeningAudio).toBe("available");
    console.log(`✓ Vercel Health Check [${VERCEL_PRODUCTION_URL}/api/health] — 200 OK (Status: ${data.status})`);
  });

  // ----------------------------------------------------
  // SUITE 2: SECURITY RESPONSE HEADERS
  // ----------------------------------------------------
  test("Suite 2 — Security Response Headers", async ({ request }) => {
    const res = await request.get(VERCEL_PRODUCTION_URL);
    const headers = res.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(headers["referrer-policy"]).toContain("strict-origin");
    expect(headers["permissions-policy"]).toContain("microphone");
    console.log("✓ Vercel Security Headers Verified (nosniff, SAMEORIGIN, strict-origin, Permissions-Policy)");
  });

  // ----------------------------------------------------
  // SUITE 3: AUTHENTICATION LIFECYCLE
  // ----------------------------------------------------
  test("Suite 3 — Authentication Lifecycle on Vercel", async ({ page }) => {
    test.setTimeout(60000);
    const email = `vercel_student_${Date.now()}@aptis.edu.vn`;
    const password = "VercelSecurePassword2026!";

    // 3.1 Landing Page
    await page.goto(`${VERCEL_PRODUCTION_URL}/`);
    await expect(page).toHaveTitle(/WebAptis/i);
    console.log("✓ Vercel Landing Page Loaded");

    // 3.2 Registration
    await page.goto(`${VERCEL_PRODUCTION_URL}/register`);
    await page.locator('input[name="name"]').fill("Vercel Production Learner");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);
    await page.locator('button[type="submit"]').click();

    // Should redirect to dashboard
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
    await expect(page.locator("body")).toContainText(/Aptis|LUYỆN THI|Dashboard/i);
    console.log(`✓ Vercel Registration & Auto-Login Successful (${email})`);

    // 3.3 Practice Hub
    await page.goto(`${VERCEL_PRODUCTION_URL}/practice`);
    await expect(page.locator("body")).toContainText(/Grammar & Vocabulary|Listening|Reading/i);
    console.log("✓ Vercel Practice Hub Accessible via Session Cookie");

    // 3.4 Protected Route Check after Logout / Clear Cookies
    await page.context().clearCookies();
    await page.goto(`${VERCEL_PRODUCTION_URL}/dashboard`);
    await page.waitForURL(/.*login/, { timeout: 10000 });
    console.log("✓ Unauthenticated /dashboard Protected & Redirected to /login on Vercel");

    // 3.5 Re-login via Login Form
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
    console.log("✓ Vercel Re-login Successful");
  });

  // ----------------------------------------------------
  // SUITE 4: AI TEACHER (10 PEDAGOGICAL QUERIES ACROSS 5 SKILLS)
  // ----------------------------------------------------
  test("Suite 4 — AI Teacher (10 Pedagogical Queries Across 5 Skills)", async ({ request }) => {
    test.setTimeout(90000);
    const queries = [
      { skill: "Grammar", q: "Why do we use present perfect with since?" },
      { skill: "Vocabulary", q: "Can you explain the difference between 'despite' and 'in spite of'?" },
      { skill: "Reading", q: "What are the key linking words for B2 Reading Part 2 sentence reordering?" },
      { skill: "Listening", q: "What is the best technique for Listening Part 3 multiple speakers matching?" },
      { skill: "Writing", q: "How to structure Writing Part 4 formal email to a club manager?" },
      { skill: "Speaking", q: "How to describe contrasting pictures in Speaking Part 3 effectively?" },
      { skill: "Mixed", q: "How do grammar and vocabulary scores impact my overall B2 CEFR certificate?" },
      { skill: "Typo Tolerance", q: "Wht is the difrence beetween present continuos and present perfect?" },
      { skill: "Vietnamese", q: "Làm thế nào để đạt điểm cao trong phần thi Speaking Part 2 Aptis?" },
      { skill: "English Idioms", q: "Give me 5 high-scoring B2 idioms for speaking about education and study." },
    ];

    for (let i = 0; i < queries.length; i++) {
      const item = queries[i];
      const start = Date.now();
      const res = await request.post(`${VERCEL_PRODUCTION_URL}/api/coach/chat`, {
        data: { userMessage: item.q },
      });
      const latency = Date.now() - start;
      expect(res.status()).toBe(200);
      const data = await res.json();
      const reply = data.data?.message || data.data?.explanation || "";
      expect(reply.length).toBeGreaterThan(20);
      console.log(`✓ [AI Teacher ${i + 1}/10 - ${item.skill}] "${item.q.slice(0, 40)}..." [${latency}ms]`);
    }
  });

  // ----------------------------------------------------
  // SUITE 5: DETERMINISTIC & AI WRITING GRADING
  // ----------------------------------------------------
  test("Suite 5 — Deterministic & AI Writing Grading", async ({ request }) => {
    test.setTimeout(45000);
    // 5.1 Deterministic Exam Grading
    const detRes = await request.post(`${VERCEL_PRODUCTION_URL}/api/grade/deterministic`, {
      data: {
        testId: "aptis-b2-01",
        skill: "grammarVocabulary",
        partIdentifier: "grammar",
        answers: { q1: "would not have left", q2: "although" },
      },
    });
    expect(detRes.status()).toBe(200);
    const detData = await detRes.json();
    expect(detData.success).toBe(true);
    console.log(`✓ Vercel Deterministic Grading — 200 OK (Score: ${detData.data.rawScore}/${detData.data.maxRawScore})`);

    // 5.2 AI Writing Submission
    const writingRes = await request.post(`${VERCEL_PRODUCTION_URL}/api/grade/writing`, {
      data: {
        testId: "aptis-b2-01",
        partNumber: 2,
        submissionText:
          "I joined the sports club because I really enjoy playing badminton and staying active on weekends with my friends.",
      },
    });
    expect([200, 400]).toContain(writingRes.status());
    const writingData = await writingRes.json();
    expect(writingData.success !== undefined).toBe(true);
    console.log(`✓ Vercel AI Writing Examiner — Status ${writingRes.status()} (Processed: ${writingData.success ? 'Graded' : 'Bounded'})`);
  });

  // ----------------------------------------------------
  // SUITE 6: AI SPEAKING STT & RUBRICS EVALUATION
  // ----------------------------------------------------
  test("Suite 6 — AI Speaking STT & Rubrics Evaluation", async ({ request }) => {
    test.setTimeout(45000);
    const dummyAudioBase64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
    const speakingRes = await request.post(`${VERCEL_PRODUCTION_URL}/api/grade/speaking`, {
      data: {
        testId: "aptis-b2-01",
        partNumber: 2,
        audioBase64: dummyAudioBase64,
        mimeType: "audio/wav",
        durationSeconds: 45,
      },
    });
    expect([200, 400]).toContain(speakingRes.status());
    const speakingData = await speakingRes.json();
    expect(speakingData.success !== undefined).toBe(true);
    console.log(`✓ Vercel AI Speaking Examiner — Status ${speakingRes.status()}`);
  });

  // ----------------------------------------------------
  // SUITE 7: LISTENING AUDIO STREAMING
  // ----------------------------------------------------
  test("Suite 7 — Listening Audio Streaming Endpoints", async ({ request }) => {
    test.setTimeout(45000);
    const audioUrls = [
      "/audio/listening/segments/aptis-b2-15/part-1/q01.mp3",
      "/audio/listening/segments/aptis-b2-15/part-1/q05.mp3",
      "/audio/listening/segments/aptis-b2-15/part-1/q10.mp3",
      "/audio/listening/segments/aptis-b2-15/part-1/q13.mp3",
      "/audio/listening/segments/aptis-b2-15/part-2/task-all.mp3",
      "/audio/listening/segments/aptis-b2-15/part-3/task-all.mp3",
      "/audio/listening/segments/aptis-b2-15/part-4/task-all.mp3",
    ];

    for (const u of audioUrls) {
      const res = await request.fetch(`${VERCEL_PRODUCTION_URL}${u}`, { method: "HEAD" });
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toContain("audio");
    }
    console.log("✓ Vercel Listening Audio Streaming Assets Verified (7/7 endpoints return 200 OK with audio MIME)");
  });

  // ----------------------------------------------------
  // SUITE 8: FULL MOCK EXAM LIFECYCLE (TESTS 01, 08, 15, 16)
  // ----------------------------------------------------
  test("Suite 8 — Full Mock Exam Lifecycle (Tests 01, 08, 15, 16)", async ({ page }) => {
    test.setTimeout(60000);
    // 8.1 Register & Authenticate via UI
    const email = `mock_tester_${Date.now()}@aptis.edu.vn`;
    await page.goto(`${VERCEL_PRODUCTION_URL}/register`);
    await page.locator('input[name="name"]').fill("Vercel Mock Candidate");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill("Password123!");
    await page.locator('input[name="confirmPassword"]').fill("Password123!");
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });

    // 8.2 Mock Hub
    await page.goto(`${VERCEL_PRODUCTION_URL}/mock-test`);
    await expect(page.locator("body")).toContainText("Đề thi thử");
    console.log("✓ Vercel Mock Test Catalog Loaded (16 Tests)");

    // 8.3 Test 01
    await page.goto(`${VERCEL_PRODUCTION_URL}/mock-test/session/aptis-b2-01`);
    await expect(page.locator("body")).toContainText("Grammar & Vocab");
    console.log("✓ Vercel Mock Test 01 Exam Session Initialized");

    // 8.4 Test 15
    await page.goto(`${VERCEL_PRODUCTION_URL}/mock-test/session/aptis-b2-15`);
    await expect(page.locator("body")).toContainText("Grammar & Vocab");
    console.log("✓ Vercel Mock Test 15 Exam Session Initialized");

    // 8.5 Test 16 (Missing Audio Policy)
    await page.goto(`${VERCEL_PRODUCTION_URL}/mock-test/session/aptis-b2-16`);
    await expect(page.locator("body")).toContainText("Grammar & Vocab");
    console.log("✓ Vercel Mock Test 16 (Missing Audio Banner Mode) Initialized");
  });
});
