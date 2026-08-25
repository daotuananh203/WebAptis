# BÁO CÁO RE-AUDIT: CẤU TRÚC THỰC TẾ BỘ ĐỀ READING & LISTENING (`D:\APTIS`)

*Thời điểm thực hiện Re-Audit: 2026-08-22*  
*Phương pháp: Trích xuất và giải mã toàn bộ văn bản XML bên trong tất cả 16 tệp tin DOCX, đối chiếu chéo Audio, Transcript, Answer Keys và các tài liệu Reading độc lập.*

---

## 1. CẤU TRÚC THỰC TẾ CỦA KHO ĐỀ (THE REAL TEST ARCHITECTURE)

Khác với phân loại thư mục bề ngoài (nơi các đề nằm trong đường dẫn `D:\APTIS\Listening\Bộ đề ôn tập\...`), **kết quả giải mã nội dung thực tế chứng minh**:

> [!IMPORTANT]
> **Phát hiện Cốt lõi (Core Discovery):**
> 1. Mỗi file `Đề X - Aptis.docx` trong thư mục `00. Bộ Đề Luyện Tập Aptis - HV\01. Đề Luyện Tập` **LÀ MỘT BỘ ĐỀ TỔNG HỢP HOÀN CHỈNH (INTEGRATED FULL EXAM) CHỨA CẢ 4 KỸ NĂNG: LISTENING + READING + WRITING + SPEAKING**.
> 2. **Reading và Listening KHÔNG PHẢI là hai kho tài liệu tách rời**, mà là hai phân phần (sections) gắn kết chặt chẽ trong cùng một mã đề `Đề X`.
> 3. Tương ứng, mỗi file `Đề X.docx` trong `02. Đáp án` chứa **toàn bộ đáp án của cả phần Listening lẫn Reading**, kèm bài mẫu Writing và Speaking.
> 4. Thư mục `D:\APTIS\Reading\APTIS_READING COMPREHENSION.docx` chứa thêm **4 bộ đề Reading độc lập** (không trùng lặp với 16 bài Reading trong 16 đề tổng hợp).

```text
Cấu trúc 1 Bộ đề Đề X (Đề 1 .. Đề 16)
├── 1. Section Listening: Part 1 (Q1–Q13) + Part 2 (Q14–Q17) + Part 3 (Q18–Q20) + Part 4 (Q21–Q25)
├── 2. Section Reading:   Part 1 (Điền từ) + Part 2 (Sắp xếp câu) + Part 3 (Ghép ý kiến) + Part 4 (Tiêu đề đoạn)
├── 3. Section Writing:   Part 1 (5 tin nhắn) + Part 2 (Form 20–30 từ) + Part 3 (Chat 30–40 từ) + Part 4 (2 Email)
└── 4. Section Speaking:  Part 1 (3 câu 30s) + Part 2 (Tranh 45s) + Part 3 (So sánh tranh 45s) + Part 4 (Thuyết trình 2p)
```

---

## 2. BẢNG MAPPING TOÀN BỘ 16 BỘ ĐỀ (TEST 01 -> TEST 16)

