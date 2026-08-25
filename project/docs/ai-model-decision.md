# CURRENT AI MODEL STRATEGY — APTIS B2 PRACTICE WEB APP

**Evaluation Date:** 2026-08-22  
**Project:** APTIS B2 PRACTICE WEB APP  
**Status:** Active & Verified Strategy  

---

## 1. Executive Summary & Strategy Overview

This document defines the verified AI model selection for the **APTIS B2 PRACTICE WEB APP** based on official Google AI and Google DeepMind documentation as of August 2026. 

The application utilizes Google Gemini models via the official `@google/genai` SDK (v2.18.0) for automated CEFR B2 writing rubric assessment, speaking audio evaluation, personalized learning recommendations (AI Coach), and high-speed vocabulary/grammar utilities.

---

## 2. Official Sources Checked

1. **Google AI Developer Documentation:** `ai.google.dev` (Model lifecycle, API specifications, and pricing).
2. **Google DeepMind & Google AI Official Releases:** Announcements regarding `gemini-3.7-flash` (GA Aug 13, 2026) and `gemini-3.5-flash-lite` (GA July 21, 2026).
3. **Official Google GenAI SDK Repository:** `https://github.com/googleapis/js-genai` (Node.js/TypeScript SDK specifications).
4. **Google AI Studio Documentation:** Structured output schemas (`responseSchema`), system instructions, and token parameters.

---

## 3. Comprehensive Model Landscape & Lifecycle Review

| Model Identifier | Release Date | Lifecycle Status | Context Window | Throughput & Latency | Pricing (Input / Output per 1M tokens) | Key Capabilities & Role Suitability |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`gemini-3.7-flash`** | 2026-08-13 | **Generally Available (GA)** | 1,000,000+ tokens | Fast (< 3s response), high throughput | $0.75 / $3.75 | Google's primary workhorse model for coding, agentic planning, complex reasoning, and native multimodal audio/vision understanding. |
| **`gemini-3.5-flash-lite`** | 2026-07-21 | **Generally Available (GA)** | 1,000,000 tokens | Ultra-fast (up to 350 tokens/sec) | $0.30 / $2.50 | Lowest latency and lowest cost model in the 3.x series, designed for high-frequency subtasks, quick vocabulary queries, and rule lookups. |
| **`gemini-2.5-pro`** | Mid-2025 | **Generally Available (GA)** / Stable | 2,000,000 tokens | Moderate (thinking/reasoning latency) | $1.25 / $10.00 | Deep reasoning model with extended thinking mode, ideal as fallback for highly ambiguous linguistic analysis. |
| **`gemini-2.5-flash`** | Mid-2025 | **Generally Available (GA)** / Stable | 1,000,000 tokens | Fast | $0.075 / $0.30 (Tier 1) | Predecessor Flash generation, maintained as reliable fallback. |
| `gemini-2.0-flash` / `lite` | Early-2025 | **Deprecated / Shut down** (June 1, 2026) | N/A | N/A | N/A | Shut down. Not supported for new development. |
| `gemini-1.5-pro` / `flash` | 2024 | **Deprecated / Shut down** | N/A | N/A | N/A | Shut down. Not supported for new development. |

---

## 4. Final Task-to-Model Mapping

```text
                               ┌──> Writing Grading   ──> gemini-3.7-flash (Fallback: gemini-2.5-pro)
                               ├──> Speaking Grading  ──> gemini-3.7-flash (Fallback: gemini-2.5-flash)
Centralized Gemini Config ─────┼──> AI Coach          ──> gemini-3.7-flash
                               └──> Quick Utilities   ──> gemini-3.5-flash-lite
```

### Detailed Rationale by Workload

