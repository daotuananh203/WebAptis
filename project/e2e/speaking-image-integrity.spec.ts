import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const auditBaseUrl = process.env.SPEAKING_AUDIT_BASE_URL ?? "http://localhost:3128";
const testIds = [
  ...Array.from({ length: 16 }, (_, index) => `aptis-b2-${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 7 }, (_, index) => `aptis-4skills-${String(index + 1).padStart(2, "0")}`),
];

type SpeakingPartImageExpectation = {
  part2: string;
  part3: [string, string];
};

function expectedSpeakingImages(testId: string): SpeakingPartImageExpectation {
  const datasetPath = path.join(process.cwd(), "data", "tests", `${testId}-public.json`);
  const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
  const part2 = dataset.speaking.parts.find((part: { partNumber: number }) => part.partNumber === 2);
  const part3 = dataset.speaking.parts.find((part: { partNumber: number }) => part.partNumber === 3);

  expect(part2?.imageUrl, `${testId} Part 2 image source`).toMatch(/^\/images\/speaking\//);
  expect(part3?.images?.image1Url, `${testId} Part 3 Image A source`).toMatch(/^\/images\/speaking\//);
  expect(part3?.images?.image2Url, `${testId} Part 3 Image B source`).toMatch(/^\/images\/speaking\//);

  return {
    part2: part2.imageUrl,
    part3: [part3.images.image1Url, part3.images.image2Url],
  };
}

test.use({ baseURL: auditBaseUrl });

test.describe("Speaking Part 2/3 source-backed image integrity", () => {
  test("renders all 69 declared source-backed images in browser order for every catalog test", async ({ page, context }) => {
    test.setTimeout(240_000);
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

    for (const testId of testIds) {
      const expected = expectedSpeakingImages(testId);

      await page.goto(`/practice/speaking/part2?testId=${testId}`, { waitUntil: "domcontentloaded" });
      const part2Image = page.getByTestId("speaking-image");
      await expect(part2Image).toHaveCount(1);
      await expect(part2Image).toBeVisible();
      await expect(part2Image).toHaveAttribute("src", expected.part2);
      await expect(part2Image).toHaveAttribute("data-image-src", expected.part2);
      await expect.poll(
        () => part2Image.evaluate((element) => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0),
        { timeout: 15_000 },
      ).toBeTruthy();
      await expect(page.getByTestId("speaking-image-unavailable")).toHaveCount(0);

      await page.goto(`/practice/speaking/part3?testId=${testId}`, { waitUntil: "domcontentloaded" });
      const part3Images = page.getByTestId("speaking-image");
      await expect(part3Images).toHaveCount(2);
      for (const [index, image] of (await part3Images.all()).entries()) {
        await expect(image).toBeVisible();
        await expect(image).toHaveAttribute("src", expected.part3[index]);
        await expect(image).toHaveAttribute("data-image-src", expected.part3[index]);
        await expect.poll(
          () => image.evaluate((element) => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0),
          { timeout: 15_000 },
        ).toBeTruthy();
      }
      await expect(page.getByTestId("speaking-image-unavailable")).toHaveCount(0);
    }

    const expectedUrls = testIds.flatMap((testId) => {
      const expected = expectedSpeakingImages(testId);
      return [expected.part2, ...expected.part3];
    });
    expect(expectedUrls).toHaveLength(69);

    for (const expectedUrl of expectedUrls) {
      const responses = imageResponses.filter((response) => new URL(response.url).pathname === expectedUrl);
      expect(responses, `browser requested ${expectedUrl}`).not.toHaveLength(0);
      expect(responses.some((response) => response.status === 200)).toBeTruthy();
      expect(responses.some((response) => response.contentType.startsWith("image/"))).toBeTruthy();
    }
  });
});
