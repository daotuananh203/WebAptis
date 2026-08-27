import { test, expect } from "@playwright/test";

const auditBaseUrl = process.env.SPEAKING_AUDIT_BASE_URL ?? "http://localhost:3128";

test.use({ baseURL: auditBaseUrl });

test.describe("Speaking reconstructed source image integrity", () => {
  test("renders every standard Part 2/3 source-backed image in Chromium", async ({ page, context }) => {
    test.setTimeout(120_000);
    const email = `speaking_image_${Date.now()}_${Math.floor(Math.random() * 10000)}@aptis.edu.vn`;
    const register = await page.request.post("/api/auth/register", {
      data: { email, password: "Password123!", name: "Speaking Image Audit" },
    });
    expect(register.ok()).toBeTruthy();

    const cookieHeader = register.headers()["set-cookie"];
    const cookieMatch = cookieHeader?.match(/aptis_session=([^;]+)/);
    if (cookieMatch) {
      await context.addCookies([
        { name: "aptis_session", value: cookieMatch[1], url: auditBaseUrl },
      ]);
    }

    const imageResponses: Array<{ url: string; status: number; contentType: string }> = [];
    page.on("response", (response) => {
      if (response.url().includes("/images/speaking/")) {
        imageResponses.push({
          url: response.url(),
          status: response.status(),
          contentType: response.headers()["content-type"] ?? "",
        });
      }
    });

    for (let testNumber = 1; testNumber <= 16; testNumber += 1) {
      const testId = `aptis-b2-${testNumber.toString().padStart(2, "0")}`;

      await page.goto(`/practice/speaking/part2?testId=${testId}`, { waitUntil: "domcontentloaded" });
      const part2Image = page.getByTestId("speaking-image");
      await expect(part2Image).toHaveCount(1);
      await expect(part2Image).toBeVisible();
      await expect.poll(
        () => part2Image.evaluate((element) => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0),
        { timeout: 15_000 },
      ).toBeTruthy();
      expect(await part2Image.getAttribute("src")).toMatch(/^\/images\/speaking\/(gdrive|reconstructed)\//);

      await page.goto(`/practice/speaking/part3?testId=${testId}`, { waitUntil: "domcontentloaded" });
      const part3Images = page.getByTestId("speaking-image");
      await expect(part3Images).toHaveCount(2);
      for (const image of await part3Images.all()) {
        await expect(image).toBeVisible();
        await expect.poll(
          () => image.evaluate((element) => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0),
          { timeout: 15_000 },
        ).toBeTruthy();
        expect(await image.getAttribute("src")).toMatch(/^\/images\/speaking\/(gdrive|reconstructed)\//);
      }
    }

    expect(imageResponses.length).toBe(48);
    expect(imageResponses.every((response) => response.status === 200)).toBeTruthy();
    expect(imageResponses.every((response) => response.contentType.startsWith("image/"))).toBeTruthy();
  });
});
