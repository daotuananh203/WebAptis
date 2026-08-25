# BÁO CÁO TOÀN DIỆN: CONTENT INTEGRITY AUDIT — WEBAPTIS B2

**Ngày thực hiện:** 23/08/2026  
**Phạm vi:** Toàn bộ pipeline nội dung từ kho lưu trữ gốc `D:\APTIS` đến giao diện người dùng (UI) trên WebAptis.  
**Tính chất:** Audit độc lập, kiểm tra nguồn gốc dữ liệu, không sửa đổi code/data.

---

## 1. Executive Summary

Quá trình audit toàn diện đã đối chiếu từng tệp tin từ kho gốc `D:\APTIS` qua các tầng chuẩn hóa, dữ liệu production, thư viện luyện tập và giao diện hiển thị.

### Kết quả chính:
1. **Kho tài liệu gốc (`D:\APTIS`):** Chứa đầy đủ **16 bộ đề thi thực tế** với nội dung hoàn chỉnh và độc nhất cho cả 4 kỹ năng (Listening, Reading, Writing, Speaking), kèm 16 tệp đáp án, 16 tệp transcript và 15 tệp audio MP3 gốc (Đề 16 không có audio từ nguồn).
2. **Knowledge Base AI Coach:** Đã được tích hợp và xác minh thành công từ các bài giảng lý thuyết của Edulife (29 mục kiến thức, có đầy đủ source attribution, không mạo danh British Council).
3. **Thực trạng dữ liệu bài thi (Test Datasets 01–16) trên web:** 
   - Hiện tại, các tệp `project/data/tests/aptis-b2-[01..16]-public.json` và `resources/edulife/normalized/aptis-b2-[01..16].json` **CHƯA** chứa nội dung thật được parse từ 16 tệp DOCX của `D:\APTIS`.
   - Toàn bộ 16 đề hiện đang sử dụng **dữ liệu mẫu nhân bản (cloned synthetic template)** từ một bộ câu hỏi khung (tiểu sử William Bell, email Alex, Photography Club, v.v.) với mã tiền tố thay đổi (`t01_`, `t02_`, ..., `t16_`).
4. **Đường dẫn Audio Listening:** Đang trỏ về các URL không tồn tại (`/audio/listening/de_1_part1_q1.mp3`) vì thư mục `public/audio` chưa được tạo/mount.
5. **Thư viện Practice Index:** Tệp danh mục 272 bài `project/data/content-index/*.json` tồn tại nhưng **chưa từng được UI kết nối** (UI đang gọi cố định `aptis-b2-01`).
6. **Tính năng Speaking:** Giao diện ghi âm hiện là UI mô phỏng, gửi chuỗi base64 mẫu giả lập, chưa kết nối microphone / MediaRecorder thực tế.
7. **Bộ đếm giờ Practice:** Đang cố định ở mức 600 giây (10 phút) cho mọi kỹ năng/part thay vì theo thời lượng quy chuẩn từng phần.

---

## 2. Source Inventory (Kho lưu trữ D:\APTIS)

Tổng số tệp tin/thư mục: **124 mục**.

