# BÁO CÁO KIỂM ĐỊNH: OBSIDIAN KNOWLEDGE BRAIN FOUNDATION (PHASE 1)

> **Dự án:** WebAptis B2 — Hệ thống luyện thi & AI Tutor Knowledge Brain  
> **Chế độ:** Phase 1 — Initialize Obsidian Knowledge Brain (Foundation)  
> **Thời điểm xác nhận:** 2026-08-25  
> **Trạng thái:** **BRAIN FOUNDATION READY (PASS)**

---

## 1. OBSIDIAN ENVIRONMENT (MÔI TRƯỜNG OBSIDIAN TRÊN WINDOWS)

- **Trạng thái cài đặt:** Đã nhận diện Obsidian đã cài đặt trên hệ thống Windows.
- **Đường dẫn thực thi:** `C:\Program Files\Obsidian\Obsidian.exe`
- **Cấu hình Vault:** Hỗ trợ chuẩn Markdown, Obsidian Frontmatter Properties, Internal Wiki Links `[[link]]`, Backlinks và Search.
- **Plugins:** Giữ nguyên trạng thái mặc định (Vanilla Core), không cài đặt community plugins không cần thiết.

---

## 2. VAULT PATH (VỊ TRÍ VAULT)

- **Vị trí Vault chính thức:**  
  `d:\ỨNG DỤNG AI AGENT CHO NGHIÊN CỨU KHOA HỌC-20260513T124251Z-3-001\WebAptis\Aptis-AI-Brain\`
- **Tính độc lập:** Nằm tại thư mục gốc của dự án nhưng hoàn toàn tách biệt khỏi mã nguồn WebAptis Runtime (`project/`).

---

## 3. VAULT STRUCTURE (CẤU TRÚC THƯ MỤC VAULT)

```
Aptis-AI-Brain/
│
├── 00 Dashboard.md
│
├── 00_System/
│   ├── Brain Rules.md
│   ├── Source Policy.md
│   ├── Answer Policy.md
│   ├── Retrieval Policy.md
│   └── Knowledge Note Template.md
│
├── 01_Exam/
│   ├── Exam Format.md
│   ├── Grammar & Vocabulary.md
│   ├── Reading.md
│   ├── Listening.md
│   ├── Writing.md
│   └── Speaking.md
│
├── 02_Grammar/
│   ├── Tenses/
│   ├── Modals/
│   ├── Conditionals/
│   ├── Passive/
│   ├── Reported Speech/
│   ├── Clauses/
│   └── Common Errors/
│
├── 03_Vocabulary/
│   ├── General/
│   ├── Travel/
│   ├── Education/
│   ├── Work/
│   ├── Environment/
│   ├── Technology/
│   └── Collocations/
│
├── 04_Writing/
│   ├── Part 1/
│   ├── Part 2/
│   ├── Part 3/
│   ├── Part 4/
│   ├── Useful Language/
│   ├── Structures/
│   └── Common Errors/
│
├── 05_Speaking/
│   ├── Part 1/
│   ├── Part 2/
│   ├── Part 3/
│   ├── Part 4/
│   ├── Useful Language/
│   └── Common Errors/
│
├── 06_Reading/
│   ├── Part 1/
│   ├── Part 2/
│   ├── Part 3/
│   ├── Part 4/
│   └── Strategies/
│
├── 07_Listening/
│   ├── Part 1/
│   ├── Part 2/
│   ├── Part 3/
│   ├── Part 4/
│   └── Strategies/
│
├── 08_Teaching-Materials/
│   ├── Grammar/
│   └── Vocabulary/
│
├── 09_Question-Insights/
│   ├── Mock Tests/
│   ├── Writing Prediction/
│   └── Speaking Prediction/
│
└── 10_QA/
    ├── Bugs/
    ├── Audits/
    └── Provenance/
