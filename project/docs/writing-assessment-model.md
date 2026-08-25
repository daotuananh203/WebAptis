# Aptis ESOL General (B2) — Writing Assessment Model

**Document Version:** 1.0.0  
**Date:** 2026-08-22  
**Authority:** British Council Aptis ESOL Candidate Guides & Teacher Specifications  
**Application Context:** Automated AI-Assisted Practice Feedback Engine  

---

## 1. Official Sources & Verified Criteria

| Writing Component | Official Criteria & Focus | Scale / Level Mapping | Status Label |
| :--- | :--- | :--- | :--- |
| **Part 1 (Form Filling)** | Task achievement, intelligibility of responses, factual relevance, basic spelling. | 5 items (0–5 raw marks). | `[VERIFIED — BRITISH COUNCIL]` |
| **Part 2 (Short Text)** | Task fulfillment, complete sentence structures, grammatical accuracy, spelling & punctuation (20–30 words). | Band A0 to B1+. | `[VERIFIED — BRITISH COUNCIL]` |
| **Part 3 (Social Network Chat)** | Task fulfillment, conversational fluency, response relevance across 3 separate messages, grammar accuracy, lexical resource (~40 words each). | Band A0 to B2. | `[VERIFIED — BRITISH COUNCIL]` |
| **Part 4 (Email Writing)** | Task achievement, Register & Tone (Informal 40–50w vs Formal 120–150w), Cohesion & Coherence, Grammar range & accuracy, Lexical resource. | Band A0 to C. | `[VERIFIED — BRITISH COUNCIL]` |

---

## 2. Distinction Between Official Rules & Project Abstractions

### 2.1 Verified British Council Rules `[VERIFIED — BRITISH COUNCIL]`
- Part 1: 5 short prompts, single words or short phrases (1–5 words).
- Part 2: Personal form / interest context, full sentences, 20–30 words.
- Part 3: 3 distinct questions in a social club chatroom, around 40 words each.
- Part 4: Two emails responding to a club notification:
  - Task 4A: Informal email to a friend (40–50 words) expressing feelings and preferences.
  - Task 4B: Formal email to an authority/president (120–150 words) using polite structures, paragraphs, and formal register.
- Scaling: British Council uses human and automated examiners to convert raw writing performances into an overall component score (0–50) and CEFR level.

### 2.2 Project Grading Design `[PROJECT GRADING DESIGN]`
- **Practice Rubric Sub-scores (0–5 Scale):**
  - *Task Achievement:* Did the candidate answer all required prompts within the designated word guidance?
  - *Register & Tone:* (Part 4 only) Did the candidate differentiate informal friendly language from formal professional structures?
  - *Grammar Accuracy & Range:* Were complex B2 structures attempted with minimal errors?
  - *Lexical Resource:* Was a diverse, accurate vocabulary used appropriately?
  - *Coherence & Cohesion:* Were linking words and paragraphing applied logically?
- **Deterministic Word Counter:** Word counts are calculated on the server using `countWords()` rather than trusting AI self-reported counts.
- **Diagnostic Feedback:**
  - Sentence-by-sentence error pinpointing (Original sentence -> Corrected sentence -> Grammatical rationale).
  - B2 vocabulary upgrade recommendations.
  - Project-generated B2 model answer for reference.

### 2.3 Non-Verified / Excluded Claims `[NOT VERIFIED]`
- The application does **NOT** claim to provide an official British Council exam mark or an accredited CEFR certificate.
- All evaluation outputs are labeled:  
  `PRACTICE ESTIMATE — NOT AN OFFICIAL BRITISH COUNCIL SCORE`.

---

## 3. Part-by-Part Evaluation Criteria

```text
Writing Evaluation Hierarchy
├── Part 1 (Form Filling)
│   ├── Factual Relevance (0–5 pts)
│   └── Spelling & Clarity
│
├── Part 2 (Personal Description)
│   ├── Task Fulfillment (20–30 words)
│   ├── Grammar & Sentence Formation
│   └── Punctuation & Spelling
│
├── Part 3 (Social Network Chat)
│   ├── Relevance to 3 Member Messages (~40 words each)
│   ├── Conversational Cohesion & Fluency
│   └── Grammar & Vocabulary Range
│
└── Part 4 (Email Writing)
    ├── Task Achievement (Notice Comprehension)
    ├── Register Distinction (Informal 40–50w vs Formal 120–150w)
    ├── Grammatical Range & Accuracy (B2 Conditionals, Modals, Passive)
    └── Lexical Resource & Formal Sign-offs
```