### Chi tiết các thư mục chính:
- `D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\01. Đề Luyện Tập\`:
  - 16 tệp DOCX (`Đề 1 - Aptis.docx` → `Đề 16 - Aptis.docx`).
  - **Phát hiện quan trọng:** Mặc dù nằm trong thư mục mang tên "Listening", mỗi tệp DOCX thực chất là **một bài thi tổng hợp hoàn chỉnh** chứa cả 4 phần: **Listening (Parts 1–4), Reading (Parts 1–4), Speaking (Parts 1–4), và Writing (Parts 1–4)**.
- `D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\02. Đáp án\`:
  - 16 tệp DOCX (`Đề 1.docx` → `Đề 16.docx`) chứa đáp án chính xác cho từng đề.
- `D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\03. Audio\`:
  - 15 tệp MP3 (`Đề 1.mp3` → `Đề 15.mp3`). Mỗi tệp là một bản ghi âm đầy đủ ~30–40 phút cho cả bài nghe.
  - `Đề 16`: Nguồn ghi rõ *"Hiện tại chưa có file bản nghe"* → không có file MP3.
- `D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\04. Transcript\`:
  - 16 tệp DOCX (`Đề 1.docx` → `Đề 16.docx`) chứa toàn văn lời thoại bài nghe.
- `D:\APTIS\Reading\`, `Writing\`, `Speaking\`:
  - Các bài giảng PPTX (Tổng quan, Part 1, 2, 3, 4) và tài liệu tổng hợp PDF/DOCX.
- `D:\APTIS\` (thư mục gốc):
  - `01. Tổng quan bài thi APTIS.pptx`, `22-tong-quan-grammar-and-vocabulary.pptx`, `B1 - LÝ THUYẾT (1).pdf`.

---

## 3. Test Coverage Matrix

Đối chiếu hiện trạng giữa **Nguồn gốc thực tế trong `D:\APTIS`** và **Dữ liệu hiện tại trong WebAptis**:

| Test ID | Reading (Nguồn) | Listening (Nguồn) | Audio MP3 (Nguồn) | Transcript (Nguồn) | Writing (Nguồn) | Speaking (Nguồn) | Key (Nguồn) | Trạng thái Ingest vào WebAptis |
|---|---|---|---|---|---|---|---|---|
| **aptis-b2-01** | ✅ Có thật (Email Anna/Tom, Making films) | ✅ Có thật (Small car cost 3250£) | ✅ Có (`Đề 1.mp3`) | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ⚠️ Đang dùng bản synthetic template |
| **aptis-b2-02** | ✅ Có thật (Email Henry/Mark, Music show) | ✅ Có thật (House changes, clinic clients) | ✅ Có (`Đề 2.mp3`) | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ⚠️ Nhân bản từ template test 01 |
| **aptis-b2-03** | ✅ Có thật (Lisa email, eco protection) | ✅ Có thật (Egg price £1.50, author routine) | ✅ Có (`Đề 3.mp3`) | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ⚠️ Nhân bản từ template test 01 |
| **aptis-b2-04** | ✅ Có thật (Sarah email, car park) | ✅ Có thật (Train departure time, Maria call) | ✅ Có (`Đề 4.mp3`) | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ⚠️ Nhân bản từ template test 01 |
| **aptis-b2-05** | ✅ Có thật (Đề thi đầy đủ) | ✅ Có thật (Platform announcement) | ✅ Có (`Đề 5.mp3`) | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ⚠️ Nhân bản từ template test 01 |
| **aptis-b2-06** | ✅ Có thật (Segmus English speaking) | ✅ Có thật (Tom calling friend, 6 PM) | ✅ Có (`Đề 6.mp3`) | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ⚠️ Nhân bản từ template test 01 |
| **aptis-b2-07** | ✅ Có thật (Đề thi đầy đủ) | ✅ Có thật (Family weekend routine) | ✅ Có (`Đề 7.mp3`) | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ⚠️ Nhân bản từ template test 01 |
| **aptis-b2-08** | ✅ Có thật (Friends series watching) | ✅ Có thật (Train leaves at 9:15) | ✅ Có (`Đề 8.mp3`) | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ⚠️ Nhân bản từ template test 01 |
| **aptis-b2-09** | ✅ Có thật (Hiking disaster holiday) | ✅ Có thật (Store cleaning products £1.50) | ✅ Có (`Đề 9.mp3`) | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ⚠️ Nhân bản từ template test 01 |
| **aptis-b2-10** | ✅ Có thật (Đề thi đầy đủ) | ✅ Có thật (Radio speaker announcement) | ✅ Có (`Đề 10.mp3`) | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ⚠️ Nhân bản từ template test 01 |
| **aptis-b2-11** | ✅ Có thật (Đề thi đầy đủ) | ✅ Có thật (Lalia trip bus fare) | ✅ Có (`Đề 11.mp3`) | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ⚠️ Nhân bản từ template test 01 |
| **aptis-b2-12** | ✅ Có thật (Website researching advice) | ✅ Có thật (Man calling sister meeting) | ✅ Có (`Đề 12.mp3`) | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ⚠️ Nhân bản từ template test 01 |
| **aptis-b2-13** | ✅ Có thật (Đề thi đầy đủ) | ✅ Có thật (Max computer payment price) | ✅ Có (`Đề 13.mp3`) | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ⚠️ Nhân bản từ template test 01 |
| **aptis-b2-14** | ✅ Có thật (Housing development plan) | ✅ Có thật (Waiter drink choice) | ✅ Có (`Đề 14.mp3`) | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ⚠️ Nhân bản từ template test 01 |
| **aptis-b2-15** | ✅ Có thật (Clothing store David, Book club) | ✅ Có thật (Late time calling mother) | ✅ Có (`Đề 15.mp3`) | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ⚠️ Nhân bản từ template test 01 |
| **aptis-b2-16** | ✅ Có thật (Reading books feelings) | ✅ Có thật (Taking staff to place) | ❌ Không có (Nguồn thiếu) | ✅ Có | ✅ Có | ✅ Có | ✅ Có | ⚠️ Nhân bản từ template test 01 |

---

## 4. Data Pipeline Trace (Truy vết từng Kỹ năng)

### Sơ đồ luồng thiết kế kỳ vọng:
```
D:\APTIS\*.docx / *.mp3
       ↓
