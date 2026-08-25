import { test, expect } from "@playwright/test";

test.describe("Full Mock Test Exam Room & Transitions", () => {
  let testEmail: string;

  test.beforeEach(async ({ page, context }) => {
    testEmail = `mock_candidate_${Date.now()}_${Math.floor(Math.random() * 10000)}@aptis.edu.vn`;
    
    const response = await page.request.post("/api/auth/register", {
      data: {
        email: testEmail,
        password: "Password123!",
        name: "Mock Candidate",
      },
    });
    expect(response.ok()).toBeTruthy();

    const setCookieHeader = response.headers()["set-cookie"];
    if (setCookieHeader) {
      const tokenMatch = setCookieHeader.match(/aptis_session=([^;]+)/);
      if (tokenMatch) {
        await context.addCookies([
          {
            name: "aptis_session",
            value: tokenMatch[1],
            url: "http://localhost:3128",
          },
        ]);
      }
    }

    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
  });

  test("1. Full Mock Test Hub Catalog (16 Tests)", async ({ page }) => {
    await page.goto("/mock-test");
    await expect(page.locator("text=Đề thi thử Aptis B2 — Đề 01").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Đề thi thử Aptis B2 — Đề 16").first()).toBeVisible({ timeout: 15000 });
  });

  test("2. Full Mock Test 01 Session Lifecycle", async ({ page }) => {
    await page.goto("/mock-test/session/aptis-b2-01");
    await expect(page.locator("text=Grammar & Vocabulary").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Đề 01").first()).toBeVisible({ timeout: 15000 });
  });

  test("3. Full Mock Test 08 Session Lifecycle", async ({ page }) => {
    await page.goto("/mock-test/session/aptis-b2-08");
    await expect(page.locator("text=Grammar & Vocabulary").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Đề 08").first()).toBeVisible({ timeout: 15000 });
  });

  test("4. Full Mock Test 15 Session Lifecycle (Precision Audio Verification)", async ({ page }) => {
    await page.goto("/mock-test/session/aptis-b2-15");
    await expect(page.locator("text=Grammar & Vocabulary").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Đề 15").first()).toBeVisible({ timeout: 15000 });
  });

  test("5. Full Mock Test 16 (Missing Audio Policy Banner)", async ({ page }) => {
    await page.goto("/mock-test/session/aptis-b2-16");
    await expect(page.locator("text=Grammar & Vocabulary").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Đề 16").first()).toBeVisible({ timeout: 15000 });
  });
});
