# Aptis ESOL General (B2) — Data Architecture

**Document Version:** 2.0.0 (Audited & Corrected)  
**Date:** 2026-08-22  
**Target Variant:** Aptis ESOL General / Aptis General (CEFR B2 Preparation)  
**Status:** Approved Architectural Specification  

---

## 1. Architectural Principles & Security Model

The application enforces strict **Client/Server Data Separation** to ensure security, prevent answer leakage, and optimize AI operational costs.

```text
Browser / Client Components
  ↓ (fetches public test structure)
/data/tests/[testId]-public.json
  ↓ (candidate submits answers)
Next.js Route Handler (/api/grade)
  ↓ (evaluates using private server key)
/data/tests/[testId]-answers.json
  ├──> Deterministic evaluation for Grammar, Vocabulary, Reading, Listening
  └──> Gemini 3.7 Flash evaluation for Writing & Speaking (CEFR B2 Rubrics)
Grading Result (Scores + CEFR Rubric Feedback)
```

### Security Guarantees
1. **Zero Client Leakage:** Public datasets (`*-public.json`) never contain solutions, correct options, scoring weights, or answer keys.
2. **Server-Side Verification:** Answer keys (`*-answers.json`) are only read inside secure server environments (Route Handlers / Server Actions).
3. **Automated Anti-Leak Enforcement:** Every dataset is verified via automated tests (`project/tests/anti-leak.test.ts`) prior to runtime deployment.
4. **Practice Score Disclaimer:** Results are labeled:  
   `PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE`.

---

## 2. Directory Layout

```text
project/
├── data/
│   └── tests/
│       ├── aptis-b2-01-public.json      # Client-safe question and media references
│       ├── aptis-b2-01-answers.json     # Server-only answer keys & scoring rules
│       ├── aptis-b2-02-public.json      # Extensible for additional tests
│       └── aptis-b2-02-answers.json
│
├── lib/
│   └── exam/
│       ├── types.ts                     # TypeScript Domain Types & Discriminated Unions
│       └── schema/
│           ├── index.ts                 # Zod validation schemas
│           └── validator.ts             # Schema validation and consistency checks
│
└── tests/
    ├── dataset-validation.test.ts       # Schema compliance & ID consistency tests
    ├── anti-leak.test.ts                # Prohibited private key scanner
    └── run-all-tests.ts                 # Master test execution suite
```

---

## 3. Domain Model Specifications

### 3.1 Public Test Dataset Schema (`AptisPublicTestDataset`)
- **`metadata`**: `testId`, `title`, `format` (name, targetLevel, version, sourceCheckedAt), `sourceType` ("synthetic"), `totalTimeMinutes`.
- **`grammarVocabulary`**: Mandatory core component (25 mins total):
  - `grammar`: 25 multiple-choice questions (3 options).
  - `vocabulary`: 5 sets of 5 items (25 total) with a shared bank of 10 options per set (synonyms, definitions, sentence completion, collocations, phrasal verbs).
- **`reading`**: 4 parts (35 mins total):
  - Part 1: Sentence completion (`gaps` with 3 choices).
  - Part 2: Text cohesion (`anchorSentence` + array of `sentencesToOrder`).
  - Part 3: Opinion matching (4 `people` biographies + 7 `statements`).
  - Part 4: Matching headings (8 `headings` + 7 `paragraphs`).
- **`listening`**: 4 parts (40 mins total):
  - `playbackRules`: `{ maxPlays: 2 }` (official candidate rule).
  - Part 1: Information recognition (Single audio + 3-option multiple choice).
  - Part 2: Information matching (1 thematic audio + 4 speakers + 6 statement options).
  - Part 3: Opinion discussion (1 dialogue audio + 4 statements with `["Man", "Woman", "Both"]`).
  - Part 4: Extended monologue (2 monologues with 2 multiple choice questions each).
- **`writing`**: 4 parts (50 mins total):
  - `officialDurationMinutes: 50` vs `projectSuggestedPartTimers` (`[PROJECT DESIGN DECISION]`: 3m, 7m, 10m, 30m).
  - Part 1: Form filling (5 personal prompts, official guidance: 1–5 words each).
  - Part 2: Short text (official guidance: **20–30 words**).
  - Part 3: Social network chat (3 member queries, official guidance: **around 40 words** each; project validation rule allows 30–50 words).
  - Part 4: Email response (Task 4A informal: **40–50 words**, Task 4B formal: **120–150 words**).
- **`speaking`**: 4 parts (~12 mins total):
  - Part 1: Personal information (3 questions, 0s prep, 30s speaking each).
  - Part 2: 1 picture description & discussion (1 photo, 3 distinct questions: describe photo, personal experience, opinion, 0s prep, 45s speaking each).
  - Part 3: 2 pictures comparison & discussion (2 photos, 3 distinct questions: compare photos, speculate, opinion/preference, 0s prep, 45s speaking each).
  - Part 4: Abstract topic extended talk (1 topic card with 3 questions, 60s prep, 120s continuous speaking).


---

### 3.2 Server-Side Answer Key Schema (`ServerAnswerKey`)
- **`testId` & `version`**: Matches public dataset.
- **`grammarVocabulary`**:
  - `grammarAnswers`: Map of `questionId -> correctOption`
  - `vocabularyAnswers`: Map of `itemId -> optionId`
- **`reading`**:
  - `part1`: Map of `gapId -> correctOption`
  - `part2`: Map of `storyId -> orderedSentenceIdArray`
  - `part3`: Map of `statementId -> personId`
  - `part4`: Map of `paragraphId -> headingId`
- **`listening`**:
  - `part1`: Map of `taskId -> correctOption`
  - `part2`: Map of `speakerId -> statementOptionId`
  - `part3`: Map of `statementId -> "Man" | "Woman" | "Both"`
  - `part4`: Map of `questionId -> correctOption`
- **`scoringRules`**: Max points for each section, with explicit disclaimer.

---

## 4. Deterministic vs AI Grading Separation

- **Deterministic Sections (Grammar, Vocabulary, Reading, Listening):** Evaluated strictly against `ServerAnswerKey` with zero API cost.
- **AI Subjective Sections (Writing, Speaking):** Evaluated via server-side Route Handler `/api/grade` using `gemini-3.7-flash` (with fallback `gemini-2.5-pro`) against CEFR B2 rubrics.