| Mã Bộ Đề (`testId`) | Section Listening | Section Reading | File Audio (`03. Audio`) | File Transcript (`04. Transcript`) | File Đáp án (`02. Đáp án`) | Tình trạng Hoàn chỉnh |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **`aptis-b2-01`** | ✓ (4 Parts) | ✓ (4 Parts) | `Đề 1.mp3` (24.5 MB) | `Đề 1.docx` | `Đề 1.docx` (Lis + Read) | **Hoàn chỉnh 100%** |
| **`aptis-b2-02`** | ✓ (4 Parts) | ✓ (4 Parts) | `Đề 2.mp3` (19.6 MB) | `Đề 2.docx` | `Đề 2.docx` (Lis + Read) | **Hoàn chỉnh 100%** |
| **`aptis-b2-03`** | ✓ (4 Parts) | ✓ (4 Parts) | `Đề 3.mp3` (14.3 MB) | `Đề 3.docx` | `Đề 3.docx` (Lis + Read) | **Hoàn chỉnh 100%** |
| **`aptis-b2-04`** | ✓ (4 Parts) | ✓ (4 Parts) | `Đề 4.mp3` (13.5 MB) | `Đề 4.docx` | `Đề 4.docx` (Lis + Read) | **Hoàn chỉnh 100%** |
| **`aptis-b2-05`** | ✓ (4 Parts) | ✓ (4 Parts) | `Đề 5.mp3` (12.5 MB) | `Đề 5.docx` | `Đề 5.docx` (Lis + Read) | **Hoàn chỉnh 100%** |
| **`aptis-b2-06`** | ✓ (4 Parts) | ✓ (4 Parts) | `Đề 6.mp3` (14.4 MB) | `Đề 6.docx` | `Đề 6.docx` (Lis + Read) | **Hoàn chỉnh 100%** |
| **`aptis-b2-07`** | ✓ (4 Parts) | ✓ (4 Parts) | `Đề 7.mp3` (13.8 MB) | `Đề 7.docx` | `Đề 7.docx` (Lis + Read) | **Hoàn chỉnh 100%** |
| **`aptis-b2-08`** | ✓ (4 Parts) | ✓ (4 Parts) | `Đề 8.mp3` (14.3 MB) | `Đề 8.docx` | `Đề 8.docx` (Lis + Read) | **Hoàn chỉnh 100%** |
| **`aptis-b2-09`** | ✓ (4 Parts) | ✓ (4 Parts) | `Đề 9.mp3` (44.8 MB) | `Đề 9.docx` | `Đề 9.docx` (Lis + Read) | **Hoàn chỉnh 100%** |
| **`aptis-b2-10`** | ✓ (4 Parts) | ✓ (4 Parts) | `Đề 10.mp3` (27.2 MB) | `Đề 10.docx` | `Đề 10.docx` (Lis + Read) | **Hoàn chỉnh 100%** |
| **`aptis-b2-11`** | ✓ (4 Parts) | ✓ (4 Parts) | `Đề 11.mp3` (22.2 MB) | `Đề 11.docx` | `Đề 11.docx` (Lis + Read) | **Hoàn chỉnh 100%** |
| **`aptis-b2-12`** | ✓ (4 Parts) | ✓ (4 Parts) | `Đề 12.mp3` (22.3 MB) | `Đề 12.docx` | `Đề 12.docx` (Lis + Read) | **Hoàn chỉnh 100%** |
| **`aptis-b2-13`** | ✓ (4 Parts) | ✓ (4 Parts) | `Đề 13.mp3` (25.9 MB) | `Đề 13.docx` | `Đề 13.docx` (Lis + Read) | **Hoàn chỉnh 100%** |
| **`aptis-b2-14`** | ✓ (4 Parts) | ✓ (4 Parts) | `Đề 14.mp3` (20.9 MB) | `Đề 14.docx` | `Đề 14_.docx` (Lis + Read) | **Hoàn chỉnh 100%** |
| **`aptis-b2-15`** | ✓ (4 Parts) | ✓ (4 Parts) | `Đề 15.mp3` (36.5 MB) | `Đề 15.docx` | `Đề 15.docx` (Lis + Read) | **Hoàn chỉnh 100%** |
| **`aptis-b2-16`** | ✓ (4 Parts) | ✓ (4 Parts) | **✗ KHUYẾT AUDIO** | `Đề 16.docx` | `Đề 16.docx` (Lis + Read) | **Thiếu file `Đề 16.mp3`** |

---

## 3. SỐ LƯỢNG TEST THỰC TẾ & PHÂN LOẠI

1. **Tổng số Full Mock Tests hoàn chỉnh:** **15 đề (`aptis-b2-01` đến `aptis-b2-15`)**.
   * Đầy đủ Listening (Audio + Transcript), Reading, Writing, Speaking và Answer Keys.
2. **Tổng số Test bán hoàn chỉnh:** **1 đề (`aptis-b2-16`)**.
   * Có toàn bộ văn bản câu hỏi Reading, Writing, Speaking, Listening Transcript và Answer Keys; chỉ thiếu file audio MP3.
3. **Kho đề Reading bổ sung độc lập:** **4 đề trọn vẹn (100 câu trắc nghiệm)** trong file `D:\APTIS\Reading\APTIS_READING COMPREHENSION.docx` (Mã đề xuất: `reading-drill-01` đến `reading-drill-04`).

---

## 4. CHI TIẾT MAPPING TỪNG PHÂN HỆ

