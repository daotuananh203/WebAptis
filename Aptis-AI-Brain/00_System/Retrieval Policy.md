---
type: system-rule
category: retrieval-architecture
priority: high
last_updated: 2026-08-25
---

# 🔍 Retrieval Policy — Quy Tắc Truy Xuất Tri Thức Cho AI Tutor

Quy chuẩn này xác định luồng xử lý và truy xuất thông tin từ Obsidian Knowledge Brain sang AI Tutor.

---

## 1. Luồng Xử Lý Truy Xuất (Knowledge Retrieval Flow)

```mermaid
flowchart TD
    UserQuery["1. User Query<br>(Free-form hoặc Suggested Question)"] --> Classifier["2. Intent Classification & Skill Tagging<br>(Grammar, Vocab, Strategy, Exam Part)"]
    Classifier --> Retriever["3. Multi-Vector & Keyword Knowledge Retrieval<br>(Obsidian Knowledge Brain)"]
    Retriever --> Notes["4. Relevant Notes Filtering & Ranking<br>(Max 3-5 targeted snippets)"]
    Notes --> Context["5. Context Assembly with Provenance Metadata"]
    Context --> LLM["6. LLM Generation (Lexi AI Coach Prompt)"]
    LLM --> Response["7. Verified Academic Response to User"]
```

---

## 2. Xử Lý Câu Hỏi Tự Do (Free-Form Questions Support)
- **Không bao giờ từ chối câu hỏi tự do:** Bất kể người dùng gõ câu hỏi ngắn, câu hỏi dài, câu hỏi bằng tiếng Việt hay tiếng Anh, hệ thống đều phân tích semantic để tìm note phù hợp nhất.
- **Fall-back thông minh:** Nếu câu hỏi không khớp trực tiếp với ghi chú Edulife nào, hệ thống sử dụng tri thức tiếng Anh tổng quát chuẩn CEFR B2 và nêu rõ ngữ cảnh.
- **Truy xuất theo Tags & Properties:**
  - `skill`: `grammar`, `vocabulary`, `reading`, `listening`, `writing`, `speaking`
  - `level`: `B1`, `B2`, `General`
  - `type`: `teaching-material`, `strategy`, `common-errors`
