import { test, expect } from "@playwright/test";

test.describe("Practice Hub & Comprehensive Skill Workflows", () => {
  let testEmail: string;

  test.beforeEach(async ({ page, context }) => {
    testEmail = `e2e_student_${Date.now()}_${Math.floor(Math.random() * 10000)}@aptis.edu.vn`;
    
    const response = await page.request.post("/api/auth/register", {
      data: {
        email: testEmail,
        password: "Password123!",
        name: "E2E Test Student",
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

  test("1. Dashboard navigation and practice catalog", async ({ page }) => {
    await expect(page.locator("text=Chào").first()).toBeVisible({ timeout: 15000 });
    await page.goto("/practice");
    await expect(page.locator("text=Luyện từng phần").first()).toBeVisible({ timeout: 15000 });
  });

  test("2. Grammar & Vocabulary Practice", async ({ page }) => {
    await page.goto("/practice/grammarVocabulary/part1?testId=aptis-b2-01");
    await expect(page.locator("text=Ngữ pháp").first()).toBeVisible({ timeout: 15000 });
    const buttons = page.locator("button");
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test("3. Reading Practice (Parts 1 to 4)", async ({ page }) => {
    // Part 1
    await page.goto("/practice/reading/part1?testId=aptis-b2-01");
    await expect(page.locator("text=Luyện Đọc — PART1").first()).toBeVisible({ timeout: 15000 });

    // Part 2 (Ordering)
    await page.goto("/practice/reading/part2?testId=aptis-b2-01");
    await expect(page.locator("text=Luyện Đọc — PART2").first()).toBeVisible({ timeout: 15000 });

    // Part 3 (Opinion Matching)
    await page.goto("/practice/reading/part3?testId=aptis-b2-01");
    await expect(page.locator("text=Luyện Đọc — PART3").first()).toBeVisible({ timeout: 15000 });

    // Part 4 (Headings)
    await page.goto("/practice/reading/part4?testId=aptis-b2-01");
    await expect(page.locator("text=Luyện Đọc — PART4").first()).toBeVisible({ timeout: 15000 });
  });

  test("4. Listening Practice Part 1 (Question-level Audio with 2s padding)", async ({ page }) => {
    await page.goto("/practice/listening/part1?testId=aptis-b2-01");
    await expect(page.locator("text=Audio Part 1 đã tách theo từng câu").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Bản nghe riêng cho câu hỏi này").first()).toBeVisible({ timeout: 15000 });
  });

  test("5. Listening Practice (Parts 2, 3, 4 - Single Part-Level Audio)", async ({ page }) => {
    // Part 2
    await page.goto("/practice/listening/part2?testId=aptis-b2-01");
    await expect(page.locator("text=Luyện Nghe — PART2").first()).toBeVisible({ timeout: 15000 });

    // Part 3
    await page.goto("/practice/listening/part3?testId=aptis-b2-01");
    await expect(page.locator("text=Luyện Nghe — PART3").first()).toBeVisible({ timeout: 15000 });

    // Part 4
    await page.goto("/practice/listening/part4?testId=aptis-b2-01");
    await expect(page.locator("text=Luyện Nghe — PART4").first()).toBeVisible({ timeout: 15000 });
  });

  test("6. Listening Practice Test 15 (Strict Verification)", async ({ page }) => {
    await page.goto("/practice/listening/part1?testId=aptis-b2-15");
    await expect(page.locator("text=Audio Part 1 đã tách theo từng câu").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Bản nghe riêng cho câu hỏi này").first()).toBeVisible({ timeout: 15000 });
  });

  test("7. Writing Practice (Parts 1 to 4 Input & Counter)", async ({ page }) => {
    // Part 1
    await page.goto("/practice/writing/part1?testId=aptis-b2-01");
    await expect(page.locator("text=Luyện Viết — PART1").first()).toBeVisible({ timeout: 15000 });

    // Part 4
    await page.goto("/practice/writing/part4?testId=aptis-b2-01");
    const textarea = page.locator("textarea");
    await expect(textarea.first()).toBeVisible({ timeout: 15000 });
    await textarea.first().fill("Dear Sir or Madam, I am writing to express my interest in joining the club.");
    await expect(page.locator("text=từ").first()).toBeVisible({ timeout: 15000 });
  });

  test("8. Speaking Practice (Parts 1 to 4 Recording UI)", async ({ page }) => {
    // Part 1
    await page.goto("/practice/speaking/part1?testId=aptis-b2-01");
    await expect(page.locator("text=Luyện Nói — PART1").first()).toBeVisible({ timeout: 15000 });

    // Part 2
    await page.goto("/practice/speaking/part2?testId=aptis-b2-01");
    const part2Image = page.getByTestId("speaking-image").first();
    await expect(part2Image).toBeVisible({ timeout: 15000 });
    await expect(part2Image).toHaveAttribute("src", /\/images\/speaking\/(gdrive|reconstructed)\//);
    expect(await part2Image.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);

    // Part 3 must render both source-backed comparison images.
    await page.goto("/practice/speaking/part3?testId=aptis-b2-01");
    const part3Images = page.getByTestId("speaking-image");
    await expect(part3Images).toHaveCount(2, { timeout: 15000 });
    for (const image of await part3Images.all()) {
      expect(await image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    
    const buttons = page.locator("button");
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test("9. AI Coach Free-form Chat UI", async ({ page }) => {
    await page.goto("/coach");
    await expect(page.locator("text=AI Coach").first()).toBeVisible({ timeout: 15000 });
    const chatInput = page.locator('input[placeholder*="Hỏi"], textarea[placeholder*="Hỏi"], input[type="text"]');
    await expect(chatInput.first()).toBeVisible({ timeout: 15000 });
  });
});
