# Deterministic Grading Engine Architecture & Specification

**Document Version:** 1.0.0  
**Date:** 2026-08-22  
**Target Variant:** Aptis ESOL General / Aptis General (CEFR B2 Preparation)  
**Layer:** Core Domain Scoring Engine (`project/lib/grading/`)  

---

## 1. Executive Summary & Architectural Overview

The **Deterministic Grading Engine** is the pure, strongly typed, server-side evaluation layer for all objective, closed-response components of the Aptis examination:
1. **Grammar & Vocabulary** (50 items total: 25 grammar MCQs + 25 vocabulary matching sets)
2. **Reading** (Parts 1 to 4: Sentence completion, Sentence ordering, Opinion matching, Heading matching)
3. **Listening** (Parts 1 to 4: Information recognition, Speaker matching, Dialogue opinion attribution, Monologues)

It operates independently from the Next.js UI, React hooks, Browser APIs, and the Gemini AI grading pipeline.

```text
┌───────────────────────────────────────────────┐
│              CANDIDATE SUBMISSION             │
│  (Practice Drill OR Full Mock Exam Session)   │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│         SERVER-SIDE SECURITY BOUNDARY         │
│  (Loads private server-side answer keys)      │
│  data/tests/[testId]-answers.json             │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│         DETERMINISTIC GRADING ENGINE          │
│   (Pure functions in lib/grading/deterministic)│
│   ├── Normalization (Whitespace, Case)        │
│   ├── Positional Ordering & Exact Matching    │
│   └── Raw Score & Item Status Aggregation     │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│          OBJECTIVE EVALUATION RESULT          │
│  DeterministicExamResult / PartResult         │
│  (rawScore, maxRawScore, percentage, status)  │
└───────────────────────────────────────────────┘
```

---

## 2. Supported Components & Evaluation Mechanics

### 2.1 Grammar & Vocabulary Component
- **Grammar (25 questions):** `[VERIFIED]` Single choice (3 options). Normalizes input string (whitespace trimmed, case-insensitive comparison against answer string). Score: 1 pt per correct question.
- **Vocabulary (25 items in 5 sets):** `[VERIFIED]` Matching 5 target words/prompts per set against 10 shared options. Checks submitted `optionId` against `vocabularyAnswers[itemId]`. Score: 1 pt per correct item.

### 2.2 Reading Component
- **Part 1 (Sentence Completion - 5 gaps):** `[VERIFIED]` Exact match per gapId against gap answer key. Score: 1 pt per correct gap.
- **Part 2 (Text Cohesion - 2 stories x 5 reorderable sentences):** `[VERIFIED]` Positional array comparison. Each sentence placed in its correct relative slot earns 1 point (up to 5 points per story; 10 points total).
- **Part 3 (Opinion Matching - 7 statements):** `[VERIFIED]` Compares candidate's selected person (`person_a`, `person_b`, etc.) against answer key. Score: 1 pt per correct statement.
- **Part 4 (Matching Headings - 7 paragraphs):** `[VERIFIED]` Compares candidate's assigned headingId per paragraph against answer key. Score: 1 pt per correct paragraph.

### 2.3 Listening Component
- **Part 1 (Information Recognition - Multiple audio tasks):** `[VERIFIED]` Single choice option match. Score: 1 pt per task.
- **Part 2 (Speaker Matching - 4 speakers):** `[VERIFIED]` Statement option ID matching per speaker. Score: 1 pt per speaker.
- **Part 3 (Opinion Discussion - 4 statements):** `[VERIFIED]` Discrete attribution (`Man`, `Woman`, `Both`) per statement. Score: 1 pt per statement.
- **Part 4 (Extended Monologues - 2 monologues x 2 questions):** `[VERIFIED]` Multiple choice question matching. Score: 1 pt per question.

---

## 3. Scoring Rules & Unanswered Behavior

| Submission State | Item Status | Points Earned | Implementation Rule |
| :--- | :--- | :--- | :--- |
| Candidate answer matches answer key | `"correct"` | `maxPoints` (1 pt default, N pts for compound) | `[PROJECT GRADING RULE]` Exact normalized match. |
| Candidate answer does not match | `"incorrect"` | `0` | `[PROJECT GRADING RULE]` |
| Candidate left answer blank / undefined | `"unanswered"` | `0` | `[PROJECT GRADING RULE]` Explicit status preserved for diagnostic UI. |

### 3.1 Raw Score vs. Official Score Limitation
- `[PROJECT GRADING RULE]` The engine calculates only **raw scores**, **max raw scores**, and **percentages**.
- `[VERIFIED]` The engine does NOT claim to provide an official British Council CEFR mark. Any subsequent practice band conversion is strictly labeled:  
  `PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE`.

---

## 4. Normalization Rules (`project/lib/grading/normalize.ts`)
1. **String Normalization:** `[IMPLEMENTATION DETAIL]` Trims leading and trailing whitespace. Case is normalized during string comparison for choices and text tokens.
2. **Array Normalization:** `[IMPLEMENTATION DETAIL]` Preserves strict sequential indices while trimming individual string items.
3. **ID Canonicalization:** `[IMPLEMENTATION DETAIL]` Ensures tokenized IDs (`g_q01`, `r1_gap_1`, `opt_v1_a`) are cleanly trimmed strings.

---

## 5. Error Design & Boundaries (`project/lib/grading/errors.ts`)

Typed errors are thrown using `GradingError`:
- `INVALID_SUBMISSION`: Submissions with invalid types or mismatched `testId`.
- `INVALID_ANSWER_KEY`: Corrupt or non-object answer key inputs.
- `MISSING_ANSWER_KEY`: Answer key missing expected component objects.

---

## 6. Practice Mode vs. Mock Test Mode Compatibility

- **Practice Mode (Single Part):** Directly invoke part graders (`gradeReadingPart2()`, `gradeGrammarPart()`) with the immediate user answers to receive lightweight, instant `DeterministicPartResult` feedback.
- **Mock Test Mode (Full Exam):** Invoke master orchestrator `gradeDeterministicExam(submission, serverAnswerKey)` to receive a complete `DeterministicExamResult` with all section breakdowns and aggregate raw scores.

---

## 7. Security Guarantees
- Private answer keys are never bundled into client JavaScript.
- Grading results return item statuses (`"correct"` / `"incorrect"` / `"unanswered"`) and earned points without leaking server answer hashes or private keys.
