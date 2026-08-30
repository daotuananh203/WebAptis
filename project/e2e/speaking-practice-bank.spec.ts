import { test, expect } from "@playwright/test";

test.describe("canonical Speaking Practice Bank", () => {
  test.beforeEach(async ({ page }) => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await page.goto("/register", { waitUntil: "networkidle" });
    await page.locator('input[type="text"]').first().fill("Speaking Bank Tester");
    await page.locator('input[type="email"]').first().fill(`speaking-bank-${suffix}@example.com`);
    await page.locator('input[name="password"]').fill("Pass123456!");
    await page.locator('input[name="confirmPassword"]').fill("Pass123456!");
    await page.locator('button[type="submit"]').click();
    // Registration also hydrates the client auth store; wait for that cookie
    // before visiting the protected Practice route.
    await page.waitForTimeout(1500);
  });

  test("exposes source counts and renders an isolated Part 1 item", async ({ page, request }) => {
    const response = await request.get("/api/speaking/practice-bank?part=1");
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload.success).toBeTruthy();
    expect(payload.data.itemCount).toBe(31);
    expect(payload.data.items).toHaveLength(31);

    await page.goto("/practice/speaking/part1?bank=canonical&itemId=aptis-spk-p1-001", { waitUntil: "networkidle" });
    await expect(page.getByText(/Tell me about yourself\./).first()).toBeVisible();
    await expect(page.getByText(/Speaking Practice Bank/).first()).toBeVisible();
    await expect(page.getByText(/Test 01/)).toHaveCount(0);
  });

  test("renders Part 3 Image A and Image B from the same source topic", async ({ page, request }) => {
    const response = await request.get("/api/speaking/practice-bank?part=3&itemId=spk-bank-p3-gdrive_spk_p3_035");
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    expect(payload.data.item.imageA).toBeTruthy();
    expect(payload.data.item.imageB).toBeTruthy();
    expect(payload.data.item.imageA).not.toBe(payload.data.item.imageB);

    await page.goto("/practice/speaking/part3?bank=canonical&itemId=spk-bank-p3-gdrive_spk_p3_035", { waitUntil: "networkidle" });
    const images = page.locator("img");
    await expect(images).toHaveCount(2);
    for (const image of await images.all()) {
      expect(await image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      const imageResponse = await request.get(await image.getAttribute("src") || "");
      expect(imageResponse.status()).toBe(200);
    }
    await expect(page.getByText("Ảnh 1: Image A", { exact: true })).toBeVisible();
    await expect(page.getByText("Ảnh 2: Image B", { exact: true })).toBeVisible();
  });

  test("keeps Part 1–4 browser context isolated", async ({ page }) => {
    await page.goto("/practice/speaking/part1?bank=canonical&itemId=aptis-spk-p1-001", { waitUntil: "networkidle" });
    await expect(page.getByText(/Tell me about yourself\./).first()).toBeVisible();

    await page.goto("/practice/speaking/part2?bank=canonical&itemId=spk-bank-p2-gdrive_spk_p2_002", { waitUntil: "networkidle" });
    await expect(page.locator("img")).toHaveCount(1);
    await expect(page.getByText(/Describe the picture/i).first()).toBeVisible();
    const part2Image = page.locator("img").first();
    await part2Image.scrollIntoViewIfNeeded();
    await expect.poll(() => part2Image.evaluate((element) => (element as HTMLImageElement).naturalWidth), { timeout: 10000 }).toBeGreaterThan(0);

    await page.goto("/practice/speaking/part3?bank=canonical&itemId=spk-bank-p3-gdrive_spk_p3_035", { waitUntil: "networkidle" });
    await expect(page.locator("img")).toHaveCount(2);
    await expect(page.getByText(/Compare these two pictures/i).first()).toBeVisible();
    for (const image of await page.locator("img").all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth), { timeout: 10000 }).toBeGreaterThan(0);
    }

    await page.goto("/practice/speaking/part4?bank=canonical&itemId=spk-bank-p4-gdrive_spk_p4_068", { waitUntil: "networkidle" });
    await expect(page.getByText(/Chủ đề:/).first()).toBeVisible();
    await expect(page.getByText(/Nội dung câu hỏi:/).first()).toBeVisible();
  });
});
