# Official Skills Index for Agents

This directory contains standalone developer skills prepared from official Google Gemini repositories.

---

## Skills Catalog

| Skill Name | Source | Version/Commit | Location | Purpose | When to Read | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`gemini-api-dev`** | `google-gemini/gemini-skills` | `b40dd8d` | `resources/skills/gemini-api-dev/` | Developer guidelines for `@google/genai` TypeScript SDK, structured output (`responseSchema`), system instructions, and error handling. | Consult before implementing `/api/grade` or any Gemini API endpoint. | **Active / Required** |
| **`gemini-live-api-dev`** | `google-gemini/gemini-skills` | `b40dd8d` | `resources/skills/gemini-live-api-dev/` | Multimodal Live API specifications, real-time bidirectional WebSocket streaming, audio input formatting. | Consult when designing the Speaking module real-time voice feedback. | **Future Reference** (MVP uses standard multimodal audio) |

---

## Agent Usage Instructions
- Read `resources/skills/gemini-api-dev/SKILL.md` before building any prompt or grading service.
- Never modify these skill files.
- Keep skill logic decoupled from application components.
