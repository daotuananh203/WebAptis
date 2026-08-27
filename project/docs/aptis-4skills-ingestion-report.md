# Aptis 4 Skills — Source Ingestion & Forensic Validation

Ngày kiểm tra: 2026-08-28
Phạm vi: bảy bộ đề trong `APTIS/Bộ đề 4 kĩ năng`
Phân loại nguồn: source bundle do dự án cung cấp; không khẳng định là tài liệu British Council chính thức.

## Kết quả

Đã tạo namespace độc lập, không ghi đè 16 bộ `aptis-b2-*` hiện có:

```text
aptis-4skills-01
aptis-4skills-02
aptis-4skills-03
aptis-4skills-04
aptis-4skills-05
aptis-4skills-06
aptis-4skills-07
```

Mỗi bộ có 25 Grammar, 25 Vocabulary, 4 Reading parts, 25 Listening questions, 4 Writing parts và 4 Speaking parts. Answer key được đọc từ các bảng trong DOCX hướng dẫn/đáp án, sau đó cross-check với public dataset bằng schema và ID.

Riêng Listening, các trang Part 1 được đọc theo reading order của PDF thay vì layout ba cột. Điều này ngăn prose như `A man is talking...` bị nhận nhầm thành option; footer được loại theo đúng số trang vật lý để không làm mất đáp án dạng số (ví dụ `22`). Các marker cấu trúc bị thiếu dấu chấm hoặc marker `D.` rỗng được xử lý như lỗi extraction có bằng chứng trực tiếp từ source PDF.

## Source inventory

Nguồn đã kiểm tra trực tiếp:

- `01. Aptis.docx.pdf`: 128 trang; bảy test nằm ở trang 11–127.
- 7 master MP3 `Đề 1.mp3` … `Đề 7.mp3`.
- 7 transcript DOCX `Đề 1.docx` … `Đề 7.docx`; transcript được đọc qua `word/document.xml` và giữ paragraph ranges.
- DOCX hướng dẫn/đáp án; 70 bảng, 10 bảng cho mỗi test.
- 21 image objects nhúng trong các trang Speaking của PDF: 7 Part 2, 14 Part 3 và 7 Part 4.

Inventory machine-readable và SHA nguồn nằm tại [source-inventory.json](../data/source-ingestion/aptis-4skills/source-inventory.json). Audio provenance nằm tại [listening-integrity.json](../data/source-ingestion/aptis-4skills/listening-integrity.json).

## Listening segmentation contract

Boundary được xây dựng theo thứ tự:

```text
source transcript paragraph block
→ ordered source block
→ Faster-Whisper word alignment
→ inter-block silence/boundary padding
→ MP3 clip
```

Whisper không được dùng như question boundary. Không cắt theo câu chứa đáp án. Part 1 có 13 source blocks; Part 2 có bốn speaker blocks; Part 3 có một discussion block; Part 4 có hai monologue blocks. Mỗi manifest ghi `paragraphRange`, source transcript, clip bounds, observed complete renditions, SHA clip và boundary evidence.

T01 Q2 có hai lượt đọc đầy đủ và một lượt lặp dở dang ở cuối master; lượt dở dang được loại khỏi clip và ghi `discardedIncompleteRenditions`, không bị coi là question mới. T07 master có nội dung ngoài Listening về sau; các block được giới hạn theo source order trước khi nội dung đó xuất hiện.

## Audio status

```text
Total source blocks: 140
Validated without alignment warning: 139
UNCERTAIN: T02 Listening Part 2 Speaker C
```

T02 Speaker C giữ `UNCERTAIN` vì ASR bắt đầu ở “waking up…” và không chứng minh được phần mở đầu source “Mornings are quiet, and that's how I like it…”. Không tự động nâng status, không dùng audio đoán và không coi aggregate Part 2 là VERIFIED khi một speaker block còn UNCERTAIN.

Các clip còn lại có `clipStart < clipEnd`, không overlap, và `nextBlockSpeechOutsideClip = true`. SHA public JSON khớp SHA file MP3 trên disk.

