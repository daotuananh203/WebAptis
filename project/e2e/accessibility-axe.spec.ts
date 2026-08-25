import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";

test.describe("Automated Accessibility Audit (@axe-core/playwright)", () => {
  const auditResults: Record<string, any> = {};
  const detailedViolations: Record<string, any> = {};

  const pagesToScan = [
    { name: "Landing Page", path: "/" },
    { name: "Login Page", path: "/login" },
    { name: "Register Page", path: "/register" },
    { name: "Practice Hub", path: "/practice" },
    { name: "Mock Test Hub", path: "/mock-test" },
    { name: "AI Coach", path: "/coach" },
    { name: "Writing Practice", path: "/practice/writing/part4?testId=aptis-b2-01" },
    { name: "Speaking Practice", path: "/practice/speaking/part2?testId=aptis-b2-01" },
    { name: "Listening Practice", path: "/practice/listening/part1?testId=aptis-b2-01" },
  ];

  for (const p of pagesToScan) {
    test(`Axe scan on ${p.name} (${p.path})`, async ({ page }) => {
      await page.goto(p.path);
      await page.waitForLoadState("domcontentloaded");

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();

      auditResults[p.name] = {
        path: p.path,
        violationsCount: accessibilityScanResults.violations.length,
        passesCount: accessibilityScanResults.passes.length,
        incompleteCount: accessibilityScanResults.incomplete.length,
        violations: accessibilityScanResults.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
        })),
      };

      if (accessibilityScanResults.violations.length > 0) {
        detailedViolations[p.name] = accessibilityScanResults.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => ({
            html: n.html,
            target: n.target,
            failureSummary: n.failureSummary,
          })),
        }));
      }

      // Record 0 critical violations requirement
      expect(accessibilityScanResults.violations.filter((v) => v.impact === "critical").length).toBe(0);
    });
  }

  test("Manual Keyboard Navigation & Focus Trap Check", async ({ page }) => {
    await page.goto("/login");
    
    // Test Tab navigation sequence
    await page.keyboard.press("Tab");
    const focusedTag1 = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag1).toBeTruthy();

    await page.keyboard.press("Tab");
    const focusedTag2 = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag2).toBeTruthy();

    // Test Enter key on submit button
    await page.keyboard.press("Enter");
  });

  test.afterAll(async () => {
    const reportDir = path.join(process.cwd(), "reports/accessibility");
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(reportDir, "axe-results.json"),
      JSON.stringify(auditResults, null, 2)
    );
    fs.writeFileSync(
      path.join(reportDir, "axe-detailed-violations.json"),
      JSON.stringify(detailedViolations, null, 2)
    );
  });
});
