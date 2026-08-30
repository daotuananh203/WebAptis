import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const baseUrl = process.env.SPEAKING_AUDIT_BASE_URL ?? "http://localhost:3128";

async function register(page: Page, context: BrowserContext) {
  const email = `history_phase1_${Date.now()}_${Math.floor(Math.random() * 100000)}@aptis.edu.vn`;
  const password = "Password123!";
  const response = await page.request.post("/api/auth/register", {
    data: { email, password, name: "History Phase 1" },
  });
  expect(response.status()).toBe(201);
  const cookie = response.headers()["set-cookie"]?.match(/aptis_session=([^;]+)/)?.[1];
  expect(cookie).toBeTruthy();
  await context.addCookies([{ name: "aptis_session", value: cookie!, url: baseUrl }]);
  return { email, password };
}

test.use({ baseURL: baseUrl });

test("History shows every persisted Practice/Mock result after refresh and re-login", async ({ page, context }) => {
  test.setTimeout(90_000);
  const credentials = await register(page, context);
  const health = await page.request.get("/api/health");
  const healthData = await health.json();
  test.skip(healthData.checks?.database !== "connected", "requires a PostgreSQL-backed environment");

  const suffix = Date.now();
  const records = [
    { id: `phase1_a_${suffix}`, testId: "aptis-b2-01", mode: "practice", skill: "reading", partIdentifier: "part1", rawScore: 8, maxRawScore: 10, percentage: 80 },
    { id: `phase1_b_${suffix}`, testId: "aptis-4skills-01", mode: "mock-test", skill: "listening", partIdentifier: "part1", rawScore: 9, maxRawScore: 10, percentage: 90 },
    { id: `phase1_s_${suffix}`, testId: "aptis-b2-02", mode: "practice", skill: "speaking", partIdentifier: "part1", practiceItemId: "speaking-part1-q01", rawScore: 20, maxRawScore: 25, percentage: 80 },
  ];

  for (const record of records) {
    const response = await page.request.post("/api/user/progress", {
      data: { ...record, completedAt: new Date().toISOString() },
    });
    expect(response.status()).toBe(200);
  }
  // The same logical submission is idempotent at the database boundary.
  const duplicate = await page.request.post("/api/user/progress", {
    data: { ...records[0], completedAt: new Date().toISOString() },
  });
  expect(duplicate.status()).toBe(200);

  const apiResponse = await page.request.get("/api/user/progress");
  expect(apiResponse.status()).toBe(200);
  const apiData = await apiResponse.json();
  const ids = records.map((record) => record.id);
  expect(apiData.data.filter((record: { id: string }) => ids.includes(record.id))).toHaveLength(3);

  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Lịch sử làm bài").last()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("history-attempt")).toHaveCount(3, { timeout: 30_000 });
  for (const record of records) {
    await expect(page.locator(`[data-testid="history-attempt"][data-attempt-id="${record.id}"]`)).toHaveCount(1);
    await expect(page.getByText(record.testId)).toBeVisible();
  }

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("history-attempt")).toHaveCount(3, { timeout: 30_000 });

  await page.getByRole("button").filter({ hasText: "History Phase 1" }).click();
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await page.waitForURL(/\/login/);
  await page.locator('input[name="email"]').fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole("button", { name: /Đăng nhập/i }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page.getByTestId("history-attempt")).toHaveCount(3, { timeout: 30_000 });
});