## Speaking source assets

Ảnh Speaking được trích xuất byte-preserving từ PDF. Với các trang nhúng một plate side-by-side, Part 3 A/B được crop xác định từ plate trung tâm; với T05 và T07, hai PDF objects độc lập được giữ theo document object order. Mỗi asset có source PDF page/object, source SHA, kích thước và crop box (nếu có) trong [speaking-image-inventory.json](../data/source-ingestion/aptis-4skills/speaking-image-inventory.json).

Asset public nằm trong namespace riêng:

```text
/images/speaking/aptis-4skills/
/audio/listening/aptis-4skills/
```

Không public Google Drive URL, temporary URL hoặc source document private.

## Local browser evidence

Clean Chrome/Playwright sau đăng nhập test local đã kiểm tra cả bảy bộ:

- Listening Part 1: 7/7 Q1 có 13 audio elements; click Play làm audio chạy, `readyState = 4`.
- Browser request trả `206 audio/mpeg` với toàn bộ byte range; SHA body nhận được khớp SHA trong dataset/file.
- Speaking Part 2: 7/7 ảnh `naturalWidth > 0`.
- Speaking Part 3: 14/14 ảnh `naturalWidth > 0`, đúng A/B URL theo dataset.
- Practice catalog và Mock Test catalog đều hiển thị bảy bộ ID mới.
- Không có request failed; `401 /api/auth/me` chỉ xuất hiện trước login trong clean context và là hành vi auth guard.

Ví dụ browser Q1:

```text
currentSrc: /audio/listening/aptis-4skills/aptis-4skills-01/part-1/q01.mp3?v=776d73e7e6eb7045
status: 206
content-type: audio/mpeg
bytes: 673478
SHA256: 776d73e7e6eb704598a9faf59a8297b199dcae0cccc6e0ef83c83650ad15495c
browser duration: 42.02s
```

Query string dùng SHA clip để tránh stale immutable cache khi cùng path được cập nhật.

## Known source conflicts / limits

- T02 P2 Speaker C: UNCERTAIN do thiếu alignment coverage như nêu trên.
- T07 Speaking Part 2: PDF ghi nhãn bullet thứ ba là `Q1`; importer giữ thứ tự bullet nguồn và ghi nhận đây là source typo, không tự đổi nội dung.
- Transcript T05 có numbering/paragraph layout bất thường; đã sửa grouping bằng các paragraph có nhãn `Câu n` và kiểm tra không đưa `Câu 14` vào Listening Part 1.
- Master audio không có duration đồng nhất giữa bảy bộ và có thể chứa phần ngoài Listening; chỉ source-aligned blocks được public.

## Validation commands

```text
python scripts/ingest_aptis_4skills.py --reuse-audio
npx tsx tests/aptis-4skills-ingestion.test.ts
npm test
npm run typecheck
npm run build
```

Tất cả các lệnh trên đã PASS trong lần kiểm tra này. Kết quả PASS không xoá trạng thái UNCERTAIN của T02 P2 Speaker C.

## Files chính

- `scripts/ingest_aptis_4skills.py`
- `lib/exam/test-catalog.ts`
- `tests/aptis-4skills-ingestion.test.ts`
- `data/tests/aptis-4skills-0[1-7]-public.json`
- `data/tests/aptis-4skills-0[1-7]-answers.json`
- `data/source-ingestion/aptis-4skills/`
- `public/audio/listening/aptis-4skills/`
- `public/images/speaking/aptis-4skills/`

## Verdict

```text
SEVEN-TEST INGESTION: PASS WITH ONE EXPLICIT AUDIO UNCERTAINTY
NEW TESTS ARE ISOLATED FROM THE EXISTING 16-TEST DATASET: YES
NO FABRICATED AUDIO OR IMAGES: YES
PRODUCTION DEPLOYMENT: NOT YET PERFORMED IN THIS REPORT
```
