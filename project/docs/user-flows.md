# Aptis B2 Practice Web App — User Flows & State Transitions

**Document Version:** 1.0.0  
**Date:** 2026-08-22  
**Role:** Canonical Specification for End-to-End User Journeys  

---

## 1. Master User Journey Map

```text
                               ┌──> Practice Mode (Skill -> Part Drill) ──┐
                               │                                          │
Dashboard ─────────────────────┼──> Mock Test Mode (Full Exam Simulation) ├──> Evaluation ──> Results & AI Coach
(Streak, Heatmap, Today's Goal)│                                          │
                               └──> Vocab / Grammar Review Hub ───────────┘
```

---

## 2. Detailed Step-by-Step User Flows

### Flow 1: Daily Dashboard Flow
```text
Entry: Open Web App (`/dashboard`)
  ↓ Action: System checks last activity timestamp.
  ↓ State: Updates streak counter (increments if active within 24–48h; resets if >48h).
  ↓ Render: Heatmap grid, overall skill accuracy percentages, and "Bài học hôm nay" card.
  ↓ Decision:
      - Option A: Click "Học tiếp bài hôm nay" -> Redirects to recommended practice drill.
      - Option B: Click "Thi thử ngay" -> Redirects to Mock Test selection.
      - Option C: Click specific skill from sidebar -> Enters Practice directory.
Exit: User navigates to chosen learning activity.
```

---

### Flow 2: Skill Practice Flow (Reading / Listening / Grammar)
```text
Entry: Select `/practice/[skill]/[part]`
  ↓ State: Loading public test JSON dataset.
  ↓ Render: Split workspace (Passage/Audio on left, Question interface on right).
  ↓ Action: Candidate interacts with inputs (MCQ, sentence order, matching).
  ↓ Action: Click "Kiểm tra đáp án" (Check Answer).
  ↓ State: Deterministic checking executed instantly.
  ↓ Render:
      - Correct items: Highlighted in green with explanation tooltip.
      - Incorrect items: Highlighted in red showing correct answer and explanation.
      - Score badge: e.g. "4/5 (80%)".
  ↓ Action: Click "Luyện tiếp Part sau" -> Advances to next part, or "Quay về Dashboard".
Exit: Session recorded to local progress history.
```

---

### Flow 3: Writing Practice & AI Evaluation Flow
```text
Entry: Select `/practice/writing/[part]` (e.g. Part 4: Email Writing)
  ↓ Render: Context notice (Club notice), Task prompts, and Markdown/Plain text editor.
  ↓ Action: Candidate types response.
  ↓ State: Live word counter updates dynamically with color-coded feedback:
      - Under min: Amber (`32 / 40–50 words`)
      - Within range: Emerald (`44 / 40–50 words`)
      - Over max: Rose (`62 / 40–50 words`)
  ↓ Action: Click "Chấm bài bằng AI" (Submit for AI Grading).
  ↓ State: Dispatches payload to server Route Handler `/api/grade`.
  ↓ State: Gemini 3.7 Flash analyzes submission using CEFR B2 Rubric schema.
  ↓ Render:
      - CEFR Sub-scores: Task Achievement, Coherence, Grammar, Vocabulary (0–5 each).
      - Estimated Band: e.g. "B2".
      - Sentence-by-sentence error inspector (Original error -> Corrected B2 sentence -> Grammatical rationale).
      - High-scoring B2 Model Answer for comparison.
Exit: Results saved to progress tracker; user prompted to retry or proceed.
```

---

### Flow 4: Speaking Practice & Multimodal Evaluation Flow
```text
Entry: Select `/practice/speaking/[part]`
  ↓ Render: Question prompt, photographic stimuli (for Parts 2, 3, 4), and instructions.
  ↓ State: Preparation Phase (60s countdown timer for Part 4; 0s for Parts 1–3).
  ↓ Action: Preparation timer expires or user clicks "Bắt đầu nói ngay".
  ↓ State: Recording Phase (Microphone auto-activates, visual audio waveform displays).
  ↓ State: Response countdown timer active (30s for Part 1, 45s for Parts 2–3, 120s for Part 4).
  ↓ Action: Response timer finishes -> Auto-stops recording and compiles audio blob.
  ↓ Action: Click "Nộp bài chấm AI".
  ↓ State: Payload sent to `/api/grade` with base64 audio data.
  ↓ Render: Pronunciation clarity score, spoken grammar feedback, topic fulfillment notes, and CEFR estimate.
Exit: Audio review available for candidate playback.
```

---

### Flow 5: Full Mock Test (Exam Simulation) Flow
```text
Entry: Navigate to `/mock-test/session/[testId]`
  ↓ Render: Official Exam Instructions and Equipment Check (Audio & Microphone test).
  ↓ Action: Click "Bắt đầu làm bài" (Start Exam).
  ↓ State: Exam Arena initialized:
      - Master countdown timer starts.
      - Question Palette rendered (Buttons 1 to N, color-coded).
  ↓ Loop:
      - Candidate completes Grammar & Vocab (25m) -> Reading (35m) -> Listening (40m) -> Writing (50m) -> Speaking (12m).
      - Option to flag questions for later review.
      - Listening recordings enforce maximum 2 plays (`maxPlays: 2`).
  ↓ Action: Click "Nộp bài" (Finish Exam) OR Timer hits 00:00.
  ↓ State: Submit Confirmation Modal displays counts of Answered vs. Unanswered items.
  ↓ Action: User confirms submission.
  ↓ State: Grading Pipeline executes (Deterministic evaluation + AI evaluation).
  ↓ Render: Redirects automatically to Comprehensive Scorecard (`/results/[submissionId]`).
Exit: Final test report archived in learner profile.
```