```

---

## 4. TEACHING MATERIAL INVENTORY (KIỂM KÊ TÀI LIỆU GIẢNG DẠY MỚI)

Đã phát hiện và phân tích 2 tài liệu giảng dạy trọng tâm của Edulife trong `APTIS/`:

| STT | Tên file tài liệu | Đường dẫn gốc | Định dạng | Dung lượng | Quy mô nội dung | Phân loại mục đích |
| :---: | :--- | :--- | :---: | :---: | :--- | :--- |
| 1 | `22-tong-quan-grammar-and-vocabulary.pptx` | `APTIS/22-tong-quan-grammar-and-vocabulary.pptx` | PPTX | 1.72 MB | 19 slides | Bài giảng tổng quan Grammar & Vocab Edulife |
| 2 | `B1 - LÝ THUYẾT (1).pdf` | `APTIS/B1 - LÝ THUYẾT (1).pdf` | PDF | 19.51 MB | 65 trang | Giáo trình lý thuyết ngữ pháp, từ vựng & kỹ năng B1-B2 |

---

## 5. GRAMMAR FILE PROVENANCE (NGUỒN GỐC TÀI LIỆU NGỮ PHÁP)

- **Tên nguồn:** `22-tong-quan-grammar-and-vocabulary.pptx`
- **Đơn vị phát hành:** Edulife (https://edulife.com.vn/)
- **Đặc điểm nội dung:**
  - Slide 1–4: Giới thiệu thông tin bài thi Aptis Grammar & Vocabulary (25 câu ngữ pháp, 25 câu từ vựng, 25 phút).
  - Slide 5–10: Phân loại Ngữ pháp viết (Formal Grammar) vs Ngữ pháp nói (Spoken Grammar), dạng trắc nghiệm 3 lựa chọn, lưu ý phương pháp loại trừ.
  - Slide 11–19: 4 dạng bài Từ vựng chính (Từ đồng nghĩa, Định nghĩa từ, Hoàn thành câu, Collocations) và chiến thuật học Word Families.
- **Trạng thái trong AI Brain:** `ai_knowledge: true`, `runtime_exam_content: false`, `verified: true`.
- **Ghi chú note tương ứng:** [[08_Teaching-Materials/Grammar/Edulife Grammar & Vocabulary Overview]]

---

## 6. VOCABULARY FILE PROVENANCE (NGUỒN GỐC TÀI LIỆU TỪ VỰNG)

- **Tên nguồn:** `B1 - LÝ THUYẾT (1).pdf`
- **Đơn vị phát hành:** Edulife
- **Đặc điểm nội dung:**
  - Trang 1–9: Hệ thống toàn bộ thì động từ (Hiện tại đơn, Quá khứ đơn, Tương lai, Tiếp diễn, Hoàn thành), Modal Verbs, Câu điều kiện (Conditionals 1, 2, 3), Câu bị động (Passive Voice), Mệnh đề quan hệ và Cấu trúc so sánh.
  - Trang 10–65: Ngữ cảnh hội thoại, từ vựng theo chủ đề (Du lịch, Công nghệ, Môi trường, Giáo dục, Mối quan hệ), Collocations, Phrasal Verbs và mẫu câu phản xạ giao tiếp.
- **Trạng thái trong AI Brain:** `ai_knowledge: true`, `runtime_exam_content: false`, `verified: true`.
- **Ghi chú note tương ứng:** [[08_Teaching-Materials/Grammar/Edulife B1-B2 Theory Textbook]] & [[08_Teaching-Materials/Vocabulary/Edulife Vocabulary Teaching Guide]]

---

## 7. METADATA SCHEMA (QUY CHUẨN FRONTMATTER YAML)

Mỗi note trong Knowledge Brain tuân theo schema thuộc tính tiêu chuẩn:
```yaml
---
type: teaching-material # teaching-material | strategy | common-error | exam-format | question-insight | provenance
skill: grammar # grammar | vocabulary | reading | listening | writing | speaking | general
part: general # general | part1 | part2 | part3 | part4 | grammar | vocabulary
level: B2 # B1 | B2 | C | General
provider: Edulife # Edulife | British Council | Project | General
source_file: "..." # Tên file gốc
source_type: pdf # pdf | docx | pptx | manual | hybrid
verified: true # true | false
ai_knowledge: true # true | false
runtime_exam_content: false # Luôn false đối với tài liệu học tập
tags:
  - AptisB2
  - Grammar
  - TeachingMaterial
