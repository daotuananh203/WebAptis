---
type: governance
skill: general
tags: [user-memory, profile, adaptive-learning, diagnostics]
---

# 🧠 User Learning Memory — Khung Hồ Sơ Điểm Yếu Cá Nhân Hóa

## Mục đích
Lưu trữ và theo dõi các lỗi ngữ pháp/từ vựng/chiến thuật lặp lại của học viên qua các lần làm bài tập, bài thi thử và phiên trò chuyện với AI Coach.

## Cấu trúc dữ liệu học tập (Profile Schema)

```json
{
  "userId": "usr_uuid",
  "recurringErrors": [
    {
      "topicId": "present-perfect-vs-past-simple",
      "skill": "Grammar",
      "errorCount": 3,
      "lastOccurred": "2026-08-25T00:45:00Z",
      "exampleMistake": "I have went there yesterday",
      "status": "active_weakness"
    },
    {
      "topicId": "formal-email-contractions",
      "skill": "Writing",
      "errorCount": 2,
      "lastOccurred": "2026-08-25T00:50:00Z",
      "exampleMistake": "I don't agree with this decision",
      "status": "improving"
    }
  ],
  "skillReadiness": {
    "grammarVocabulary": "B2_SOLID",
    "reading": "B2_PRACTICE_NEEDED",
    "listening": "B2_SOLID",
    "writing": "B1_TO_B2_TRANSITION",
    "speaking": "B2_SOLID"
  },
  "personalizedFocus": [
    "Khắc phục viết tắt trong Writing Part 4",
    "Rèn luyện kỹ thuật phân bổ thời gian Reading Part 4"
  ]
}
```
