---
type: architecture-concept
category: personalization
level: system
verified: true
ai_knowledge: false
runtime_exam_content: false
tags:
  - UserMemory
  - Personalization
  - Architecture
---

# 🧠 User Memory Architecture Concept (Thiết Kế Bộ Nhớ Học Viên)

Đây là khung kiến trúc chuẩn bị cho tính năng cá nhân hóa lộ trình ôn luyện của AI Tutor trong các giai đoạn phát triển tiếp theo.

## Schema Khái Niệm Bộ Nhớ Người Học
```json
{
  "userId": "string",
  "targetBand": "B2",
  "weakSkills": ["listening", "writing"],
  "recurringErrors": {
    "grammar": ["present_perfect_vs_past_simple", "third_conditional"],
    "vocabulary": ["preposition_collocations"],
    "writing": ["informal_contractions_in_formal_email"],
    "speaking": ["hesitation_fillers_overuse"]
  },
  "completedMilestones": [
    "grammar_mastery_level_1",
    "email_formal_structure_mastery"
  ],
  "recommendedNextTopics": [
    "02_Grammar/Conditionals/Conditional Sentences",
    "04_Writing/Part 4/Part 4 Informal & Formal Emails"
  ]
}
```