---
```

---

## 8. BRAIN RULES (NGUYÊN TẮC QUẢN TRỊ AI BRAIN)

Đã thiết lập tại [[00_System/Brain Rules]]:
1. **Suggested Questions chỉ là Shortcut UI:** Không phải danh sách whitelist cứng nhắc.
2. **Hỗ trợ đầy đủ Free-form User Questions:** Người học có quyền đặt mọi câu hỏi học thuật tự do.
3. **Không tạo nội dung thi / điểm số / đáp án giả mạo:** Giữ vững đạo đức AI và tính chính xác học thuật.
4. **Phân định rõ ranh giới:** Tách bạch giữa Teaching Materials (Giáo trình) và Exam Content (Bài thi thử).
5. **Bảo vệ an toàn thông tin:** Không rò rỉ server-side answer keys khi thí sinh đang làm bài thi.

---

## 9. RETRIEVAL POLICY (CHÍNH SÁCH TRUY XUẤT TRI THỨC)

Đã thiết lập tại [[00_System/Retrieval Policy]]:
- **Pipeline:** `User Query` $\rightarrow$ `Intent Classification` $\rightarrow$ `Multi-Vector & Keyword Retrieval` $\rightarrow$ `Context Assembly` $\rightarrow$ `LLM Generation`.
- **Xử lý lỗi truy xuất:** Khắc phục triệt để lỗi từ chối câu hỏi tự do ngoài danh sách gợi ý bằng cơ chế phân tích ngữ nghĩa mở và fallback tri thức tổng quát.

---

## 10. FILES CREATED (DANH MỤC CÁC FILE ĐÃ TẠO TRONG VAULT)

1. `00 Dashboard.md`
2. `00_System/Brain Rules.md`
3. `00_System/Source Policy.md`
4. `00_System/Answer Policy.md`
5. `00_System/Retrieval Policy.md`
6. `00_System/Knowledge Note Template.md`
7. `01_Exam/Exam Format.md`
8. `01_Exam/Grammar & Vocabulary.md`
9. `01_Exam/Reading.md`
10. `01_Exam/Listening.md`
11. `01_Exam/Writing.md`
12. `01_Exam/Speaking.md`
13. `08_Teaching-Materials/Grammar/Edulife Grammar & Vocabulary Overview.md`
14. `08_Teaching-Materials/Grammar/Edulife B1-B2 Theory Textbook.md`
15. `08_Teaching-Materials/Vocabulary/Edulife Vocabulary Teaching Guide.md`
16. `10_QA/Provenance/Edulife Materials Provenance.md`
17. `10_QA/brain-foundation-audit.md`

---

## 11. FILES NOT MODIFIED (DANH MỤC FILE KHÔNG THAY ĐỔI)

- **WebAptis Project Runtime:** Giữ nguyên 100% (`project/components/`, `project/app/`, `project/lib/`, `project/tests/`).
- **Mock Tests Datasets:** Giữ nguyên 100% (`project/data/tests/*.json`).
- **Answer Keys:** Giữ nguyên 100% (`project/data/tests/*-answers.json`).
- **Prediction Banks:** Giữ nguyên 100% (`project/data/prediction/`).
- **Assets (Images & Audio):** Giữ nguyên 100% (`project/public/audio/`, `project/public/images/`).
- **Source Documents:** Giữ nguyên 100% trong `APTIS/`.

---

## 12. WEBAPTIS RUNTIME INTEGRITY (XÁC MINH TÍNH TOÀN VẸN RUNTIME)

- `git status` kiểm tra: Toàn bộ thư mục `project/` không có bất kỳ thay đổi nào làm ảnh hưởng đến Runtime, Typecheck, Build hay Smoke Test.

---

## 13. PHASE 2 RECOMMENDATIONS (ĐỀ XUẤT CHO PHASE 2)

1. **Chuẩn hóa Topic Notes (Topic Normalization):**
   - Phân rã 65 trang của `B1 - LÝ THUYẾT (1).pdf` thành các atomic notes theo từng chuyên đề cụ thể (VD: `02_Grammar/Tenses/Present Perfect.md`, `02_Grammar/Conditionals/Third Conditional.md`).
2. **Xây dựng Collocation & Synonym Dictionary:**
   - Tạo các bảng tra cứu nhanh theo chủ đề trong `03_Vocabulary/`.
3. **Triển khai Knowledge Retrieval Layer:**
   - Kết nối trình phân tích Intent và vector search để AI Coach truy xuất trực tiếp từ các atomic notes này khi trả lời câu hỏi tự do của học viên.

---

## 14. FINAL VERDICT (KẾT LUẬN CUỐI CÙNG)

```
================================================================================
                FINAL VERDICT: [BRAIN FOUNDATION READY]
================================================================================
- Môi trường Obsidian đã được nhận diện trên Windows.
- Vault Aptis-AI-Brain được khởi tạo với cấu trúc 11 phân khu hoàn chỉnh.
- 2 tài liệu giảng dạy Edulife được kiểm kê và phân loại provenance chuẩn xác.
- Brain Rules, Source Policy, Answer Policy và Retrieval Policy đã sẵn sàng.
- Ranh giới giữa Knowledge Brain và WebAptis Exam Runtime được bảo vệ tuyệt đối.
================================================================================
```
