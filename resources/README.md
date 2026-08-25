# External Resources & Reference Knowledge Base

This directory serves as the centralized, completely isolated knowledge base and reference repository ecosystem for developers and AI agents working on the **APTIS B2 PRACTICE WEB APP**.

---

## ⚠️ Isolation & Security Rules
1. **Never Import into Application Code:** No file in `resources/` may be imported by code inside `project/`.
2. **Never Bundle into Production:** `resources/` is excluded from Next.js builds, Webpack/Turbopack bundling, and deployment output.
3. **Reference Only:** Cloned repositories are strictly read-only references for architectural patterns, type definitions, and official SDK usage. Do not edit, commit, or push changes inside `resources/repos/`.
4. **No Dependencies without Justification:** Having a reference repository here does NOT mean it should be installed as an npm package in `project/`.

---

## 📚 Resources Architecture

```text
resources/
├── repos/                  # Cloned official repositories (shallow clones)
│   ├── next.js/            # Framework conventions, App Router, Route Handlers (Core)
│   ├── js-genai/           # Official @google/genai TypeScript SDK source (Core)
│   ├── gemini-skills/      # Google Gemini prompt recipes and developer skills (Core)
│   ├── shadcn-ui/          # Accessible Tailwind UI components & patterns (Core)
│   └── vercel-ai/          # AI streaming & UI state patterns (Optional Reference)
│
├── skills/                 # Extracted official developer skills
│   ├── gemini-api-dev/     # Guidelines for SDK usage, structured JSON output
│   └── gemini-live-api-dev/# Multimodal real-time audio patterns (Speaking reference)
│
├── docs/                   # Documentation links and reference digests
│   └── README.md           # Next.js, Gemini API, AI Studio, shadcn, Vercel doc links
│
├── research/               # Project research and design benchmarks
│   ├── ai-models/          # Gemini model benchmarking and evaluation
│   ├── aptis-format/       # Public CEFR B2 & Aptis test structure specifications
│   ├── ux-reference/       # SaaS layout and student flow benchmarks
│   └── technical-decisions/# Architecture decision records (ADRs)
│
└── reference-versions.md   # Exact commit SHAs, branches, and release metadata
```

---

## 🧭 Repository Index for Development Agents

| Repository | Official URL | Local Path | Type | When to Consult |
| :--- | :--- | :--- | :--- | :--- |
| **`next.js`** | `https://github.com/vercel/next.js` | `resources/repos/next.js` | **CORE** | When designing Route Handlers, App Router layouts, server/client boundaries, and error boundaries. |
| **`js-genai`** | `https://github.com/googleapis/js-genai` | `resources/repos/js-genai` | **CORE** | When writing server-side Gemini calls (`ai.models.generateContent`), `responseSchema`, or audio inline parts. |
| **`gemini-skills`** | `https://github.com/google-gemini/gemini-skills` | `resources/repos/gemini-skills` | **CORE** | When refining grading prompts, system instructions, and agent reasoning structures. |
| **`shadcn-ui`** | `https://github.com/shadcn-ui/ui` | `resources/repos/shadcn-ui` | **CORE** | When building UI components: countdown timers, modals, progress bars, audio players, tabs. |
| **`vercel-ai`** | `https://github.com/vercel/ai` | `resources/repos/vercel-ai` | **OPTIONAL** | When implementing streaming UI hooks or stateful AI chat patterns if needed. |
