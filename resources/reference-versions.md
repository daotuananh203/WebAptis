# Reference Versions & Repository Metadata

This document records the exact version, branch, commit SHA, and date of all external reference materials cloned and stored in `resources/`.

---

## 1. Reference Repositories

| Resource | Source URL | Branch | Commit SHA | Date Checked | Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`next.js`** | `https://github.com/vercel/next.js.git` | `canary` | `d898c8f5` | 2026-08-22 | **Core Reference** (Framework patterns & Route Handlers) |
| **`js-genai`** | `https://github.com/googleapis/js-genai.git` | `main` | `6e9b35c` | 2026-08-22 | **Core Reference** (`@google/genai` SDK TypeScript source) |
| **`gemini-skills`** | `https://github.com/google-gemini/gemini-skills.git` | `main` | `b40dd8d` | 2026-08-22 | **Core Reference** (Official Gemini developer skills & prompt recipes) |
| **`shadcn-ui`** | `https://github.com/shadcn-ui/ui.git` | `main` | `1773ecf` | 2026-08-22 | **Core Reference** (UI component architecture & Tailwind styling) |
| **`vercel-ai`** | `https://github.com/vercel/ai.git` | `main` | `ed857f5` | 2026-08-22 | **Optional Reference** (Streaming & chat UI state patterns) |

---

## 2. Prepared Official Skills

| Skill Name | Source Repository | Commit SHA | Location | Role |
| :--- | :--- | :--- | :--- | :--- |
| **`gemini-api-dev`** | `google-gemini/gemini-skills` | `b40dd8d` | `resources/skills/gemini-api-dev/` | **Active** (Structured JSON output, error handling, system instructions) |
| **`gemini-live-api-dev`** | `google-gemini/gemini-skills` | `b40dd8d` | `resources/skills/gemini-live-api-dev/` | **Future Reference** (Speaking module real-time audio interaction) |
