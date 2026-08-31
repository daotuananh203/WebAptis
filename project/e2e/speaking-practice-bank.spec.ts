import { test, expect } from "@playwright/test";

const baseUrl = process.env.SPEAKING_AUDIT_BASE_URL ?? "http://localhost:3128";

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

  test("exposes every canonical source item and every usable image asset", async ({ request }) => {
    test.setTimeout(180_000);
    const expectedCounts: Record<number, number> = { 1: 31, 2: 33, 3: 39, 4: 29 };
    for (const part of [1, 2, 3, 4]) {
      const response = await request.get(`/api/speaking/practice-bank?part=${part}`);
      expect(response.ok()).toBeTruthy();
      const payload = await response.json();
      const items = payload.data.items as Array<Record<string, any>>;
      expect(payload.data.itemCount).toBe(expectedCounts[part]);
      expect(items).toHaveLength(expectedCounts[part]);
      const ids = items.map((item) => item.questionId || item.topicId);
      expect(new Set(ids).size).toBe(ids.length);

      // Keep the full-catalog assertion strict while using small bounded
      // batches so a cold serverless deployment does not spend the entire
      // test timeout on serial image requests.
      for (let start = 0; start < ids.length; start += 8) {
        await Promise.all(ids.slice(start, start + 8).map(async (id) => {
          const itemResponse = await request.get(`/api/speaking/practice-bank?part=${part}&itemId=${encodeURIComponent(id)}`);
          expect(itemResponse.status()).toBe(200);
          const item = (await itemResponse.json()).data.item as Record<string, any>;
          expect(item.source).toBeTruthy();
          expect(item.sourceEvidence).toBeTruthy();
          expect(item.selectionPolicy || item.questionId).toBeTruthy();
          if (part === 2 && item.availability === "available") {
            expect(item.image).toBeTruthy();
            expect((await request.get(new URL(item.image, baseUrl).toString())).status()).toBe(200);
          }
          if (part === 3 && item.availability === "available") {
            expect(item.imageA).toBeTruthy();
            expect(item.imageB).toBeTruthy();
            expect(item.imageA).not.toBe(item.imageB);
            expect((await request.get(new URL(item.imageA, baseUrl).toString())).status()).toBe(200);
            expect((await request.get(new URL(item.imageB, baseUrl).toString())).status()).toBe(200);
          }
        }));
      }
    }
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

  test("renders a recovered Part 3 source-composite pair with provenance", async ({ page, request }) => {
    const itemId = "spk-bank-p3-gdrive_spk_p3_064";
    const response = await request.get(`/api/speaking/practice-bank?part=3&itemId=${itemId}`);
    expect(response.ok()).toBeTruthy();
    const item = (await response.json()).data.item as Record<string, any>;
    expect(item.availability).toBe("available");
    expect(item.sourceEvidence.imagePairRecovery.type).toBe("source-composite-crop");
    expect(item.sourceEvidence.imagePairRecovery.crossTopicPairing).toBe(false);
    expect(item.imageA).toBeTruthy();
    expect(item.imageB).toBeTruthy();

    await page.goto(`/practice/speaking/part3?bank=canonical&itemId=${itemId}`, { waitUntil: "networkidle" });
    const images = page.getByTestId("speaking-image");
    await expect(images).toHaveCount(2);
    for (const image of await images.all()) {
      await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth), { timeout: 10000 }).toBeGreaterThan(0);
      const imageResponse = await request.get(await image.getAttribute("src") || "");
      expect(imageResponse.status()).toBe(200);
    }
    await expect(page.getByText("Ảnh 1: Image A", { exact: true })).toBeVisible();
    await expect(page.getByText("Ảnh 2: Image B", { exact: true })).toBeVisible();
  });

  test("renders recovered topic 038 from its exact Version 2 source plate", async ({ page, request }) => {
    const itemId = "spk-bank-p3-gdrive_spk_p3_038";
    const response = await request.get(`/api/speaking/practice-bank?part=3&itemId=${itemId}`);
    expect(response.ok()).toBeTruthy();
    const item = (await response.json()).data.item as Record<string, any>;
    expect(item.availability).toBe("available");
    expect(item.imageA).toBeTruthy();
    expect(item.imageB).toBeTruthy();
    expect(item.sourceEvidence.sourceRelationshipStatus).toBe("VERIFIED");
    expect(item.sourceEvidence.imagePairRecovery.sourcePlacement.imageCid).toBe("s-blob-v1-IMAGE-9wHJPoUFATE");
    expect(item.sourceEvidence.imagePairRecovery.sourcePlacement.documentPosition).toBe(6636);

    await page.goto(`/practice/speaking/part3?bank=canonical&itemId=${itemId}`, { waitUntil: "networkidle" });
    const images = page.getByTestId("speaking-image");
    await expect(images).toHaveCount(2);
    for (const image of await images.all()) {
      await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth), { timeout: 10000 }).toBeGreaterThan(0);
      expect((await request.get(await image.getAttribute("src") || "")).status()).toBe(200);
    }
    await expect(page.getByText("Ảnh 1: Image A", { exact: true })).toBeVisible();
    await expect(page.getByText("Ảnh 2: Image B", { exact: true })).toBeVisible();
  });

  test("browser-renders every recovered Part 3 pair", async ({ page }) => {
    test.setTimeout(180_000);
    const recoveredIds = [
      36, 37, 38, 40, 43, 48, 50, 51, 52, 53, 54, 58, 59, 60, 61, 62, 63, 64,
    ].map((number) => `spk-bank-p3-gdrive_spk_p3_${String(number).padStart(3, "0")}`);
    for (const itemId of recoveredIds) {
      await page.goto(`/practice/speaking/part3?bank=canonical&itemId=${itemId}`, { waitUntil: "networkidle" });
      const images = page.getByTestId("speaking-image");
      await expect(images, `${itemId} must render Image A and Image B`).toHaveCount(2);
      for (const image of await images.all()) {
        await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth), { timeout: 10000 }).toBeGreaterThan(0);
      }
    }
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
