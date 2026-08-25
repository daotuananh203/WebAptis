# AGENTS.md — Developer & AI Agent Guidelines

## 1. Project Purpose & Scope
The **APTIS B2 PRACTICE WEB APP** is a personal web application for Aptis General B2 exam preparation (Reading, Listening, Writing, Speaking, Grammar/Vocabulary, AI Coach).
- Inspired by the UX/IA structure of `aptistest.edu.vn` (clean educational SaaS feel), but **100% original implementation and content**.
- Focus: Personal study, exam simulation, CEFR B2 skill improvement, and portfolio demonstration.

---

## 2. Technology Stack
- **Frontend:** Next.js (App Router), React 19, TypeScript (strict), Tailwind CSS, Lucide Icons, shadcn/ui.
- **Backend:** Next.js Route Handlers (Server-side services).
- **AI SDK:** Official `@google/genai` (Do NOT use `@google/generative-ai` or deprecated SDKs).
- **Package Manager:** `npm`.

---

## 3. Architecture & Project Structure
- `app/`: Next.js App Router pages and Route Handlers (`app/api/grade/route.ts`).
- `components/`: UI components organized by domain (`ui/`, `dashboard/`, `exam/`, `reading/`, `listening/`, `writing/`, `speaking/`, `results/`).
- `lib/gemini/`: Centralized Gemini client, configuration, and model mapping.
- `lib/grading/`: Deterministic & AI grading logic.
- `lib/exam/`: Exam state management and timer logic.
- `lib/progress/`: User progress tracking and analytics.
- `lib/recommendations/`: AI Coach recommendation algorithms.
- `data/tests/`: Public question datasets separated from server-side answer keys.
- `docs/`: Technical and model decision documentation.

---

## 4. Security & Gemini Rules
- **Server-Side Only:** Never expose `GEMINI_API_KEY` to client components (`NEXT_PUBLIC_` is prohibited for API keys). All AI calls route via server Route Handlers.
- **SDK Import:** Always import from `@google/genai`.
- **Model Decoupling:** Never hardcode model strings across components. Always use `lib/gemini/models.ts` and `lib/gemini/config.ts`.
- **Deterministic First:** Use deterministic checking for Reading & Listening. Use Gemini strictly for subjective assessment (Writing, Speaking) and AI Coaching.

---

## 5. Data Separation Policy
- Public test data (prompts, questions, audio metadata) resides in client-accessible structures (e.g. `*-public.json`).
- Answer keys and scoring rubrics must remain server-side (e.g. `*-answers.json`).

---

## 6. Coding Standards & Principles
- TypeScript strict mode enabled with zero implicit any.
- Small, focused, reusable components. Keep domain logic out of UI components.
- Avoid premature optimization and unnecessary abstractions.
- Clean, portfolio-quality code with comments explaining non-obvious engineering decisions.

---

## 7. Dependency & Git Safety Rules
- Only install dependencies genuinely required for the current task.
- Never commit `.env.local` or secrets. Ensure `.env.example` has placeholders only.
- Do NOT force-push, reset repository, discard user changes, or overwrite unrelated files.
- Do NOT create git commits or push unless explicitly requested by the user.

---

## 8. Mandatory Reporting Requirement
**Every completed task must conclude with a completion report written in Vietnamese** using the mandatory template:
```markdown
BÁO CÁO HOÀN THÀNH
1. Đã thực hiện
2. Files thay đổi
3. Môi trường
4. AI Model Review
5. Git
6. Validation
7. Vấn đề còn tồn tại
8. Quyết định kỹ thuật quan trọng
9. Bước tiếp theo đề xuất (Chỉ đề xuất 1 task duy nhất)
```
Stop after reporting and wait for user instructions.

---

## 9. External Reference Resources
1. The application source code is located strictly under `project/`.
2. External reference repositories and skills are located strictly under `resources/`.
3. Agents MUST consult relevant official resources in `resources/` before implementing specialized functionality.
4. Official Google Gemini documentation and resources (`resources/repos/js-genai`, `resources/repos/gemini-skills`) have priority for Gemini implementation.
5. Official framework repositories have priority over third-party tutorials.
6. Resources are reference material, NOT runtime dependencies (never import from `resources/` into `project/`).
7. Agents must not copy large sections of external source code into the project.
8. Agents must not modify reference repositories in `resources/repos/`.
9. Agents must not commit or push changes to reference repositories.
10. Agents must not introduce a dependency simply because its repository exists in `resources/`.

---

## 10. Product, UI, Flow & Functional Reference Policy
1. **Primary Product/UX/UI Authority:** `https://aptistest.edu.vn/` is the primary reference for product structure, screen layouts, user journeys, interaction patterns, state transitions, and educational UX patterns.
2. **Authority Hierarchy:**
   - **Aptis Examination Facts & Rules:** British Council official sources remain the sole authority for test format, task specifications, timing, word guidance, and CEFR criteria.
   - **Product / UX / UI Design:** `aptistest.edu.vn` is the primary reference for layout, user journey, and feature placement.
3. **Strict No-Copying Rule:** Never copy source code, HTML/CSS, JavaScript, branding, logos, proprietary test questions, audio, or private materials. All implementations and test data must remain 100% original.
4. **Internal Implementation Step:** For every UI, flow, or product feature, follow the workflow:
   `Reference check (aptistest.edu.vn & project/docs/aptistest-product-ui-flow-audit.md) -> UI/State decision -> Original Implementation -> Validation`.




<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
