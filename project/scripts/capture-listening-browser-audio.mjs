import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv[2] || "http://localhost:3000";
const outputDir = path.resolve(process.argv[3] || "test-results/listening-browser-forensic");
const targetPath = "/practice/listening/part1?testId=aptis-b2-01";

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ serviceWorkers: "block" });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Network.enable");
await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });

const register = await context.request.post(`${baseUrl}/api/auth/register`, {
  data: {
    email: `listening_browser_${Date.now()}@aptis.edu.vn`,
    password: "Password123!",
    name: "Listening Browser Forensic",
  },
});
if (!register.ok()) throw new Error(`Registration failed: ${register.status()}`);

const network = [];
const bodyTasks = [];
let clickStartedAt = 0;
page.on("request", (request) => {
  if (!clickStartedAt || !request.url().includes("/audio/listening/")) return;
  network.push({
    kind: "request",
    timestamp: Date.now(),
    url: request.url(),
    method: request.method(),
    resourceType: request.resourceType(),
    headers: request.headers(),
  });
});
page.on("response", (response) => {
  if (!clickStartedAt || !response.url().includes("/audio/listening/")) return;
  bodyTasks.push((async () => {
    const entry = {
      kind: "response",
      timestamp: Date.now(),
      url: response.url(),
      status: response.status(),
      headers: await response.allHeaders(),
    };
    try {
      const body = await response.body();
      const index = network.filter((item) => item.kind === "response").length + 1;
      const fileName = `response-${String(index).padStart(2, "0")}.bin`;
      await fs.writeFile(path.join(outputDir, fileName), body);
      entry.bodyFile = fileName;
      entry.bytes = body.length;
      entry.sha256 = crypto.createHash("sha256").update(body).digest("hex");
    } catch (error) {
      entry.bodyError = String(error);
    }
    network.push(entry);
  })());
});

const navigation = await page.goto(`${baseUrl}${targetPath}`, { waitUntil: "networkidle" });
const q1 = page.locator("audio").first();
await q1.scrollIntoViewIfNeeded();
const box = await q1.boundingBox();
if (!box) throw new Error("Q1 audio control has no bounding box");
clickStartedAt = Date.now();
await page.mouse.click(box.x + 18, box.y + box.height / 2);
await page.waitForFunction(() => {
  const audio = document.querySelector("audio");
  return audio instanceof HTMLAudioElement && audio.currentTime > 0.1;
}, null, { timeout: 15_000 });
await page.waitForTimeout(2_500);

const audio = await q1.evaluate((node) => ({
  currentSrc: node.currentSrc,
  srcAttribute: node.getAttribute("src"),
  duration: node.duration,
  currentTime: node.currentTime,
  paused: node.paused,
  readyState: node.readyState,
  networkState: node.networkState,
}));
await q1.evaluate((node) => node.pause());
await Promise.allSettled(bodyTasks);

const report = {
  capturedAt: new Date().toISOString(),
  baseUrl,
  targetUrl: `${baseUrl}${targetPath}`,
  cleanContext: true,
  cacheDisabled: true,
  browser: await browser.version(),
  navigationStatus: navigation?.status(),
  audio,
  network: network.sort((left, right) => left.timestamp - right.timestamp),
};
await fs.writeFile(path.join(outputDir, "browser-audio-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
