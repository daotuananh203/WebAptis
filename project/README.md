# WebAptis B2 — British Council Aptis ESOL General Practice Web App

An intelligent, full-featured web application designed for candidates preparing for the **British Council Aptis ESOL General (CEFR Level B2)** examination.

---

## 🌟 Key Capabilities & Features

1. **Official Aptis ESOL General Format (5 Components):**
   - **Grammar & Vocabulary (25m):** 25 discrete grammar questions + 5 vocabulary sets (synonyms, collocations, definitions).
   - **Reading (35m):** 4 parts (Sentence completion, text cohesion ordering, opinion matching, matching headings).
   - **Listening (40m):** 4 audio parts with up to 2 playbacks per track.
   - **Writing (50m):** 4 parts (Personal form, short personal text, social network chat, formal/informal email).
   - **Speaking (12m):** 4 multimodal audio parts (Personal questions, 1-photo description, 2-photo comparison, abstract topic presentation).

2. **Dual-Engine Assessment:**
   - **Deterministic Grading Engine:** Evaluates objective skills (G/V, Reading, Listening) with exact point calculation on the server against private answer keys.
   - **Multimodal AI Grading Engine (Google Gemini 3.7 Flash):** Evaluates subjective tasks (Writing & Speaking) with register checking, word-count validation, grammar correction, pronunciation, fluency, and CEFR B2 scaled scores.

3. **Learning Analytics & Progress Engine:**
   - Real-time accuracy metrics and per-component performance tracking.
   - 12-week (84-day) visual activity heatmap.
   - Daily streak tracking with grace-period calculation.
   - Automated detection of critical ($<55\%$) and moderate ($55\text{--}69\%$) weak areas.

4. **AI Coach Conversational Advisor:**
   - Personalized study advisor interpreting candidate statistics and active recommendations.
   - Prompt-injection defense and anti-hallucination guardrails.

5. **Full Mock Test Simulation Room:**
   - Independent section countdown timers (not a single global timer).
   - Sequential section locking (cannot revisit completed sections).
   - Autosave draft & resume capability after browser refresh.
   - Consolidated 5-skill score report with CEFR estimation.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ (Tested on Node.js v24.16.0)
- npm or yarn

### Installation
```bash
cd project
npm install
```

### Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your Google Gemini API key:
```env
GEMINI_API_KEY="your-google-gemini-api-key-here"
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Local Production Build & Run
```bash
# Build optimized production bundle
npm run build

# Start production server
npm run start
```

### Live Production Smoke Test
```bash
npm run smoke-test
```

---

## 🧪 Testing & Verification

Run the comprehensive test suite (13 automated test suites):
```bash
npm test
```

Type checking:
```bash
npm run typecheck
```

---

## ☁️ Vercel Deployment Guide

WebAptis B2 is fully optimized for standard zero-configuration deployment on **Vercel**:

1. **Import Repository:** Connect your repository to Vercel.
2. **Framework Preset:** Select **Next.js**.
3. **Root Directory:** Set root directory to `project` (if deployed from monorepo/subfolder) or root.
4. **Environment Variables:** Add `GEMINI_API_KEY` in Project Settings -> Environment Variables.
5. **Deploy:** Click **Deploy**. All route handlers, static pages, and client-side storage will be automatically provisioned.

---

## ⚠️ Current Scope & Limitations

1. **Client Storage:** Progress history and active drafts are persisted in the browser via `localStorage` (Web Storage API). Clearing browser data resets local session history.
2. **Gemini Live / Realtime API:** Live audio streaming is not utilized in this MVP. Speaking assessment uses standard multimodal Gemini audio upload ($<10\text{MB}$).
3. **Official Disclaimer:** All scores, band estimates, and AI evaluations are educational estimates for exam preparation purposes.

> **PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE.**

---

## 🔒 Security & Privacy

- **Server-Side Key Protection:** API keys and private answer keys are never bundled into client browser code.
- **Client Storage Resilience:** Progress history and draft sessions are managed client-side with an in-memory fallback for SSR.
- **Prompt Injection Hardening:** Candidate inputs are strictly encapsulated in tagged delimiters to prevent system instruction overrides.
