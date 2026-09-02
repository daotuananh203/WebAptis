import { test, expect } from "@playwright/test";

async function registerBrowserUser(page: import("@playwright/test").Page) {
  const email = `codex-browser-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`;
  await page.goto("/register", { waitUntil: "networkidle" });
  await page.getByLabel("Họ và tên").fill("Codex Browser QA");
  await page.getByLabel("Địa chỉ Email").fill(email);
  await page.getByLabel("Mật khẩu (tối thiểu 6 ký tự)").fill("BrowserPass123!");
  await page.getByLabel("Xác nhận mật khẩu").fill("BrowserPass123!");
  await page.getByRole("button", { name: "Đăng ký ngay" }).click();
  await page.waitForURL(/\/dashboard/);
}

test("remediation browser smoke covers auth, labels, mobile nav and safe states", async ({ page }) => {
  await registerBrowserUser(page);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileNav = page.getByRole("navigation", { name: "Điều hướng chính di động" });
  await expect(mobileNav).toBeVisible();
  await expect(page.getByRole("button", { name: "Toggle navigation menu" })).toBeVisible();

  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(horizontalOverflow).toBe(false);

  const homeLink = page.getByRole("link", { name: "Trang chủ", exact: true }).first();
  const historyLink = page.getByRole("link", { name: "Lịch sử làm bài", exact: true }).first();
  await expect(homeLink).toHaveClass(/emerald/);
  await expect(historyLink).not.toHaveClass(/emerald/);

  await page.goto("/settings", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Cài đặt" })).toBeVisible();

  await page.goto("/practice?skill=listening", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Đề Listening" })).toBeVisible();
  await expect(page.getByText(/đề nghe/).first()).toBeVisible();

  await page.goto("/practice/reading/part1?testId=not-a-real-test", { waitUntil: "networkidle" });
  await expect(page.getByText("Không tải được nội dung bài luyện")).toBeVisible();

  await page.goto("/mock-test/session/aptis-b2-01", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Xong phần này" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog.getByRole("button", { name: "Đóng hộp thoại" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
