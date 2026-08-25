# Progress Tracking Engine Architecture

**Document Version:** 1.0.0  
**Date:** 2026-08-22  
**Layer:** Core Learning Domain (`project/lib/progress/`)  
**Scope:** Shared between Practice Mode and Mock Test Mode  

---

## 1. Overview & Architectural Principles

The Progress Tracking Engine is an immutable, pure, and deterministic computation layer designed to aggregate, analyze, and diagnose candidate learning performance across all 5 Aptis B2 test components:
- Grammar & Vocabulary (Deterministic)
- Reading (Deterministic)
- Listening (Deterministic)
- Writing (AI Evaluated)
- Speaking (AI Evaluated)

### Key Design Tenets:
1. **Zero LLM Dependency:** All statistical calculations, streak tracking, heatmap generations, and weak-area detections run deterministically without calling external AI models.
2. **Storage Agnostic:** The core domain model (`ProgressAttemptRecord`) is independent of any specific storage mechanism and can be persisted seamlessly into `localStorage`, `IndexedDB`, or a cloud database.
3. **Timezone Safety:** Date calculations accept explicit reference dates rather than invoking implicit system timestamps, enabling robust unit testing and timezone-agnostic streak evaluation.
4. **Practice vs. Mock Test Awareness:** Tracks both granular skill drills (practice mode) and full timed section attempts (mock test mode).

---

## 2. Domain Data Models

```text
ProgressAttemptRecord Hierarchy
├── Identification & Context
│   ├── id: string (Unique attempt ID)
│   ├── testId: string (e.g. "aptis-b2-01")
│   ├── mode: "practice" | "mock-test"
│   └── skill: "grammarVocabulary" | "reading" | "listening" | "writing" | "speaking"
│
├── Performance Metrics
│   ├── partIdentifier?: string (e.g. "part1", "part2")
│   ├── rawScore: number
│   ├── maxRawScore: number
│   ├── percentage: number
│   ├── durationSeconds?: number
│   └── estimatedBand?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
│
└── Integrity & Compliance
    ├── completedAt: ISO 8601 string
    └── disclaimer: "PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE"
```

---

## 3. Core Engine Modules

### 3.1 Statistics & Diagnostics (`project/lib/progress/statistics.ts`)
- **Skill Performance:** Computes total attempts, average percentage, peak percentage, latest score, time spent, and dynamic improvement trend (`improving` vs `stable` vs `declining` by comparing recent vs historical attempts).
- **Sub-part Performance:** Groups attempts by `skill + partIdentifier` to pinpoint exact question type mastery.
- **Weak-Area Detection:** Configurable thresholds (`criticalThreshold = 55%`, `moderateThreshold = 70%`) automatically generate actionable `WeakAreaIndicator` records for downstream recommendation engines.

### 3.2 Daily Learning Streak (`project/lib/progress/streak.ts`)
- **Consecutive Active Days:** Tracks continuous daily engagement in calendar days.
- **Active Today vs. Grace Period:** If the user studied yesterday but hasn't studied yet today, the streak remains intact (`isActiveToday: false`, `currentStreak: N`). If two consecutive days are missed, the streak resets to `0`.
- **Historical Peak:** Computes `longestStreak` across the user's complete history.

### 3.3 12-Week Activity Heatmap (`project/lib/progress/heatmap.ts`)
- **Grid Generation:** Generates exactly 84 calendar days (12 weeks) ending on the target reference date.
- **Intensity Mapping:**
  - `0`: 0 activities (inactive day)
  - `1`: 1 activity or < 15 minutes
  - `2`: 2–3 activities or < 35 minutes
  - `3`: 4–5 activities or < 60 minutes
  - `4`: 6+ activities or 60+ minutes

---

## 4. AI Coach Integration Boundary

```text
+-----------------------------+
|   Progress Tracking Engine  |
| (Raw Attempts, Stats, Streaks)
+-----------------------------+
              │
              ▼ (OverallLearningStatistics & WeakAreaIndicator[])
+-----------------------------+
|   AI Coach Recommendation   |  <-- Future Engine
|  (Adaptive Study Roadmaps)  |
+-----------------------------+
```

The AI Coach will consume `OverallLearningStatistics` and `weakAreas` produced by this engine to generate personalized, targeted study roadmaps.