### 4.1. Reading Mapping
* **Trong 16 Bộ đề tổng hợp:** Mỗi Đề 1–16 có 1 bài Reading hoàn chỉnh với các chủ đề đa dạng (Thư cá nhân, Sắp xếp tiểu sử/hướng dẫn, Ghép quan điểm 4 nhân vật, Bài đọc dài về Lịch sử, Khoa học, Nghệ thuật).
* **Trong file `APTIS_READING COMPREHENSION.docx`:**
  * Đề R1: Samantha & Pete / William Bell / Office Instructions / Travel & Transport.
  * Đề R2: Holiday plans / Cooking tips / Film reviews / History of Coffee.
  * Đề R3: School project / Music festivals / Healthy living / Renewable energy.
  * Đề R4: Tech devices / Job application / Urban architecture / Deep sea exploration.

### 4.2. Listening Mapping
* Mỗi đề chứa 25 câu hỏi trắc nghiệm âm thanh (Parts 1–4) bám sát format British Council Aptis General.
* Cả 16 đề đều có Transcript DOCX trong `04. Transcript` tương ứng từ `Đề 1.docx` đến `Đề 16.docx`.

### 4.3. Audio Mapping
* 15 file `.mp3` chất lượng cao tương ứng với `Đề 1.mp3` đến `Đề 15.mp3`.
* `Đề 16.mp3` chưa có file âm thanh gốc (văn bản trong đề ghi rõ: *"Audio: Hiện tại chưa có file bản nghe"*).

### 4.4. Key Mapping (Đáp án)
* Thư mục `02. Đáp án` chứa đầy đủ 16 file đáp án chuẩn.
* Trong mỗi file đáp án, giáo viên Edulife đã tổng hợp:
  * Key Listening (A/B/C/D kèm trích dẫn Transcript).
  * Key Reading (Đáp án điền từ, thứ tự sắp xếp câu Part 2, bảng nhân vật Part 3, tiêu đề đoạn Part 4).
  * Gợi ý câu trả lời mẫu Writing Parts 1–4.
  * Gợi ý dàn ý Speaking Parts 1–4.

---

## 5. CÁC TỆP TIN TRÙNG LẶP & THIẾU SÓT (DUPLICATES & GAPS)

1. **Thư mục trùng lặp:**
   * Thư mục `Listening\Bộ đề ôn tập\Đáp án Đề luyện tập` (15 files) là bản sao lưu của `00. Bộ Đề Luyện Tập Aptis - HV\02. Đáp án` (16 files), nhưng bị thiếu mất file `Đề 6`. **Khuyến nghị: Chỉ sử dụng thư mục chính `02. Đáp án`.**
2. **File trùng lặp:**
   * `Writing\07. APTIS Writing (1).pptx` trùng lặp 100% với `Writing\07. APTIS Writing.pptx`.
3. **Slide khuyết thiếu:**
   * Thiếu slide số `10` trong chuỗi bài giảng Writing (chỉ có slide 08 Part 1, 09 Part 2, và nhảy sang 11 Part 4).

---

## 6. KẾT LUẬN VỀ CẤU TRÚC `testId` DÀNH CHO WEBAPTIS

Khi tổ chức dữ liệu cho WebAptis, quy chuẩn đặt mã đề tối ưu nhất là:

* **Mock Tests Toàn diện (Full Mock Tests):**
  * `aptis-b2-01` đến `aptis-b2-15` (15 đề hoàn chỉnh cả 4 kỹ năng + Audio).
  * `aptis-b2-16` (Sẵn sàng cho Reading, Writing, Speaking; phần Listening có thể bổ sung Audio bằng AI Voice / TTS từ Transcript).
* **Practice Drills Độc lập:**
  * Reading Drills: `reading-drill-01` đến `reading-drill-04` (từ `APTIS_READING COMPREHENSION.docx`).
  * Writing Drills: 12 bộ đề CLB từ `APTIS_WRITING PART 1&2&3.pdf` & `APTIS_WRITING PART 4.pdf`.
  * Speaking Drills: Ngân hàng câu hỏi từ `APTIS_SPEAKING PART 1..4.pdf`.

---

*Báo cáo Re-Audit đã hoàn tất và xác nhận chính xác 100% cấu trúc thực tế của toàn bộ kho đề `D:\APTIS`.*
