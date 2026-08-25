# Aptis B2 Practice Web App — UI Architecture & Design System

**Document Version:** 1.0.0  
**Date:** 2026-08-22  
**Tech Stack:** Next.js (App Router), React 19, Tailwind CSS v4, shadcn/ui primitives, Lucide Icons  

---

## 1. Application Shell & Layout Hierarchy

The application employs a dual-layout strategy:

```text
Root Layout (app/layout.tsx)
├── Standard Dashboard Shell (app/(main)/layout.tsx)
│   ├── Top Header (Profile, Streak Pill, Theme Toggle)
│   ├── Collapsible Desktop Sidebar (Navigation items)
│   ├── Dynamic Content Region (`children`)
│   └── Mobile Bottom Navigation Bar (<768px)
│
└── Distraction-Free Exam Arena (app/mock-test/session/[testId]/layout.tsx)
    ├── Minimalist Exam Top Bar (Title, Master Timer, Full-screen toggle)
    ├── Question Palette Sidebar (Collapsible matrix)
    └── Active Component Canvas
```

---

## 2. Design System Tokens & Color Palette

Aligned with a modern, student-friendly educational SaaS aesthetic:

- **Primary Colors:**
  - Emerald / Deep Forest Green (`#064c3f`, `#0b6653`): Core brand, headers, primary buttons.
  - Mint Accent (`#dff2eb`, `#eef8f4`): Active tabs, subtle badges, hover states.
- **Supporting Accents:**
  - Gold / Amber (`#f2bd62`, `#fff5e6`): Daily streak, time-warning states, flagged questions.
  - Coral / Rose (`#e11d48`, `#fff1f2`): Errors, grammar mistakes, time-expired alerts.
  - Slate Neutral (`#f8fafc`, `#f1f5f9`, `#334155`): Background, card surfaces, readable body text.
- **Typography Hierarchy:**
  - Heading Display: `font-bold tracking-tight text-slate-900`
  - Section Titles: `text-xl font-semibold text-slate-800`
  - Body Text: `text-sm leading-relaxed text-slate-600`
  - Micro-copy / Badges: `text-xs font-medium uppercase tracking-wider`

---

## 3. Page Templates & Layout Blueprints

### 3.1 Practice Template (`ExerciseShell`)
- **Desktop (≥1024px):** 2-column split (Left: Passage / Stimuli / Media [45% width], Right: Interactive questions & answer controls [55% width]). Both columns scroll independently to prevent lost context.
- **Mobile (<1024px):** Tabbed interface with top pill switcher (`[Văn bản / Đề bài]` vs `[Câu hỏi / Trả lời]`).

### 3.2 Exam Simulator Template (`ExamArena`)
- Fixed sticky header displaying the master countdown timer.
- Bottom action bar with "Previous", "Next", "Flag Question", and "Finish Exam" actions.
- Floating modal for final submission confirmation displaying a summary of unanswered questions.

---

## 4. State Management Strategy

1. **Client Session State:** React Context / lightweight custom hooks for active exam timers, candidate answer selections, and audio playback counts.
2. **Persistence Layer:** `localStorage` for saving practice streak, completed exercise IDs, diagnostic history, and weak skill analytics with zero server lock-in.
3. **Server-Side AI State:** Transient execution in Route Handler `/api/grade` with typed Zod validation.

---

## 5. Responsive Breakpoint Strategy

- **Mobile (<768px):** Sidebar hidden; floating bottom navigation enabled; full-width stacked question cards; compact single-column scorecards.
- **Tablet (768px – 1023px):** Compact icon-only sidebar; side-by-side dashboard cards; responsive question matrix.
- **Desktop (≥1024px):** Expanded sidebar; split-pane practice view; full 12-week heatmap display.
