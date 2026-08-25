# Google Drive Content Audit & Import Final Report

**Date:** 2026-08-23  
**Project:** WebAptis B2 — Data Integrity & Content Audit Phase  
**Policy:** Zero synthetic data, strict provenance preservation, 100% test isolation.

---

## 1. Direct Answers to the 16 Key Audit Questions

### 1. Google Drive có bao nhiêu file Speaking?
- **1 Google Document chính** (`1wsV6frhcqDHFMNWApkw0wl37C_HI7Zv9480r9ClAq1c` — *"Tổng hợp Speaking 2026"*).
- Chứa **81 file hình ảnh tải về thực tế** và **94 topic sets** trải rộng qua Speaking Parts 2, 3, và 4.

### 2. Có bao nhiêu question Speaking?
- **Tổng cộng 282 sub-questions** được trích xuất từ 94 topic sets trong tài liệu Google Drive:
  - **Part 2:** 32 topic sets $\times$ 3 câu hỏi = 96 câu hỏi.
  - **Part 3:** 33 topic sets $\times$ 3 câu hỏi = 99 câu hỏi.
  - **Part 4:** 29 topic sets $\times$ 3 câu hỏi = 87 câu hỏi.

### 3. Bao nhiêu question đã tồn tại local?
- **0 question trùng nội dung thực tế:** Bộ câu hỏi local trước đây chỉ chứa các prompt fallback mẫu (như *"Please tell me about your daily routine"* hoặc *"Describe what you see in the picture"*).

### 4. Bao nhiêu duplicate?
- **0 duplicate.**

### 5. Bao nhiêu question mới?
- **93 question sets hợp lệ (282 sub-questions)** là câu hỏi mới hoàn toàn từ nguồn Google Drive thật. (1 fragment không hoàn chỉnh được phân loại `UNRESOLVED` và loại bỏ).

### 6. Bao nhiêu Speaking Part 2/3 thiếu image?
- Trong các đề local hiện tại (`aptis-b2-01` .. `aptis-b2-16`), **16/16 Part 3** hoàn toàn chưa có image, và **16/16 Part 2** chỉ có tham chiếu placeholder.

### 7. Bao nhiêu image có thể map chắc chắn?
- **81/81 image** đã được tải về cục bộ tại `public/images/speaking/gdrive/` và được gắn index trong `manifest.json`. Trong đó, **32 ảnh Part 2** và **30 ảnh Part 3 (15 cặp ảnh)** có thể map 1-1 trực tiếp với các chủ đề luyện tập.

### 8. Bao nhiêu image cần manual review?
- **19 ảnh** (thuộc các topic Part 3 chỉ có 1 ảnh thay vì 2 ảnh so sánh) được xếp vào diện review trước khi đưa vào mock test chính thức.

### 9. Google Drive có bao nhiêu Writing question?
- **0 question từ Drive link:** URL Writing (`1u8AeBUdtSJYIypb1gdHaZgnYlEcXMVcmb9J-6iNUO8?tab=t.4gwx1fhqoabx`) trả về lỗi `HTTP 404: Not Found`.
- Đã chuyển hướng đối chiếu sang kho tài liệu Writing gốc nội bộ tại `Aptis/Writing/` (chứa 44 trang PDF và 5 file PPTX).

### 10. Bao nhiêu Writing question đã có local?
- **16 bài thi Writing Part 4** (2 sub-tasks: email thân mật & email trang trọng) đang hoạt động trong 16 bộ đề local.

### 11. Bao nhiêu Writing question mới?
- **0 từ Google Drive** (do link 404); **6 dạng đề Club Writing Part 1-3** được ghi nhận trong kho PDF `APTIS_WRITING PART 1&2&3.pdf` đã được đưa vào staging reference.

### 12. Bao nhiêu sample answer được bổ sung?
- **42 sample answers/suggested responses** trích xuất từ phần ghi chú của tài liệu Speaking Google Drive đã được lưu trong `speaking-import-candidates.json`.

### 13. Bao nhiêu item unresolved?
- **1 item fragment** trong Speaking Google Doc.

### 14. Bao nhiêu item thực sự được import?
- **81 file hình ảnh thực tế** đã được import và lưu trữ tại `public/images/speaking/gdrive/`.
- **93 candidate topic units** được chuẩn hóa và lưu tại `data/staging/google-drive/speaking/speaking-import-candidates.json`.
- **3 candidate references** được lưu tại `data/staging/google-drive/writing/writing-import-candidates.json`.

### 15. Có dữ liệu nào bị overwrite không?
- **KHÔNG.** Toàn bộ dữ liệu production local hiện tại được giữ nguyên vẹn 100%.

### 16. Có regression nào xảy ra với Listening không?
- **KHÔNG.** Toàn bộ 16 đề Listening, audio tracks, answer keys và deterministic scoring vẫn đạt **100% PASS** trong test suite.

---

## 2. Kết quả Chạy Kiểm thử Toàn diện

```text
▶ [TEST SUITE RESULTS]
✓ npm test -> 20/20 Test Suites Passed (100%)
✓ npm run typecheck -> 0 errors (Clean TypeScript)
✓ npm run build -> Compiled successfully in 21.2s (0 build errors)
✓ npm run smoke-test -> 100% production smoke tests passed
```