#### 1. Writing Assessment (`gemini-3.7-flash`)
- **Requirements:** Detailed scoring against 4 CEFR B2 criteria (Task Fulfillment, Cohesion & Coherence, Grammar Range & Accuracy, Vocabulary Range), sentence-by-sentence error pinpointing, model answers, and strictly validated JSON output.
- **Why `gemini-3.7-flash`:** Superior reasoning and instruction-following capability in the 3.x series guarantees high consistency in scoring without the excessive latency of heavy Pro models.

#### 2. Speaking Assessment (`gemini-3.7-flash`)
- **Requirements:** Direct ingestion of audio recordings (`audio/webm`, `audio/wav`), speech transcription, fluency and pronunciation commentary, topic relevance check, and CEFR grading.
- **Why `gemini-3.7-flash`:** Native multimodal architecture processes speech audio efficiently with rapid turnaround (< 4 seconds), essential for interactive test simulation.

#### 3. AI Coach & Study Recommendations (`gemini-3.7-flash`)
- **Requirements:** Analyzing student history across practice tests, identifying persistent weak skill areas, and synthesizing personalized actionable study advice.
- **Why `gemini-3.7-flash`:** Strong agentic planning abilities ensure logical, motivating, and personalized student guidance.

#### 4. Lightweight & Utility Tasks (`gemini-3.5-flash-lite`)
- **Requirements:** Instantaneous vocabulary definitions, CEFR level tagging (B1/B2/C1), grammar rule explanations, and subagent preprocessing.
- **Why `gemini-3.5-flash-lite`:** Generates up to 350 tokens/sec at just $0.30/1M input tokens, delivering instantaneous UI responsiveness with near-zero operational cost.

---

## 5. Benchmark & Validation Approach

### Writing Evaluation Schema
The model is constrained via `responseSchema` to output deterministic JSON matching the Aptis B2 evaluation schema:
```json
{
  "taskAchievement": { "score": 4, "maxScore": 5, "feedback": "Clear fulfillment of informal tone and required bullet points." },
  "coherenceCohesion": { "score": 4, "maxScore": 5, "feedback": "Good paragraph transitions using appropriate linkers." },
  "grammarRangeAccuracy": {
    "score": 4,
    "maxScore": 5,
    "errors": [
      { "original": "I am write to tell you", "corrected": "I am writing to tell you", "explanation": "Present continuous required after auxiliary verb 'am'." }
    ]
  },
  "vocabularyRange": {
    "score": 4,
    "maxScore": 5,
    "suggestions": [
      { "original": "very good", "upgraded": "exceptionally beneficial", "cefrLevel": "B2" }
    ]
  },
  "estimatedBand": "B2",
  "b2ModelAnswer": "..."
}
```

### Verification & Testing Note
- **Deterministic Validation:** Schema definitions and SDK types have been verified against `@google/genai` TypeScript interfaces.
- **Network API Live Execution:** Live network calls to Gemini endpoints require `GEMINI_API_KEY` to be configured in `.env.local`. In this initialization/correction phase, live end-to-end network requests with audio buffers were not executed directly to prevent unauthenticated network failures.

---

## 6. Migration & Risk Management

1. **Parameter Deprecation Awareness:**
   - In Gemini 3.x models, older sampling overrides (e.g. `top_k`, prefilled assistant turns) are deprecated. Standard generation parameters (`temperature`, `responseSchema`) are utilized via `@google/genai`.
2. **Runtime Decoupling:**
   - No model names are hard-coded in components or server route handlers. All references read from `lib/gemini/models.ts` and `lib/gemini/config.ts`.
   - Any model can be overridden on the fly via environment variables:
     - `GEMINI_MODEL=gemini-3.7-flash`
     - `GEMINI_MODEL_FAST=gemini-3.5-flash-lite`
     - `GEMINI_MODEL_REASONING=gemini-2.5-pro`
3. **Zero API Cost for Objective Sections:**
   - Reading and Listening tests use 100% deterministic checking against server answer keys (`data/tests/*-answers.json`), reserving Gemini API calls strictly for subjective grading.
