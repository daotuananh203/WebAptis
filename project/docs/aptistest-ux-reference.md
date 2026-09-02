# AptisTest.edu.vn Product & UX Reference Analysis

**Document Version:** 1.0.0  
**Research Date:** 2026-08-22  
**Reference Source:** [https://aptistest.edu.vn/](https://aptistest.edu.vn/)  
**Role in Project:** Primary Product, UX, IA, and User-Flow Inspiration  

---

## A. Website Overview
- **Reference URL:** `https://aptistest.edu.vn/`
- **Target User:** Vietnamese English learners preparing for the Aptis General / Aptis ESOL examination (targeting CEFR B1, B2, C).
- **Core Value Proposition:** A modern, student-friendly online preparation platform combining daily habit tracking, part-by-part practice drills, realistic computer-based exam simulations, and automated AI grading for Writing and Speaking.
- **Visual & Structural Atmosphere:** Clean, focused, card-based SaaS dashboard with high visual hierarchy, green/mint educational tones, progress heatmaps, and clear call-to-actions.

---

## B. Information Architecture & Navigation

The platform structures the learner experience into a focused 7-section ecosystem:

```text
APTISTEST IA ECOSYSTEM
├── 1. Dashboard (Bảng điều khiển)
│   ├── User greeting & Daily streak badge
│   ├── Practice activity heatmap (GitHub-style calendar grid)
│   ├── Today's recommended lessons ("Bài học hôm nay")
│   ├── Weekly performance metrics & time spent
│   └── Floating AI Assistant / Coach widget
│
├── 2. Practice (Luyện tập Aptis)
│   ├── Grammar & Vocabulary (Ngữ pháp & Từ vựng)
│   ├── Reading (Đọc hiểu - Parts 1 to 4)
│   ├── Listening (Nghe hiểu - Parts 1 to 4)
│   ├── Writing (Kỹ năng Viết - Parts 1 to 4)
│   └── Speaking (Kỹ năng Nói - Parts 1 to 4)
│
├── 3. Mock Test (Mô phỏng thi)
│   ├── Full-length timed mock test (Mô phỏng thi thật)
│   └── Skill-specific mini mock tests
│
├── 4. Results & Analytics (Kết quả của tôi)
│   ├── Historical exam submissions
│   ├── CEFR level estimation & sub-score distribution (0–50 scale)
│   └── Error review & weak skill diagnostics
│
├── 5. Vocabulary & Grammar (Từ vựng & Ngữ pháp)
│   ├── Thematic vocabulary decks (Collocations, Synonyms, Definitions)
│   └── Grammar rule review with targeted micro-drills
│
└── 6. AI Evaluation (AI Chấm bài)
    ├── Automated Writing rubric evaluation (Grammar error pinpointing)
    └── Automated Speaking audio evaluation
```

---

## C. Dashboard Observations & UX Patterns
1. **Habit & Motivation Drivers:**
   - **Streak Counter:** Highlights consecutive study days (e.g. "3 ngày liên tiếp") to build daily learning consistency.
   - **Activity Heatmap:** Visualizes daily drill frequency, motivating learners to maintain an unbroken study streak.
2. **Next Best Action ("Bài học hôm nay"):**
   - Eliminates decision fatigue by prominently recommending the next single lesson or skill drill to complete based on recent activity.
3. **Weekly Progress Summary:**
   - Displays completed exercises, practice hours, and accuracy percentages with clean animated progress bars.
4. **Contextual AI Coach Widget:**
   - Unobtrusively provides personalized encouragement and highlights skill areas needing attention.

---

## D. Practice Flow Observations
- **Part-by-Part Modularization:** Instead of forcing students into full-length tests immediately, each skill is broken into standalone parts (e.g., Reading Part 2: Sentence Ordering, Writing Part 4: Formal Email).
- **Focused Drill Interface:** Distraction-free workspace with instant answer checking for deterministic parts and detailed explanations.
- **Progressive Difficulty:** Exercises are sequenced from foundational to advanced B2/C1 challenges.

---

## E. Mock Test Observations
- **Authentic Computer-Based Test Simulation:**
  - Full-screen distraction-free interface matching the British Council test layout.
  - Section countdown timers with submission warning dialogs.
  - Question grid navigation permitting easy jumping between parts and reviewing flagged questions.
- **Realistic Audio & Recording Controls:**
  - Strict 2-play limit on listening recordings (`maxPlays: 2`).
  - Automated preparation and response countdown timers for Speaking.

---

## F. Results & Analytics Observations
- **Multi-dimensional Scorecards:**
  - Displays scaled scores (0–50) per skill and overall CEFR band estimation (B1, B2, C).
  - Categorizes performance into specific sub-criteria (e.g., Grammar Accuracy, Lexical Resource, Task Achievement).
- **Actionable Error Review:**
  - Highlights exact mistakes in Reading/Listening with rationales.
  - Sentence-level corrections with original vs. upgraded B2 phrasing for Writing.

---

## G. AI & Feedback Placement Observations
- **Integrated, Non-Intrusive Guidance:**
  - AI evaluation is placed directly at the submission completion point rather than as an isolated chat interface.
  - Instant rubric breakdown with clear visual indicators (green for correct/B2, amber/red for below B2 or grammatical mistakes).
  - Specific "Upgraded Phrase" suggestions targeting CEFR B2 lexical range.

---

## H. Features Worth Adapting in our Project

| Feature Pattern | How AptisTest Implements It | How Our Project Will Implement an ORIGINAL Version |
| :--- | :--- | :--- |
| **Daily Dashboard & Heatmap** | Shows login days and lessons completed. | Build an original client-side progress engine tracking practice sessions, skill accuracy, and streak counts using local storage / state. |
| **Modular Skill Practice** | Part-based navigation across 5 components. | Organize practice modules by skill and part using clean Next.js App Router subroutes (`/practice/reading`, `/practice/writing`, etc.). |
| **Exam Simulator UI** | Timed test interface with navigation bar. | Implement reusable test player components (`CountdownTimer`, `QuestionNavigator`, `AudioPlayer`, `SpeakingRecorder`) using Tailwind CSS and shadcn/ui. |
| **AI Writing & Speaking Grader** | Instant scoring with error correction. | Connect Next.js server Route Handler `/api/grade` to Google Gemini 3.7 Flash with structured JSON schemas (`responseSchema`) for CEFR B2 grading. |
| **AI Coach Recommendations** | Suggests next lessons. | Implement client/server recommendation algorithms analyzing weak skill scores to formulate targeted study drills. |

---

## I. Features Intentionally NOT Copied
1. **Commercial LMS & Payment Systems:** No paywalls, VIP subscriptions, or checkout gateways. The project is 100% focused on personal study and open-source portfolio quality.
2. **Proprietary Test Content:** The app does not claim British Council ownership or official status. Runtime content is mixed: project-created practice data, source-derived/user-provided study material with preserved provenance, and source-limited records that are fail-closed when their assets cannot be verified. No missing content is fabricated to fill a source gap.
3. **Proprietary Branding & Exact Visual Identity:** No copied logos, exact stylesheets, or brand assets. Our design uses a modern Tailwind CSS + shadcn/ui design system tailored specifically for this project.
