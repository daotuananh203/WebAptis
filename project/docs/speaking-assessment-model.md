# Aptis ESOL General (B2) — Speaking Assessment Model & Audio Strategy

**Document Version:** 2.0.0 (Audited & Hardened)  
**Date:** 2026-08-22  
**Authority:** British Council Aptis ESOL Candidate Guides & Teacher Specifications  
**Application Context:** Automated AI-Assisted Multimodal Speaking Feedback Engine  

---

## 1. Official Sources & Verified Task Structure

| Speaking Part | Official Task Structure & Stimuli | Official Assessment Dimensions | Official Timing | Status Label |
| :--- | :--- | :--- | :--- | :--- |
| **Part 1 (Personal Information)** | 3 short personal questions. | Task fulfilment, grammatical accuracy, vocabulary range, pronunciation (intelligibility), spoken fluency. | 0s prep, **30 seconds per response** (3 recordings). | `[VERIFIED — BRITISH COUNCIL]` |
| **Part 2 (Describe, Recount & Opinion)** | **1 photograph** + **3 distinct questions/responses**: <br>1. Describe the photograph.<br>2. Recount a personal experience.<br>3. Express an opinion on the topic. | Task fulfilment (photo description, personal recount, opinion), grammar, vocabulary, pronunciation, fluency & cohesion. | 0s prep, **45 seconds per response** (3 recordings). | `[VERIFIED — BRITISH COUNCIL]` |
| **Part 3 (Compare, Speculate & Opinion)** | **2 contrasting photographs** + **3 distinct questions/responses**: <br>1. Describe and compare the 2 photos.<br>2. Speculate on a situation.<br>3. Express an opinion/preference. | Task fulfilment (comparing, speculating, expressing preference), grammar, vocabulary, pronunciation, fluency & cohesion. | 0s prep, **45 seconds per response** (3 recordings). | `[VERIFIED — BRITISH COUNCIL]` |
| **Part 4 (Extended Abstract Topic)** | 1 topic card with **3 interrelated questions**. | Completeness across all 3 prompts, idea development, structural organization, discourse markers, grammar range, vocabulary, pronunciation, sustained fluency. | **60s preparation**, **120 seconds continuous speaking** (1 recording). | `[VERIFIED — BRITISH COUNCIL]` |

---

## 2. Distinction Between Official Rules & Project Architecture

### 2.1 Verified British Council Rules `[VERIFIED — BRITISH COUNCIL]`
- Part 1: 3 personal questions (30s each).
- Part 2: 1 photo + 3 questions (45s each). Candidate describes photo, recounts experience, gives opinion.
- Part 3: 2 photos + 3 questions (45s each). Candidate compares photos, speculates, gives opinion/preference.
- Part 4: 1 topic card with 3 questions, 60s prep, 120s continuous speaking answering all 3 questions.
- Total speaking duration: ~12 minutes.

### 2.2 Project Architecture & Audio Strategy `[PROJECT DESIGN DECISION]`
- **Response Granularity:**
  - Parts 1, 2, and 3 are modeled as distinct question items, allowing candidates to record, review, and grade each question response individually.
  - Part 4 is modeled as 1 continuous recording evaluating all 3 prompts together.
- **Audio Transport Strategy (`inlineData` vs. File API):** `[IMPLEMENTATION DETAIL]`
  - Short candidate recordings (30s–120s in WebM/Opus, MP3, or AAC) have payload sizes ranging from 100KB to 1.5MB.
  - Using Gemini's native `inlineData` Base64 transport eliminates extra network round-trips (uploading, state polling, and deleting temporary files via the File API).
  - Maximum upload size is strictly capped at **10MB** decoded audio on the server.
- **Audio Quality Classification:** `[IMPLEMENTATION DETAIL]`
  - `"sufficient"`: Valid recognizable English speech detected.
  - `"insufficient"`: Pure silence, extreme noise, or corrupted stream. Awards 0 points with diagnostic explanation rather than fabricating a language score.

### 2.3 AI Limitations & Disclaimer `[MODEL LIMITATION]`
- **Pronunciation:** AI evaluates observable speech characteristics (articulation clarity, intelligibility, syllable stress, common vowel/consonant cluster distortions) without claiming laboratory-grade acoustic or phonetic precision.
- **Fluency:** AI evaluates speech rate, natural rhythm, and absence of unnatural long silences without relying on simplistic word-count formulas.
- **Transcript:** Any transcript returned is labeled:  
  `AI-generated transcript — not guaranteed verbatim`.
- **Score Disclaimer:** All outputs are labeled:  
  `PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE`.
