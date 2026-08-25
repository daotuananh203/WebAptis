# Skill: gemini-api-dev

**Source:** `google-gemini/gemini-skills/skills/gemini-api-dev`  
**Purpose:** Developer guidelines for integrating Google Gemini models via `@google/genai` with strict JSON Schema constraints.  
**Status:** Active  

---

## Key Best Practices

1. **Structured Outputs with `responseSchema`:**
   - Define exact JSON schemas matching TypeScript interfaces.
   - Set `responseMimeType: "application/json"`.
   - Avoid prompt-only JSON requests; leverage SDK native schema enforcement.

2. **System Instructions:**
   - Clearly define the evaluator persona: "You are an official Aptis General CEFR B2 examiner."
   - Explicitly instruct the model to penalize below-B2 structures and reward B2 cohesive devices.

3. **Error Handling & Retries:**
   - Handle rate limits (HTTP 429) with exponential backoff.
   - Fall back to secondary models (`gemini-2.5-pro` or `gemini-2.5-flash`) if primary endpoint experiences transient downtime.