resources/edulife/normalized/aptis-b2-[01..16].json
       ↓
project/data/tests/aptis-b2-[01..16]-public.json  &  *-answers.json
       ↓
project/data/content-index/*.json
       ↓
API (/api/tests/[testId], /api/grade/*)
       ↓
UI (/practice, /practice/[skill]/[part], /mock-test, /mock-test/session/[testId])
```

### Hiện trạng thực tế phát hiện qua Audit:
1. **Tầng Normalization & Production (`resources/edulife/normalized/` & `project/data/tests/`):**
   - Script `project/scripts/generate_compliant_tests.py` đã tạo 16 tệp JSON bằng cách nhân bản một cấu trúc đối tượng hardcoded duy nhất.
   - Dữ liệu thực tế từ 16 file DOCX của `D:\APTIS` chưa được bộ parser nạp vào.
2. **Tầng Thư viện (`project/data/content-index/`):**
   - Tồn tại 272 item trỏ vào 16 test ID nói trên.
   - **Điểm đứt gãy:** Không có component hay API nào trong ứng dụng Next.js import hoặc fetch các tệp trong `project/data/content-index/`.
3. **Tầng Giao diện người dùng (`components/practice/` & `components/mock-test/`):**
   - `/practice`: Danh mục các phần thi (`PRACTICE_SKILLS_CATALOG`) được định nghĩa cứng trong file component.
   - `/practice/[skill]/[part]`: Gọi component `PracticeShell`, tham số `testId` được gán mặc định là `"aptis-b2-01"`. Không hỗ trợ chuyển sang test khác.
   - `/mock-test`: Nút "Bắt đầu thi thử" gọi `createMockTestSession("aptis-b2-01")`, chỉ khởi tạo bài thi số 01.

---

## 5. UI Data Source Audit

| Tuyến đường (Route) | Kỹ năng | Phần thi | Nguồn dữ liệu thực tế (Data Source) | Xuất xứ dữ liệu (Local Origin) | Nguy cơ Mock / Lệch dữ liệu |
|---|---|---|---|---|---|
| `/practice` | Tất cả | Tất cả | `PRACTICE_SKILLS_CATALOG` (`practice-hub.tsx`) | Hardcoded TypeScript constant | Không kết nối với `content-index` |
| `/practice/grammarVocabulary/grammar` | Grammar & Vocab | Grammar | `/api/tests/aptis-b2-01` | `aptis-b2-01-public.json` | Dùng câu hỏi mẫu synthetic |
| `/practice/grammarVocabulary/vocabulary` | Grammar & Vocab | Vocabulary | `/api/tests/aptis-b2-01` | `aptis-b2-01-public.json` | Dùng câu hỏi mẫu synthetic |
| `/practice/reading/part1..4` | Reading | Parts 1–4 | `/api/tests/aptis-b2-01` | `aptis-b2-01-public.json` | Lệch tên trường (`passageText` vs `textWithGaps`), nội dung synthetic |
| `/practice/listening/part1..4` | Listening | Parts 1–4 | `/api/tests/aptis-b2-01` | `aptis-b2-01-public.json` | Audio URL 404, câu hỏi synthetic |
| `/practice/writing/part1..4` | Writing | Parts 1–4 | `/api/tests/aptis-b2-01` | `aptis-b2-01-public.json` | Đề bài Photography Club synthetic |
| `/practice/speaking/part1..4` | Speaking | Parts 1–4 | `/api/tests/aptis-b2-01` | `aptis-b2-01-public.json` | Gửi audio base64 giả lập, câu hỏi synthetic |
| `/mock-test` | Toàn bộ 5 phần | Toàn bộ | LocalStorage active session | Hardcoded khởi tạo `aptis-b2-01` | Không có giao diện chọn đề 02..16 |
| `/mock-test/session/[testId]` | Toàn bộ 5 phần | Toàn bộ | `/api/tests/${testId}` | `aptis-b2-XX-public.json` | Render cố định Part 1 khi duyệt danh sách câu hỏi |
| `/coach` | AI Advisor | - | `project/data/knowledge/index.json` | 29 bài học Edulife (PPTX/PDF) | ✅ Dữ liệu thật từ Edulife |

---

## 6. Listening Audio Integrity

1. **Mapping file gốc:**
   - `aptis-b2-01` → `D:\APTIS\Listening\...\03. Audio\Đề 1.mp3` (Khớp Transcript Đề 1)
   - `aptis-b2-02` → `D:\APTIS\Listening\...\03. Audio\Đề 2.mp3` (Khớp Transcript Đề 2)
   - ...
   - `aptis-b2-15` → `D:\APTIS\Listening\...\03. Audio\Đề 15.mp3` (Khớp Transcript Đề 15)
   - `aptis-b2-16` → **Chưa có file audio trong kho gốc**.
2. **Hiện trạng trong Web App:**
   - Trong `data/tests/aptis-b2-01-public.json`, trường `audioUrl` có giá trị: `"/audio/listening/de_1_part1_q1.mp3"`.
   - Thư mục `project/public/audio/` hiện **không tồn tại** trên ổ đĩa.
   - Các file MP3 gốc là các bản thu âm dài liên tục toàn bộ đề thi, chưa được cắt thành từng câu hỏi nhỏ theo Part/Question hoặc chưa được mount trình phát audio toàn bài.

---

## 7. Reading Content Integrity

1. **Nguồn `D:\APTIS`:**
   - Có đầy đủ 16 bài Reading với 4 dạng bài chuẩn Aptis:
     - Part 1: Điền từ vào email ngắn (ví dụ: Đề 1 email Anna, Đề 2 email Henry, Đề 4 email Sarah).
     - Part 2: Sắp xếp trật tự câu (ví dụ: Đề 1 "Making films", Đề 2 "Music show", Đề 4 "City car park").
     - Part 3: Ghép ý kiến 4 nhân vật (ví dụ: Đề 1 "Reading habits", Đề 9 "Holidays").
     - Part 4: Đọc văn bản dài và nối tiêu đề đoạn văn.
2. **WebAptis Production Data:**
   - Cả 16 file `aptis-b2-[01..16]-public.json` hiện đều chứa cùng một bài văn về nhân vật William Bell (Part 2) và email Alex (Part 1).
   - `QuestionRenderer` đang đọc trường `p1.passageText` (undefined) thay vì `textWithGaps`.

---

## 8. Writing Content Integrity

1. **Nguồn `D:\APTIS`:**
   - Có các chủ đề đa dạng phong phú:
     - Đề 1: Book club event (Mời tác giả nổi tiếng).
     - Đề 6: Television club (Xem phim truyền hình).
     - Đề 7: Computer club (Thay đổi phòng máy tính).
     - Đề 9: Fitness / Health club (Hoạt động rèn luyện sức khỏe).
2. **WebAptis Production Data:**
   - Cả 16 file đều chứa đề bài `Photography and Arts Club`.

---

## 9. Speaking Content Integrity & System Status

1. **Nội dung câu hỏi:**
   - Nguồn `D:\APTIS` có 16 bộ câu hỏi và tình huống nói độc lập.
   - WebAptis hiện chứa bộ câu hỏi mẫu lặp lại qua 16 đề.
2. **Hiện trạng Hệ thống Kỹ thuật Speaking:**
   - **Giao diện ghi âm (Recording UI):** Chỉ là mockup nút bấm.
   - **MediaRecorder API / getUserMedia:** **CHƯA ĐƯỢC CÀI ĐẶT** (Chưa yêu cầu quyền microphone).
   - **Lưu trữ / Upload Audio:** Chưa có hệ sinh thái lưu audio (S3 / Vercel Blob / Local storage).
   - **Chấm điểm AI (`/api/grade/speaking`):** Endpoint backend hoạt động tốt, xác thực Zod schema và gọi Gemini thành công; tuy nhiên client hiện gửi một chuỗi base64 tĩnh (`defaultDummyAudio = "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="`).

---

## 10. Timer Audit

1. **Practice Mode (`/practice/[skill]/[part]`):**
   - File `components/practice/practice-shell.tsx` (dòng 292): `<PracticeTimer initialSeconds={600} />`.
   - **Vấn đề:** Cố định **10 phút (600 giây)** cho mọi bài luyện tập, không phân biệt Part 1 (3–8 phút) hay Part 4 (15–30 phút).
2. **Full Mock Test Mode (`/mock-test`):**
   - File `lib/storage/types.ts` (`MOCK_SECTION_DURATIONS`):
     - Grammar & Vocabulary: 25 phút (1.500 giây)
     - Reading: 35 phút (2.100 giây)
     - Listening: 40 phút (2.400 giây)
     - Writing: 50 phút (3.000 giây)
     - Speaking: 12 phút (720 giây)
     - Tổng thời gian: 162 phút.
   - Đồng hồ đếm ngược từng phần hoạt động độc lập, tự động chuyển phần và khóa khi hết giờ.

---

## 11. Mock / Demo Content Findings

Danh sách các thành phần mẫu/giả lập được phát hiện trong mã nguồn:

| Vị trí | Tên biến / Đoạn mã | Mô tả |
|---|---|---|
| `components/practice/question-renderer.tsx` (L546) | `defaultDummyAudio = "UklGRiQ..."` | Chuỗi WAV base64 tĩnh 44 bytes dùng giả lập audio ghi âm |
| `components/practice/practice-shell.tsx` (L35) | `testId = "aptis-b2-01"` | Gán cứng bài luyện tập số 1 |
| `components/mock-test/mock-test-hub.tsx` (L39) | `createMockTestSession("aptis-b2-01")` | Gán cứng bài thi thử số 1 |
| `data/tests/aptis-b2-[01..16]-public.json` | All sections | Dữ liệu câu hỏi được nhân bản từ một template mẫu |
| `components/practice/practice-shell.tsx` (L292) | `initialSeconds={600}` | Thời gian đếm ngược 10 phút cố định cho mọi kỹ năng |

---

## 12. AI Coach & Knowledge Base Integration

1. **Dữ liệu kiến thức:**
   - 29 mục kiến thức trong `project/data/knowledge/index.json` và `resources/edulife/knowledge/`.
   - Nguồn gốc: Trích xuất chuẩn xác từ các tài liệu lý thuyết của Edulife (`22-tong-quan-grammar-and-vocabulary.pptx`, `B1 - LÝ THUYẾT (1).pdf`, các slide chiến thuật).
2. **Gán nguồn (Attribution):**
   - 100% mục có: `sourceType: "edulife"`, `isOfficialBritishCouncil: false`.
   - Giao diện `/coach` hiển thị: `"Nguồn tham khảo: Tài liệu Edulife"`.
3. **Bộ máy truy xuất (Retriever):**
   - `project/lib/knowledge/retriever.ts` hỗ trợ alias map tiếng Việt, lọc từ dừng và tính điểm trọng số cho từng trường.
   - 100% vượt qua 36 ca kiểm thử truy vấn tiếng Việt thực tế (Test 18 & Test 19).

---

## 13. Danh sách Vấn đề & Phân loại Mức độ (Severity)

### 🔴 P0 — Sai lệch dữ liệu cốt lõi (Production Blockers)
1. **Dữ liệu 16 đề thi là bản nhân bản synthetic:** Cả 16 file `aptis-b2-*.json` trên web chưa được trích xuất từ 16 file DOCX gốc trong `D:\APTIS`.
2. **Đường dẫn Audio 404:** Chưa có file MP3 nào trong thư mục web phục vụ cho phần thi Listening.
3. **Lỗi hiển thị Reading Part 1:** `QuestionRenderer` truy xuất sai tên thuộc tính (`passageText` thay vì `textWithGaps`), dẫn đến không hiển thị bài đọc.
4. **Lỗi chuyển Part trong Mock Test Exam:** `ExamShell` gán cứng `parts[0]` khi hiển thị câu hỏi các phần Reading/Listening/Writing/Speaking, không chuyển nội dung khi người dùng bấm chuyển Part 2, 3, 4.

### 🟡 P1 — Tính năng chưa hoàn thiện (Important)
1. **Chưa có bộ chọn đề thi:** Giao diện `/practice` và `/mock-test` luôn chạy `aptis-b2-01`, người dùng không thể chọn đề từ `aptis-b2-02` đến `aptis-b2-16`.
2. **Practice Index 272 bài bị cô lập:** File `content-index` không được kết nối vào luồng UI.
3. **Thu âm Speaking là giả lập:** Chưa có `MediaRecorder` và xin quyền microphone từ trình duyệt.
4. **Bộ đếm giờ Practice chưa chuẩn:** Cố định 10 phút cho mọi phần.

### 🟢 P2 — Cải tiến & Tối ưu (Improvements)
1. Cắt audio Listening thành từng file nhỏ theo từng câu hỏi (hoặc hỗ trợ audio player toàn bài có timestamp).
2. Thêm chỉ số tiến độ hoàn thành cho từng đề trong Practice Hub.

---

## 14. Đề xuất Kế hoạch Khắc phục (Proposed Action Plan)

1. **Bước 1: Viết bộ Ingestion Parser thực sự cho `D:\APTIS`:**
   - Đọc trực tiếp 16 tệp DOCX từ `D:\APTIS\Listening\Bộ đề ôn tập\00. Bộ Đề Luyện Tập Aptis - HV\01. Đề Luyện Tập\`.
   - Trích xuất chính xác cấu trúc: Reading (Parts 1–4), Listening (Parts 1–4), Writing (Parts 1–4), Speaking (Parts 1–4).
   - Đọc 16 tệp DOCX đáp án từ `02. Đáp án` và transcript từ `04. Transcript`.
   - Ghi đè vào `resources/edulife/normalized/` và `project/data/tests/`.
2. **Bước 2: Xử lý Audio Listening:**
   - Copy 15 file `Đề 1.mp3` → `Đề 15.mp3` vào `project/public/audio/listening/`.
   - Cập nhật schema audio URL trong public JSON để phát đúng file âm thanh của từng đề.
3. **Bước 3: Sửa lỗi UI Rendering & Navigation:**
   - Sửa `QuestionRenderer` đọc đúng `textWithGaps` cho Reading Part 1.
   - Sửa `ExamShell` để render linh hoạt theo `parts[currentIndex]`.
   - Cho phép `/practice` và `/mock-test` nhận tham số `testId` để mở toàn bộ 16 đề.
4. **Bước 4: Nâng cấp Bộ đếm giờ Practice:**
   - Đọc thời lượng chuẩn từ catalog (`officialTiming` hoặc `timeLimitMinutes`) thay vì hardcode 600s.
5. **Bước 5: Triển khai Real MediaRecorder cho Speaking:**
   - Thêm `navigator.mediaDevices.getUserMedia` để thu âm giọng nói thật của thí sinh.

---

## 15. FINAL VERDICT

> ### **B. PARTIALLY VERIFIED — SOME ROUTES STILL USE MOCK/UNKNOWN DATA**
>
> **Kết luận chi tiết:**
> - **AI Coach & Knowledge Base:** Đã được **XÁC MINH HOÀN TOÀN (VERIFIED)** — Sử dụng 100% dữ liệu kiến thức thật từ Edulife materials.
> - **16 Bộ Đề Thi (Practice & Mock Test):** **CHƯA ĐƯỢC XÁC MINH (NOT VERIFIED / SYNTHETIC CLONES)** — Mặc dù kho nguồn `D:\APTIS` chứa 16 bộ đề thật hoàn chỉnh, dữ liệu trên web hiện tại là bản sao chép nhân bản từ template mẫu do script trước đó tạo ra. Cần thực hiện quy trình ingestion thực sự từ DOCX nguồn để đưa toàn bộ 16 đề vào hệ thống.

---
*Báo cáo được tạo tự động và bảo lưu nguyên vẹn toàn bộ mã nguồn hiện có.*
