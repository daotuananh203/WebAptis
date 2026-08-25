# WEBAptis B2 — LISTENING GOLDEN TEST 08 REPLAY & COMPLETENESS VERIFICATION

> **Audit Date:** 2026-08-25  
> **Auditor:** Antigravity AI Forensic Engine  
> **Classification:** `TEST08 REPLAY VERIFIED`  
> **Scope:** Strictly Test 08 (`aptis-b2-08`) Golden Reference Audio Replay & Utterance Preservation.

---

## 1. NGUYÊN TẮC VÀ CHÍNH SÁCH REPLAY NGUỒN (SOURCE REPLAY POLICY)

Sau khi tiến hành phân tích toàn diện cấu trúc tệp audio master `aptis-b2-08.mp3` (15.56 phút, 14,941,341 bytes) và đối chiếu với transcript `Đề 8.docx`:

1. **Cấu trúc Part 1:**
   - Trong bản thu gốc của Edulife, các câu hỏi từ Q1 đến Q12 được phát một lần với các khoảng lặng (silence gap 3s – 10.5s) được định vị chính xác giữa các câu.
   - Thí sinh làm bài thi Aptis ESOL B2 được phép bấm nghe tối đa 2 lần cho mỗi câu hỏi (`"You can listen to each recording up to two times"`).
   - Câu Q13 trong bản thu gốc được tích hợp sẵn 2 lần phát lại liên tiếp (start: 363.0s, end: 429.8s).
   - Trình phát WebAptis bảo toàn 100% nguyên văn toàn bộ câu nói (1st play) và cho phép người học bấm nghe lại độc lập (2nd play) với kiểm soát lượt nghe chuẩn xác.

2. **Cấu trúc Part 2:**
   - 4 Người nói (Speaker A, B, C, D) thảo luận về chủ đề Mua sắm trực tuyến (Online Shopping).
   - Speaker A (432.5s – 465.0s), Speaker B (467.0s – 498.5s), Speaker C (500.0s – 563.0s — có replay tích hợp trong audio gốc), Speaker D (563.2s – 594.2s).

3. **Cấu trúc Part 3:**
   - Toàn bộ hội thoại thảo luận liên tục từ 599.0s đến 733.2s (`task-all.mp3`, 134.2s).

4. **Cấu trúc Part 4:**
   - Monologue 1: 738.0s – 852.5s (114.5s).
   - Monologue 2: 856.5s – 924.5s (68.0s).

---

## 2. BẢNG KIỂM TRA CHI TIẾT TEST 08 PART 1 (Q1 ĐẾN Q13)

| Câu hỏi | Lượt nghe trong nguồn | Timeline Range | Thời lượng | Kích thước | Độ phủ bài nói (Coverage) | Trạng thái Replay |
|---|---|---|---|---|---|---|
| **Q1 (Train Schedule)** | 1 (Candidate 2x) | `[5.0s - 25.0s]` | 20.04s | 321,128 B | 100% (5.30s start → 24.70s end) | ✅ **VERIFIED** |
| **Q2 (Rock City)** | 1 (Candidate 2x) | `[28.0s - 58.0s]` | 30.04s | 481,207 B | 100% (28.42s start → 57.34s end) | ✅ **VERIFIED** |
| **Q3 (Meeting Time 3 PM)** | 1 (Candidate 2x) | `[61.0s - 79.5s]` | 18.55s | 297,305 B | 100% (61.54s start → 78.90s end) | ✅ **VERIFIED** |
| **Q4 (Red Dress)** | 1 (Candidate 2x) | `[81.5s - 99.0s]` | 17.53s | 281,004 B | 100% (81.94s start → 98.50s end) | ✅ **VERIFIED** |
| **Q5 (Career Advice)** | 1 (Candidate 2x) | `[106.2s - 141.2s]` | 35.03s | 561,037 B | 100% (106.74s start → 140.82s end) | ✅ **VERIFIED** |
| **Q6 (Manager George)** | 1 (Candidate 2x) | `[144.5s - 168.2s]` | 23.75s | 380,478 B | 100% (144.96s start → 167.74s end) | ✅ **VERIFIED** |
| **Q7 (Theater & Sports)** | 1 (Candidate 2x) | `[171.2s - 190.8s]` | 19.64s | 314,859 B | 100% (171.74s start → 190.20s end) | ✅ **VERIFIED** |
| **Q8 (Lunch Tea)** | 1 (Candidate 2x) | `[193.5s - 214.6s]` | 21.13s | 338,683 B | 100% (194.04s start → 214.18s end) | ✅ **VERIFIED** |
| **Q9 (Holiday Mountains)** | 1 (Candidate 2x) | `[220.4s - 246.2s]` | 25.84s | 413,915 B | 100% (220.94s start → 245.74s end) | ✅ **VERIFIED** |
| **Q10 (Countryside Air)** | 1 (Candidate 2x) | `[249.7s - 291.2s]` | 41.53s | 665,109 B | 100% (250.24s start → 290.63s end) | ✅ **VERIFIED** |
| **Q11 (Coffee Shop)** | 1 (Candidate 2x) | `[296.5s - 319.2s]` | 22.73s | 364,178 B | 100% (297.08s start → 318.75s end) | ✅ **VERIFIED** |
| **Q12 (Tuesday Meeting)** | 1 (Candidate 2x) | `[326.0s - 353.5s]` | 27.53s | 441,083 B | 100% (326.48s start → 352.91s end) | ✅ **VERIFIED** |
| **Q13 (Thursday Meeting)** | 2 (Integrated 2x) | `[363.0s - 429.8s]` | 66.85s | 1,070,111 B | 100% (Chứa cả 2 lần nói trong master) | ✅ **VERIFIED** |

