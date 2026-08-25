# UX & Product Architecture Reference Knowledge Base

**Primary Reference:** `https://aptistest.edu.vn/`  
**Focus:** Educational SaaS Information Architecture, Practice Workflows, Exam Simulation, and AI Coach Placement.

---

## 1. High-Level User Journey
```text
Landing / Start
      ↓
Dashboard (Streak, Heatmap, Today's Goal)
      ↓
Practice (5 Skills, Part-by-part drills) OR Mock Test (Full timed simulation)
      ↓
Exercise Submission
      ↓
Evaluation (Deterministic for Grammar/Reading/Listening; Gemini 3.7 Flash for Writing/Speaking)
      ↓
Scorecard & Diagnostic Error Breakdown
      ↓
AI Coach Recommendations & Targeted Remedial Drills
```

---

## 2. Core Dashboard Widgets to Implement
- **Streak & Habit Tracker:** Visual streak counter motivating daily study consistency.
- **Activity Heatmap:** 12-week calendar grid displaying daily practice volume.
- **"Next Best Action":** Contextual card prompting the user with the most critical exercise based on diagnostic weakness.
- **Skill Radar / Progress Bar:** Real-time accuracy metrics across Reading, Listening, Writing, Speaking, and Grammar/Vocab.

---

## 3. Product & Design Principles
- **No Direct Copying:** Never copy source code, HTML, CSS, branding, or proprietary questions.
- **Original Implementation:** Leverage Next.js App Router, Tailwind CSS v4, and shadcn/ui components.
- **Authority Separation:** British Council remains the factual authority for test format and rules; AptisTest serves as the UX inspiration.
