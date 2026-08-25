# WebAptis B2 Practice Web App — Complete System Architecture

**Document Version:** 1.1.0 (Production Verified)  
**Target Examination:** British Council Aptis ESOL General (CEFR Level B2)  
**Model Strategy:** Google Gemini 3.7 Flash (`gemini-3.7-flash` GA)  
**Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Web Storage API  
**Deployment Target:** Vercel Serverless / Node.js Production Server  

---

## 1. Architectural Overview & Design Philosophy

WebAptis B2 is an independent, highly resilient web application tailored for candidates preparing for the British Council Aptis ESOL General B2 exam.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER (Next.js 16)                    │
│  Landing (/) │ Dashboard (/dashboard) │ Practice (/practice) │ Mock (/mock) │
├─────────────────────────────────────────────────────────────────────────────┤
│                          STATE & STORAGE LAYER                              │
│  usePracticeSession │ LocalStorageAdapter │ MemoryStorageAdapter (SSR safe)  │
├─────────────────────────────────────────────────────────────────────────────┤
│                          DOMAINS & CORE ENGINES                             │
│  Progress Engine    │ Recommendation Engine │ AI Coach Advisor (Gemini 3.7) │
├─────────────────────────────────────────────────────────────────────────────┤
│                          GRADING ENGINES (Server-Side)                      │
│  Deterministic Engine (G/V, R, L) │ Multimodal AI Grader (Writing, Speaking)│
├─────────────────────────────────────────────────────────────────────────────┤
│                          DATASET & SECURITY LAYER                           │
│  Public Dataset (*-public.json)   │ Server Answer Keys (*-answers.json)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Architectural Principles:
1. **Separation of Objective vs. Subjective Assessment:**
   - Grammar & Vocabulary, Reading, and Listening are evaluated deterministically on the server against private answer keys.
   - Writing and Speaking are evaluated via Google Gemini 3.7 Flash using structured outputs, validated strictly by Zod schemas.
2. **Single Source of Truth:**
   - `Progress Engine` is the sole statistical foundation for accuracy, attempts, and streaks.
   - `Recommendation Engine` is the sole deterministic source of study priorities and identified weak areas.
   - `AI Coach` is a conversational advisor that never recalculates stats or hallucinates weaknesses.
3. **Anti-Leak Security:**
   - Private answer keys (`*-answers.json`), system prompts, and Gemini API keys are never bundled into client-side code.
4. **Resilient Client Storage:**
   - Web Storage API (localStorage) with an automatic in-memory fallback during Next.js SSR and private browsing.
5. **Vercel Serverless Alignment:**
   - Zero external binary dependencies; file reading relative to `process.cwd()`; standard stateless Route Handlers.

---

## 2. Component Structure & Data Flow

### 2.1 Exam Data Schemas (`lib/exam/`)
- Public test datasets (`data/tests/aptis-b2-01-public.json`) hold questions, options, stimuli images, and audio URLs.
- Server answer keys (`data/tests/aptis-b2-01-answers.json`) hold private grading keys.

### 2.2 Deterministic Grading Engine (`lib/grading/deterministic.ts`)
- Pure, strongly typed grading functions for:
  - Grammar (25 items) & Vocabulary (5 sets $\times$ 5 prompts).
  - Reading Part 1 (5 gap-fills), Part 2 (sentence ordering), Part 3 (opinion matching), Part 4 (matching headings).
  - Listening Parts 1–4.

### 2.3 AI Grading Engines (`lib/grading/writing-ai.ts` & `speaking-ai.ts`)
- **Writing AI:** Analyzes text submissions with real-time word counting, register validation (formal vs. informal), sentence-level grammar correction, and CEFR B2 scaled scoring (0–50).
- **Speaking AI:** Receives Base64 audio recordings (`<10MB`), verifies audio quality, evaluates pronunciation, fluency, and cohesion across official timings (Part 1: 3x30s; Part 2: 1 photo x 3x45s; Part 3: 2 photos x 3x45s; Part 4: 60s prep + 120s speech).

### 2.4 Progress & Streak Engine (`lib/progress/`)
- Pure calculations for skill accuracy, component metrics, 12-week heatmap grids (84 days), and timezone-safe daily streak tracking.

### 2.5 AI Coach Recommendation Engine (`lib/recommendations/`)
- Deterministic adaptive rules analyzing critical weaknesses ($<55\%$), moderate weaknesses ($55\text{--}69\%$), declining trends, and full mock test readiness ($>70\%$ on all skills).

### 2.6 AI Coach Conversational Advisor (`lib/coach/`)
- Integrates `AICoachContext` with Gemini 3.7 Flash over `/api/coach/chat` to provide empathetic, actionable advice with prompt injection defense (`<user_message>` tagging).

---

## 3. Storage & Session Architecture (`lib/storage/`)

- **Versioning:** Keys versioned under `_v1` (`aptis_b2_progress_history_v1`, `aptis_b2_active_session_v1`, `aptis_b2_active_mock_test_v1`).
- **Autosave & Resume:** Seamless recovery of incomplete practice drills or full mock test sessions (including isolated section timers).
- **Capacity Management:** Deduplication and history capping (last 500 records) to prevent storage quota exhaustion.

---

## 4. API Endpoints & Production Contracts

| Route | Method | Purpose | Protection |
|---|---|---|---|
| `/api/tests/[testId]` | GET | Retrieve sanitized public test dataset | Public |
| `/api/grade/deterministic` | POST | Evaluate G/V, Reading, Listening | Server-side answer key |
| `/api/grade/writing` | POST | Evaluate Writing tasks via Gemini 3.7 Flash | Server-side GEMINI_API_KEY |
| `/api/grade/speaking` | POST | Evaluate Speaking audio via Gemini 3.7 Flash | Server-side GEMINI_API_KEY |
| `/api/coach/chat` | POST | Conversational study coach advisor | Server-side GEMINI_API_KEY |

---

## 5. Official Exam Disclaimer

All scores, band estimates, and AI evaluations are educational estimates for exam preparation purposes.

> **PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE.**