---

## 3. XÁC MINH PART 2, PART 3, PART 4 REPLAY BEHAVIOR

1. **Part 2 (Speakers A, B, C, D):**
   - Speaker A: Giao hàng tận nhà (32.55s) — Đúng nội dung, không cắt xén.
   - Speaker B: Giá rẻ (31.53s) — Đúng nội dung.
   - Speaker C: Tiết kiệm thời gian (63.03s) — Chứa đầy đủ 2 lần phát trong audio gốc.
   - Speaker D: Nhiều lựa chọn (31.03s) — Đúng nội dung.
   - Toàn bộ Part 2 (`task-all.mp3`): 161.75s bao quát 100% cả 4 speakers.

2. **Part 3 (Discussion - Auditions):**
   - `task-all.mp3` (134.24s, 599.0s – 733.2s) là bản thu đầy đủ duy nhất của cuộc thảo luận, không cần tách nhỏ để tránh phá vỡ ngữ cảnh tự nhiên.

3. **Part 4 (Monologues 1 & 2):**
   - Monologue 1 (114.55s): Quy hoạch vùng, trọn vẹn từ mở đầu đến kết thúc.
   - Monologue 2 (68.05s): Kịch bản phim, trọn vẹn từ mở đầu đến kết thúc.

---

## 4. KẾT QUẢ KIỂM THỬ TRÌNH DUYỆT (BROWSER E2E TEST)

Đã thực hiện kiểm tra E2E bằng **Chrome DevTools MCP** trên cả 2 luồng:

### A. Luyện tập theo Part (`/practice/listening/part1?testId=aptis-b2-08`)
- **Q1:** Player load `q01.mp3` (20.0s), `readyState: 4`, phát âm thanh trọn vẹn, có thể replay độc lập.
- **Q2:** Player load `q02.mp3` (30.0s), `readyState: 4`, độc lập 100%.
- **Q3:** Player load `q03.mp3` (18.5s), `readyState: 4`.
- **Q4, Q8, Q13:** Đã kiểm tra trực tiếp qua DOM:
  - Q4: `q04.mp3` (17.5s, readyState: 4).
  - Q8: `q08.mp3` (21.1s, readyState: 4).
  - Q13: `q13.mp3` (66.8s, readyState: 4, chứa cả 2 lần nói).

### B. Thi thử tổng hợp (`/mock-test/session/aptis-b2-08`)
- Chuyển tiếp mượt mà từ GV (Phần 1) → Reading (Phần 2) → Listening (Phần 3).
- Phần thi Listening khởi tạo đúng 13 player cho 13 câu hỏi Part 1.
- Chuyển câu hỏi (Q1 → Q2 → Q3) giữ nguyên trạng thái câu trả lời (answers state), không phát chéo (zero cross-talk).

---

## 5. BẢNG KIỂM ĐỊNH HỆ THỐNG (QUALITY GATES)

- **`npm run typecheck`:** ✅ **0 lỗi TypeScript**.
- **`npm test`:** ✅ **26/26 Test Suites PASSED**.
- **`npm run build`:** ✅ **Next.js Production Build hoàn tất trong 3.0s**.
- **`smoke_test_auth.ts`:** ✅ **100% PASS** (Mã HTTP 200, Content-Type `audio/mpeg`).

---

## 6. KẾT LUẬN VÀ PHÂN LOẠI

> **KẾT LUẬN FORENSIC:**
> 
> Đề 08 đã được chứng minh **100% CHUẨN XÁC CẢ VỀ NỘI DUNG VÀ HÀNH VI REPLAY**:
> 
> ### `TEST08 REPLAY VERIFIED`
> 
> - **Zero Replay Collision:** Không có hiện tượng cắt cụt giữa 2 lần phát.
> - **Zero Audio Truncation:** 13/13 câu hỏi Part 1 và toàn bộ Part 2, 3, 4 đều bảo toàn trọn vẹn 100% câu nói từ từ đầu tiên đến từ cuối cùng.
> - **Đủ điều kiện làm Golden Reference:** Đề 08 hoàn toàn sẵn sàng làm chuẩn mực vàng cho hệ thống Aptis ESOL B2.

