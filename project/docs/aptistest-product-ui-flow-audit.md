# AptisTest V2 Product, UI, Flow & Interaction Audit

**Document Version:** 2.0.0 (Deep-Dive Implementation Companion)  
**Date:** 2026-08-22  
**Reference Source:** Observable public product behavior from [https://aptistest.edu.vn/](https://aptistest.edu.vn/)  
**Role:** Canonical Blueprint for Screen Behaviors, State Machines, Interactions & Responsive Layouts  

---

## 1. Executive Summary & Audit Scope

This document translates observable product patterns from `aptistest.edu.vn` into actionable, screen-by-screen implementation specifications for our personal, portfolio-grade **Aptis B2 Practice Web App**. 

### Classification Legend:
- `[OBSERVED]`: Legitimate publicly observable UI layout, information hierarchy, or interactive element on the reference website.
- `[NOT OBSERVABLE]`: Internal logic, protected student dashboard states, backend database transactions, or authenticated scoring APIs not publicly visible.
- `[PROJECT DESIGN DECISION]`: Original engineering and UX decisions tailored specifically for our Next.js / TypeScript / Tailwind CSS / Gemini 3.7 Flash personal platform.

---

## 2. Screen-by-Screen Product & UI Audit

### 2.1 Dashboard Screen (`/dashboard`)
```text
Dashboard Screen
├── Purpose: Central command center providing habit tracking, skill diagnostic snapshot, and next actionable drill.
├── Entry: Direct landing after app start / top-nav logo click.
├── Main UI:
│   ├── Left Sidebar (Desktop): Mini navigation (Dashboard, Practice, Mock Test, Results, Vocab, Grammar, AI Coach) [OBSERVED].
│   ├── Header Banner: Personalized greeting + Daily Streak badge ("3 ngày liên tiếp") [OBSERVED].
│   ├── Top-Row Grid: Daily Motivation Card + 12-Week Practice Heatmap + Leaderboard/Ranking Panel [OBSERVED].
│   ├── Primary Action Panel ("Bài học hôm nay"): Recommends next immediate micro-drill [OBSERVED].
│   ├── Metric Panels: Weekly study time, exercises completed, and skill accuracy bars [OBSERVED].
│   └── Floating AI Coach Widget: Displays contextual study tips and quick access to AI diagnostic [OBSERVED].
├── Primary Action: Click "Học tiếp ngay" / "Start Today's Lesson" CTA button.
├── Secondary Actions: Select specific skill from sidebar; browse recent result history; view vocabulary deck.
├── User Interactions: Hover on heatmap shows practice count per day; click leaderboard tab filters daily/weekly.
├── State Changes: Streak increments upon completing daily drill; heatmap cell lights up upon test submission.
├── Responsive Behavior: Sidebar converts to bottom nav/hamburger on mobile; top grid collapses to single column.
└── Notes: Backend persistence uses client local storage / server profile [PROJECT DESIGN DECISION].
```

---

### 2.2 Practice Hub & Skill Drill Screen (`/practice/[skill]/[part]`)
```text
Practice Screen
├── Purpose: Focused, bite-sized practice for individual parts of any of the 5 skills.
├── Entry: Dashboard skill cards or Sidebar -> Practice -> Skill selection.
├── Main UI:
│   ├── Breadcrumb Navigation: Practice / [Skill Name] / [Part Number] [PROJECT DESIGN DECISION].
│   ├── Part Header: Title, official task guidance, word/time advice, and progress tracker (e.g. Question 1/5) [OBSERVED].
│   ├── Work Area:
│   │   ├── Left Column: Passage / Audio Player / Images / Club Context Notice [OBSERVED].
│   │   └── Right Column: Interactive Questions (Gap fill, Sentence ordering, Chat responses, Email editor) [OBSERVED].
│   └── Bottom Action Bar: "Check Answer" (for objective parts) or "Submit for AI Grading" (for Writing/Speaking) [OBSERVED].
├── Primary Action: Submit response for immediate feedback.
├── Secondary Actions: "Reset Exercise", "Next Drill", "Back to Skill Menu".
├── User Interactions: Real-time word counter updates for Writing; audio player tracks playback count (max 2).
├── State Changes: Answering -> Validating -> Displaying Explanations -> Updating Skill Accuracy.
└── Responsive Behavior: Side-by-side on desktop (≥1024px); stacked tabs (Passage vs. Question) on mobile (<768px).
```

---

### 2.3 Mock Test Hub & Exam Arena Screen (`/mock-test` & `/mock-test/session/[testId]`)
```text
Mock Test Arena
├── Purpose: High-fidelity exam simulation adhering strictly to British Council computer-based testing conditions.
├── Entry: Sidebar -> Mock Test -> Choose Full Exam or Skill Mini-Test -> Read Instructions -> "Start Test".
├── Main UI:
│   ├── Sticky Top Bar: Exam Title, Remaining Countdown Timer (minutes:seconds with visual warning at <5 mins) [OBSERVED].
│   ├── Top Component Tabs: Grammar & Vocab (25m) | Reading (35m) | Listening (40m) | Writing (50m) | Speaking (12m) [OBSERVED].
│   ├── Exam Workspace: Distraction-free question area, clear prompt text, and responsive input controls [OBSERVED].
│   ├── Question Matrix Palette (Bottom/Right): Grid of question numbers color-coded:
│   │   ├── Grey: Unvisited
│   │   ├── Blue/Green: Answered
│   │   └── Amber: Flagged for review [PROJECT DESIGN DECISION].
│   └── Finish Button: Opens modal asking for explicit confirmation before submitting final exam [OBSERVED].
├── Primary Action: Complete questions sequentially and submit before timer expires.
├── Secondary Actions: "Flag for Review", "Previous Question", "Next Question".
├── State Transitions: not-started -> instructions -> active -> time-warning -> submit-modal -> grading -> results.
└── Responsive Behavior: Fixed compact timer on mobile; collapsible question palette drawer.
```

---

### 2.4 Results & Diagnostic Screen (`/results/[submissionId]`)
```text
Results Screen
├── Purpose: Comprehensive performance breakdown, CEFR band estimation, and sentence-by-sentence AI feedback.
├── Entry: Automatic redirection upon exam submission or via Sidebar -> Results history.
├── Main UI:
│   ├── Overall Scorecard: Total Scaled Score (0–50 per skill), Estimated CEFR Band (B1/B2/C1), and Official Disclaimer [OBSERVED].
│   ├── Radar / Bar Breakdown: Visual representation of strengths vs. weak skill areas [OBSERVED].
│   ├── Skill Tabs: Grammar/Vocab, Reading, Listening, Writing, Speaking.
│   ├── Deterministic Section: Shows candidate answer vs. correct answer with rationale and script highlight [OBSERVED].
│   └── AI Evaluated Section (Writing & Speaking):
│       ├── Sub-score gauges: Task Achievement (0-5), Coherence (0-5), Grammar (0-5), Lexical Resource (0-5) [OBSERVED].
│       ├── Sentence Error Inspector: Highlights grammatical mistakes, explains rule, and suggests B2 rewrite [OBSERVED].
│       └── B2 Model Answer Comparison [OBSERVED].
├── Primary Action: "Start Recommended Remedial Practice" (AI Coach CTA) [OBSERVED].
└── Secondary Actions: "Download PDF Report", "Retake Exam", "Return to Dashboard".
```

---

## 3. Question Interaction & Functional Mechanics

### 3.1 Multiple Choice & Gap-Fill Mechanics
- **Interaction:** Drop-down selector or discrete radio pill buttons.
- **Feedback State:** In practice mode, instant green check (`bg-emerald-50 text-emerald-700`) for correct and red cross (`bg-rose-50 text-rose-700`) with explanation. In exam mode, selection is silently saved to session state.

### 3.2 Sentence Reordering Mechanics (Reading Part 2)
- **Interaction:** Sentence 0 is visually locked with an anchor icon. Sentences 1–5 can be dragged and dropped or shifted using "Up / Down" arrow buttons (ensuring full mobile accessibility).
- **Validation:** Compares submitted array of sentence IDs against the server order key.

### 3.3 Opinion & Heading Matching Mechanics (Reading Parts 3 & 4)
- **Part 3 (Opinion Matching):** 4 Person badges (A, B, C, D) selectable per statement; allows many-to-one selection.
- **Part 4 (Heading Matching):** Select 1 heading from the 8-heading dropdown per paragraph; once selected, a heading is marked as used to prevent accidental duplicate assignment.

### 3.4 Text Input & Real-Time Word Counter (Writing Parts 1 to 4)
- **Real-Time Meter:** Dynamic word counter displaying `Current / Target Range` (e.g. `42 / 40–50 words`).
- **Visual Feedback:** Badge turns emerald when within official word guidance, and amber/red when significantly under/over limit.

### 3.5 Audio Player Mechanics (Listening Parts 1 to 4)
- **Playback Tracking:** Displays a `Plays: 0 / 2` badge.
- **Strict Enforcement:** Once audio has finished playing twice, the play button is disabled (`opacity-50 cursor-not-allowed`) to mirror British Council testing rules (`maxPlays: 2`).

### 3.6 Microphone Capture & Countdown Timers (Speaking Parts 1 to 4)
- **State Machine:**
  1. `Preparation Phase`: Automatic countdown timer (60s for Part 4, 0s for Parts 1–3) with note-taking hint.
  2. `Recording Phase`: Auto-triggers microphone capture with active animated waveform and response countdown (30s, 45s, or 120s).
  3. `Completion Phase`: Encodes audio to `audio/webm` buffer and auto-advances to the next question.

---

## 4. Navigation & Route Architecture Map

```text
/
├── dashboard                           # Main learner home (Streak, Heatmap, Today's Goal)
├── practice                            # Practice directory hub
│   ├── grammar-vocabulary              # 25 Grammar + 25 Vocab micro-drills
│   ├── reading                         # Reading Part 1 to Part 4 drills
│   ├── listening                       # Listening Part 1 to Part 4 drills
│   ├── writing                         # Writing Part 1 to Part 4 interactive editor
│   └── speaking                        # Speaking Part 1 to Part 4 audio recorder
├── mock-test                           # Exam simulator selection hub
│   └── session                         # Active exam arena with countdown & question matrix
│       └── [testId]
├── results                             # History list of past tests
│   └── [submissionId]                  # Detailed diagnostic report & AI error breakdown
├── vocabulary                          # Thematic vocabulary decks & flashcards
├── grammar                             # Grammar rules encyclopedia & quick quizzes
└── ai-coach                            # AI study plan, weakness analysis & targeted drills
```

---

## 5. Component Inventory

```text
COMPONENT CATALOG (project/components/)
├── ui/                                 # Base shadcn primitives (Button, Card, Progress, Dialog, Badge, Tabs)
├── layout/
│   ├── AppShell.tsx                    # Responsive container with Desktop Sidebar & Mobile Bottom Nav
│   ├── Header.tsx                      # Top bar with user profile & quick streak summary
│   ├── Sidebar.tsx                     # Collapsible desktop navigation bar
│   └── MobileNav.tsx                   # Floating mobile navigation bar
├── dashboard/
│   ├── StreakCard.tsx                  # Displays consecutive study days & motivation badge
│   ├── ActivityHeatmap.tsx             # 12-week GitHub-style practice contribution grid
│   ├── NextActionCard.tsx              # "Bài học hôm nay" recommended drill launcher
│   ├── SkillRadarCard.tsx              # Accuracy visualization across 5 skills
│   └── AICoachWidget.tsx               # Floating AI tip and diagnostic shortcut
├── practice/
│   ├── ExerciseShell.tsx               # Standard practice layout with split passage/question panels
│   ├── SentenceOrderer.tsx             # Drag-and-drop / button-based sentence reordering
│   ├── MatchingGrid.tsx                # Opinion and Heading matching matrix
│   ├── WritingEditor.tsx               # Textarea with live word counter & target limits
│   └── AudioTaskPlayer.tsx             # Audio controller enforcing max 2 plays
├── exam/
│   ├── ExamHeader.tsx                  # Countdown timer and component switcher
│   ├── QuestionPalette.tsx             # Interactive grid of all question numbers (Answered/Flagged)
│   ├── SpeakingRecorder.tsx            # Prep countdown, recording waveform & auto-submit
│   └── SubmitModal.tsx                 # Warning dialog displaying unanswered question counts
└── results/
    ├── ScoreSummaryCard.tsx            # Overall 0-50 scaled score & estimated CEFR band
    ├── ErrorReviewList.tsx             # Item-by-item correct vs. candidate answer rationales
    └── AIWritingFeedback.tsx           # Rubric scores, grammar error inspector, and B2 model answer
```

---

## 6. Reference Behavior vs. Original Implementation Matrix

| Feature Area | AptisTest Reference Behavior | Our Original Project Implementation | Priority |
| :--- | :--- | :--- | :--- |
| **Dashboard** | Shows streak, heatmap, rankings, today's lesson. | Original client-side progress engine (local storage state), streak counter, heatmap grid, and recommended drill. | **MUST** |
| **Modular Practice** | Part-by-part drills for 5 skills. | Next.js App Router subroutes (`/practice/[skill]`) with immediate deterministic feedback. | **MUST** |
| **Mock Test Simulator**| Full timed computer-based exam. | Full-screen ExamShell with countdown timer, question matrix, and multi-component switching. | **MUST** |
| **AI Writing Grader** | Automated rubric scoring and error review. | Server Route Handler `/api/grade` calling Gemini 3.7 Flash with structured JSON schema (`responseSchema`). | **MUST** |
| **Speaking Recorder** | Timed recording with prep time. | MediaRecorder API with preparation countdown and auto-advancing response timers. | **MUST** |
| **Vocabulary & Grammar**| Thematic decks and rule lessons. | Dedicated vocabulary matching decks and grammar quizzes using public test datasets. | **SHOULD** |
| **Leaderboard / Social**| Public user rankings. | `[PROJECT DECISION: NOT NEEDED]` Excluded to maintain 100% personal, private study focus. | **NOT NEEDED** |
| **VIP / Commercial Pay**| Subscriptions, payment gateways. | `[PROJECT DECISION: NOT NEEDED]` Excluded completely; 100% free personal portfolio platform. | **NOT NEEDED** |
