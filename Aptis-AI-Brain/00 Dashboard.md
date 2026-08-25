---
type: dashboard
role: brain-overview
last_updated: 2026-08-25
status: phase-2-complete
coverage: five-skills-full
---

# 🧠 Aptis AI Knowledge Brain — Five-Skill Architecture Dashboard

Chào mừng đến với **Aptis AI Knowledge Brain** của hệ thống **WebAptis B2**.
Knowledge Brain là cơ sở tri thức học thuật chuẩn hóa, độc lập và toàn diện, đóng vai trò làm bộ não cho **AI Tutor (Lexi AI Coach)** và **AI Examiner** của nền tảng WebAptis B2.

> [!IMPORTANT]
> **Phân định kiến trúc cốt lõi:**
> - **Knowledge Brain (`Aptis-AI-Brain/`):** Lưu trữ lý thuyết giảng dạy, chiến thuật làm bài, từ điển collocations, tiêu chí chấm điểm (Rubrics), chẩn đoán lỗi sai và mẫu bài chuẩn.
> - **Exam Runtime (`project/data/`):** Lưu trữ 16 bộ đề thi thử, server answer keys và dữ liệu phiên thi.

---

## 📊 Ma Trận Phân Khu Tri Thức (Knowledge Domain Matrix)

| Phân khu | Chức năng chính | Tài liệu nguồn Edulife | Trạng thái Coverage |
| :--- | :--- | :--- | :---: |
| [[00_System/Brain Rules\|00_System]] | Quy tắc điều phối, Source/Answer/Retrieval Policy, Template | Hệ thống quy chuẩn | ✅ COMPLETE |
| [[01_Exam/Exam Format\|01_Exam]] | Cấu trúc tổng quan và định dạng 5 kỹ năng Aptis B2 | Slide 01 & Format Docs | ✅ COMPLETE |
| [[02_Grammar/Tenses/Present Perfect\|02_Grammar]] | 25 chủ điểm ngữ pháp cốt lõi (Thì, Mệnh đề, Bị động, Điều kiện) | Slide `23-grammar.pptx` & B1 PDF | ✅ COMPLETE |
| [[03_Vocabulary/Collocations/Essential B2 Collocations\|03_Vocabulary]] | 4 dạng từ vựng (Đồng nghĩa, Định nghĩa, Điền từ, Collocations) | Slide `24-vocabulary.pptx` | ✅ COMPLETE |
| [[04_Writing/Overview/Writing Overview & Assessment\|04_Writing]] | Kỹ năng Viết Parts 1-4, Thư trang trọng/thân mật, Ngữ vực | Slide 07, 08, 09, 11 & PDFs | ✅ COMPLETE |
| [[05_Speaking/Overview/Speaking Overview & Assessment\|05_Speaking]] | Kỹ năng Nói Parts 1-4, Miêu tả/So sánh ảnh, Thuyết trình 2p | Slide 02, 03, 04, 05, 06 & PDFs | ✅ COMPLETE |
| [[06_Reading/Overview/Reading Overview & Timing\|06_Reading]] | Kỹ năng Đọc Parts 1-4, Kỹ thuật Skimming/Scanning, Ghép tiêu đề | Slide 12, 13, 14, 15, 16 | ✅ COMPLETE |
| [[07_Listening/Overview/Listening Overview & Timing\|07_Listening]] | Kỹ năng Nghe Parts 1-4, Bẫy số/giá tiền, Phân tích ý kiến người nói | Slide 17, 18, 19, 20, 21 | ✅ COMPLETE |
| [[08_Teaching-Materials/Grammar/Edulife 23-Grammar Lecture Note\|08_Teaching-Materials]] | Ghi chú nguồn gốc 2 bài giảng mới `23-grammar` & `24-vocab` | Slide 23 & 24 | ✅ COMPLETE |
| [[09_Question-Insights/Mock Tests/16 Mock Tests Insight Summary\|09_Question-Insights]] | Tổng hợp phân tích 16 Mock Tests, 24 Writing & 94 Speaking Topics | Datasets & Prediction Banks | ✅ COMPLETE |
| [[10_QA/Provenance/Edulife Materials Provenance\|10_QA]] | Provenance nguồn gốc, Báo cáo kiểm định 5 kỹ năng | QA Records | ✅ COMPLETE |
| [[11_Grading/Writing/Writing Rubric & Evaluation Criteria\|11_Grading]] | Tiêu chí đánh giá, Rubric chấm điểm Writing & Speaking | British Council / Edulife | ✅ COMPLETE |
| [[12_Feedback/Writing/Writing Diagnostic & Step-by-Step Correction\|12_Feedback]] | Chẩn đoán lỗi, quy trình chữa bài từng bước (Diagnostic Framework) | Sư phạm Edulife | ✅ COMPLETE |
| [[13_Strategies/Writing/Email Planning & Word Count Management\|13_Strategies]] | Chiến thuật làm bài chuyên sâu cho cả 5 kỹ năng | Giảng viên Edulife | ✅ COMPLETE |
| [[14_Examples/Writing/Writing Annotated Samples\|14_Examples]] | Kho bài mẫu (Model Answers), Phân tích bài làm Đạt vs Chưa đạt | Dữ liệu kiểm thử & Edulife | ✅ COMPLETE |
| [[15_User-Memory/README\|15_User-Memory]] | Thiết kế schema bộ nhớ học viên (Lỗi lặp lại, Lộ trình khắc phục) | Architecture Concept | 📂 DESIGNED |

---

## 🔗 Liên Kết Truy Xuất Nhanh
- [[00_System/Brain Rules|Brain Rules]] • [[00_System/Retrieval Policy|Retrieval Policy]] • [[00_System/Evaluation Note Template|Evaluation Note Template]]
- [[10_QA/five-skill-knowledge-coverage|Bảng kiểm tra độ bao phủ tri thức 5 kỹ năng (Coverage Matrix)]]
- [[10_QA/phase-2-teaching-knowledge-audit|Báo cáo thẩm định toàn diện Phase 2]]
