import assert from "node:assert/strict";
import http from "node:http";
import { spawn, ChildProcess } from "node:child_process";
import { prepareAICoachContext } from "../lib/recommendations";

const PORT = 3128;
const BASE_URL = `http://localhost:${PORT}`;

function waitForServer(url: string, timeoutMs: number = 30000): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode && res.statusCode < 500) {
            resolve();
          } else {
            retry();
          }
        })
        .on("error", () => {
          retry();
        });
    };

    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server at ${url} failed to start within ${timeoutMs}ms`));
      } else {
        setTimeout(check, 500);
      }
    };

    check();
  });
}

async function fetchRoute(
  routePath: string,
  options?: RequestInit
): Promise<{ status: number; text: string; json?: any; headers: Headers }> {
  const url = `${BASE_URL}${routePath}`;
  const res = await fetch(url, { redirect: "manual", ...options });
  const text = await res.text();
  let json: any = undefined;
  try {
    json = JSON.parse(text);
  } catch {
    // text only
  }
  return { status: res.status, text, json, headers: res.headers };
}

export async function runProductionSmokeTest() {
  console.log("==================================================");
  console.log("▶ STARTING LIVE PRODUCTION SERVER SMOKE TEST (PORT 3128)");
  console.log("==================================================");

  let serverProcess: ChildProcess | null = null;

  try {
    // 1. Launch Next.js production server with shell: true for cross-platform support
    serverProcess = spawn("npx", ["next", "start", "-p", String(PORT)], {
      cwd: process.cwd(),
      shell: true,
      stdio: "pipe",
      // Explicitly isolate this local production build from project user
      // fixtures. This flag is honored only by the smoke harness; a normal
      // production deployment still requires DATABASE_URL and AUTH_SECRET.
      env: {
        ...process.env,
        ALLOW_MEMORY_STORE: "true",
        E2E_MEMORY_ONLY: "true",
        AUTH_SECRET: process.env.AUTH_SECRET || "local-smoke-only-secret",
      },
    });

    serverProcess.stdout?.on("data", () => {});
    serverProcess.stderr?.on("data", (d) => {
      const errStr = d.toString();
      if (!errStr.includes("ExperimentalWarning") && !errStr.includes("notice")) {
        console.error(`[Server stderr]: ${errStr}`);
      }
    });

    // Wait for server to become responsive
    await waitForServer(`${BASE_URL}/api/tests/aptis-b2-01`);
    console.log("✓ Production server is healthy and responding at", BASE_URL);

    // ----------------------------------------------------
    // 2. Public Web Routes
    // ----------------------------------------------------
    console.log("\n--- Testing Public Web Routes ---");

    // 2.1 Landing Page
    {
      const res = await fetchRoute("/");
      assert.equal(res.status, 200, "Landing page should return 200");
      assert.ok(res.text.includes("WebAptis B2"), "Landing page must contain brand title");
      console.log("  ✓ GET / (Landing Page) — 200 OK");
    }

    // 2.2 Login Page
    {
      const res = await fetchRoute("/login");
      assert.equal(res.status, 200, "Login page should return 200");
      assert.ok(res.text.includes("Đăng nhập") || res.text.includes("WebAptis"));
      console.log("  ✓ GET /login (Login Page) — 200 OK");
    }

    // 2.3 Register Page
    {
      const res = await fetchRoute("/register");
      assert.equal(res.status, 200, "Register page should return 200");
      assert.ok(res.text.includes("Tạo tài khoản") || res.text.includes("WebAptis"));
      console.log("  ✓ GET /register (Register Page) — 200 OK");
    }

    // 2.4 Health Check Endpoint
    {
      const res = await fetchRoute("/api/health");
      assert.equal(res.status, 200, "Health check should return 200");
      assert.equal(res.json?.status, "healthy");
      assert.equal(res.json?.checks?.knowledgeBrain, "compiled_ready");
      console.log("  ✓ GET /api/health (Health Check & Diagnostics) — 200 OK");
    }

    // ----------------------------------------------------
    // 3. Middleware Route Protection Tests (Unauthenticated)
    // ----------------------------------------------------
    console.log("\n--- Testing Route Protection Middleware (Unauthenticated) ---");

    {
      const res = await fetchRoute("/dashboard");
      assert.ok(
        res.status === 307 || res.status === 302 || res.status === 308,
        `Unauthenticated /dashboard should redirect, got ${res.status}`
      );
      const location = res.headers.get("location");
      assert.ok(location?.includes("/login"), "Must redirect to /login");
      console.log("  ✓ GET /dashboard (Unauthenticated) -> 307 Redirect to /login");
    }

    {
      const res = await fetchRoute("/coach");
      assert.ok(
        res.status === 307 || res.status === 302 || res.status === 308,
        `Unauthenticated /coach should redirect, got ${res.status}`
      );
      console.log("  ✓ GET /coach (Unauthenticated) -> 307 Redirect to /login");
    }

    // ----------------------------------------------------
    // 4. Authentication Flow & Authenticated Routes
    // ----------------------------------------------------
    console.log("\n--- Testing Auth Flow & Authenticated Routes ---");

    const testEmail = `smoke_user_${Date.now()}@aptis.edu.vn`;
    let sessionCookie = "";

    // 4.1 Register user
    {
      const res = await fetchRoute("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Smoke Test Candidate",
          email: testEmail,
          password: "password123#",
        }),
      });
      assert.equal(res.status, 201, "Registration should return 201");
      assert.equal(res.json?.success, true);
      assert.equal(res.json?.data?.email, testEmail.toLowerCase());

      const rawCookie = res.headers.get("set-cookie") || "";
      assert.ok(rawCookie.includes("aptis_session="), "Must set aptis_session cookie");
      sessionCookie = rawCookie.split(";")[0];
      console.log("  ✓ POST /api/auth/register — 201 Created (Session Cookie Received)");
    }

    // 4.2 Verify /api/auth/me with session cookie
    {
      const res = await fetchRoute("/api/auth/me", {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(res.status, 200, "Current user query should return 200");
      assert.equal(res.json?.success, true);
      assert.equal(res.json?.data?.email, testEmail.toLowerCase());
      console.log("  ✓ GET /api/auth/me — 200 OK (Authenticated User Verified)");
    }

    // 4.3 Authenticated Dashboard
    {
      const res = await fetchRoute("/dashboard", {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(res.status, 200, "Authenticated dashboard should return 200");
      assert.ok(res.text.includes("Tổng quan") || res.text.includes("WebAptis"));
      console.log("  ✓ GET /dashboard (Authenticated) — 200 OK");
    }

    // 4.4 Authenticated Practice Hub
    {
      const res = await fetchRoute("/practice", {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(res.status, 200, "Authenticated practice hub should return 200");
      console.log("  ✓ GET /practice (Authenticated) — 200 OK");
    }

    // 4.4.1 Dynamic Practice Route with testId (Reading Part 1, Test 05)
    {
      const res = await fetchRoute("/practice/reading/part1?testId=aptis-b2-05", {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(res.status, 200, "Practice route with testId=aptis-b2-05 should return 200");
      console.log("  ✓ GET /practice/reading/part1?testId=aptis-b2-05 — 200 OK");
    }

    // 4.4.2 Dynamic Practice Route with testId (Listening Part 1, Test 08)
    {
      const res = await fetchRoute("/practice/listening/part1?testId=aptis-b2-08", {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(res.status, 200, "Practice route with testId=aptis-b2-08 should return 200");
      console.log("  ✓ GET /practice/listening/part1?testId=aptis-b2-08 — 200 OK");
    }

    // 4.5 Authenticated Mock Test Hub
    {
      const res = await fetchRoute("/mock-test", {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(res.status, 200, "Authenticated mock test hub should return 200");
      console.log("  ✓ GET /mock-test (Authenticated) — 200 OK");
    }

    // 4.5.1 Mock Test Session Route (Test 12)
    {
      const res = await fetchRoute("/mock-test/session/aptis-b2-12", {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(res.status, 200, "Mock test session route with testId=aptis-b2-12 should return 200");
      console.log("  ✓ GET /mock-test/session/aptis-b2-12 — 200 OK");
    }

    // 4.5.2 Static Audio Streaming Check (Test 08)
    {
      const res = await fetchRoute("/audio/listening/aptis-b2-08.mp3");
      assert.equal(res.status, 200, "Audio streaming should return 200");
      const contentType = res.headers.get("content-type") || "";
      assert.ok(contentType.includes("audio") || contentType.includes("mpeg"), `Audio content-type expected, got ${contentType}`);
      console.log("  ✓ GET /audio/listening/aptis-b2-08.mp3 — 200 OK (Audio Stream Verified)");
    }

    // 4.6 Authenticated AI Coach
    {
      const res = await fetchRoute("/coach", {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(res.status, 200, "Authenticated AI Coach should return 200");
      console.log("  ✓ GET /coach (Authenticated) — 200 OK");
    }

    // ----------------------------------------------------
    // 5. API Routes Smoke Tests
    // ----------------------------------------------------
    console.log("\n--- Testing API Route Handlers ---");

    // 5.1 Public Dataset API
    {
      const res = await fetchRoute("/api/tests/aptis-b2-01");
      assert.equal(res.status, 200);
      assert.equal(res.json?.success, true);
      assert.equal(res.json?.data?.metadata?.testId, "aptis-b2-01");
      // Verify anti-leak: no private answers
      assert.equal(res.text.includes("correctOption"), false);
      assert.equal(res.text.includes("correctSequence"), false);
      console.log("  ✓ GET /api/tests/aptis-b2-01 — 200 OK (Anti-Leak Verified)");
    }

    // 5.2 Deterministic Grading API
    {
      const res = await fetchRoute("/api/grade/deterministic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId: "aptis-b2-01",
          skill: "grammarVocabulary",
          answers: { g_01: "A" },
        }),
      });
      assert.equal(res.status, 401);
      assert.equal(res.json?.success, false);
      console.log("  ✓ POST /api/grade/deterministic — 401 Unauthorized (Anonymous grading blocked)");
    }

    // 5.3 AI Writing Grading API boundary
    {
      const res = await fetchRoute("/api/grade/writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invalid: true }),
      });
      assert.equal(res.status, 401);
      console.log("  ✓ POST /api/grade/writing — 401 Unauthorized (Anonymous grading blocked)");
    }

    // 5.4 AI Speaking Grading API boundary
    {
      const res = await fetchRoute("/api/grade/speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invalid: true }),
      });
      assert.equal(res.status, 401);
      console.log("  ✓ POST /api/grade/speaking — 401 Unauthorized (Anonymous grading blocked)");
    }

    // 5.5 AI Coach Chat API boundary
    {
      const res = await fetchRoute("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invalid: true }),
      });
      assert.equal(res.status, 401);
      console.log("  ✓ POST /api/coach/chat — 401 Unauthorized (Anonymous AI access blocked)");
    }

    // 5.5.1 A valid session must pass the Coach authentication boundary and
    // complete the real provider path when the local production-like server
    // has its configured Gemini provider available.
    {
      const res = await fetchRoute("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: sessionCookie },
        body: JSON.stringify({
          userMessage: "Cho tôi một mẹo ngắn để cải thiện Reading Part 4.",
          coachContext: prepareAICoachContext([]),
          history: [],
        }),
      });
      assert.equal(res.status, 200, `Authenticated Coach request should return 200, got ${res.status}`);
      assert.equal(res.json?.success, true);
      assert.equal(typeof res.json?.data?.message, "string");
      assert.ok(res.json?.data?.message.length > 0, "Coach response must contain a message");
      console.log("  ✓ POST /api/coach/chat — authenticated real provider request returned 200");
    }

    // 5.6 User Progress API (Authenticated)
    {
      const res = await fetchRoute("/api/user/progress", {
        headers: { Cookie: sessionCookie },
      });
      assert.equal(res.status, 200);
      assert.equal(res.json?.success, true);
      console.log("  ✓ GET /api/user/progress — 200 OK (Progress Sync API Verified)");
    }

    // 5.7 Logout API
    {
      const res = await fetchRoute("/api/auth/logout", {
        method: "POST",
        headers: { Cookie: sessionCookie },
      });
      assert.equal(res.status, 200);
      assert.equal(res.json?.success, true);
      console.log("  ✓ POST /api/auth/logout — 200 OK (Session Cleared)");
    }

    // Reusing the old credential after logout must fail closed at both the
    // durable-session and Coach API boundaries.
    {
      const me = await fetchRoute("/api/auth/me", { headers: { Cookie: sessionCookie } });
      assert.equal(me.status, 401, "Old credential must be rejected by /api/auth/me after logout");
      assert.match(
        me.headers.get("set-cookie") || "",
        /aptis_session=.*Max-Age=0/i,
        "Invalid session response must clear the stale auth cookie",
      );

      const coach = await fetchRoute("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: sessionCookie },
        body: JSON.stringify({ invalid: true }),
      });
      assert.equal(coach.status, 401, "Old credential must be rejected by Coach after logout");
      assert.equal(coach.json?.code, "AUTHENTICATION_REQUIRED");
      console.log("  ✓ Reused post-logout credential — 401 at /api/auth/me and /api/coach/chat");
    }

    console.log("\n==================================================");
    console.log("🎉 ALL LIVE PRODUCTION SMOKE TESTS PASSED!");
    console.log("==================================================");
  } finally {
    // 4. Terminate test server
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

if (process.argv[1]?.endsWith("production-smoke-test.ts")) {
  runProductionSmokeTest()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Smoke test failed:", err);
      process.exit(1);
    });
}
