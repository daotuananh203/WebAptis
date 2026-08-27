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

## Production verification after final data fix

GitHub `master` và deployment production đã được kiểm tra:

```text
GitHub commit: 92879a750f8301237a096e436362bfa4a76605f4
Vercel deployment: JA2Vi3jiWdC6fuyubx9y3VCjf5BK
Deployment status: success / Deployment has completed
Production: https://web-aptis.vercel.app
```

Clean Chromium sau deployment đã đăng ký một user kiểm thử mới, mở UI thật và phát Q1 của cả bảy test. Các request media dùng trong playback đều là `206 audio/mpeg` với toàn bộ byte range; phép `fetch` forensic bổ sung nhận `200` toàn bộ body để tính hash. Bảng dưới đây ghi lại `audio.currentSrc`, thời lượng browser và SHA-256 của chính bytes browser nhận được:

| Test | `audio.currentSrc` (Q1) | Browser duration | Media response | Bytes | SHA-256 | Kết quả |
|---|---|---:|---|---:|---|---|
| 01 | `/audio/listening/aptis-4skills/aptis-4skills-01/part-1/q01.mp3?v=776d73e7e6eb7045` | 42.02s | 206, full range | 673478 | `776d73e7e6eb704598a9faf59a8297b199dcae0cccc6e0ef83c83650ad15495c` | MATCH |
| 02 | `/audio/listening/aptis-4skills/aptis-4skills-02/part-1/q01.mp3?v=2a9646260fba4ca6` | 32.24s | 206, full range | 517151 | `2a9646260fba4ca6ed3e2661b69818cb4b2e425a5c2cc8ad2f3e3e7b7d4016f6` | MATCH |
| 03 | `/audio/listening/aptis-4skills/aptis-4skills-03/part-1/q01.mp3?v=92c1e0748c363257` | 20.98s | 206, full range | 337011 | `92c1e0748c363257596ce595c9ef914f6bafc8dfafed6f9e0e447f3b60d66303` | MATCH |
| 04 | `/audio/listening/aptis-4skills/aptis-4skills-04/part-1/q01.mp3?v=150c6b4b85538e4b` | 51.677s | 206, full range | 828251 | `150c6b4b85538e4b08fa585d18310e58a6b3d98b9da5ea7d36ba55587ab7813d` | MATCH |
| 05 | `/audio/listening/aptis-4skills/aptis-4skills-05/part-1/q01.mp3?v=6843d3a104cd208f` | 59.08s | 206, full range | 946472 | `6843d3a104cd208fb33177e2c73289f7667d9627d5bba8d5337ce7b069f117a1` | MATCH |
| 06 | `/audio/listening/aptis-4skills/aptis-4skills-06/part-1/q01.mp3?v=0d5bce3cd60c905f` | 98.10s | 206, full range | 1570903 | `0d5bce3cd60c905f12d17175794b32577241ac728c353c3019ae5ef8904ca888` | MATCH |
| 07 | `/audio/listening/aptis-4skills/aptis-4skills-07/part-1/q01.mp3?v=772aad4afcf6781d` | 23.720s | 206, full range | 380896 | `772aad4afcf6781dec42605d48f2c37935866ccd4c34aec4b3f24850fbb6ff39` | MATCH |

UI/content checks on the same clean-browser run:

- Production API: 7/7 new test IDs returned `200`; Q1 UI displayed its source options. Regression values were checked in the UI/API for T03 Q2 = `1500 years`, T05 Q9 = `22`, and T07 Q1 = `20 minutes`.
- Speaking images: 21/21 Part 2/3 images and 7/7 Part 4 images returned `200`, had `naturalWidth > 0`, and matched the local expected asset hash. Total checked: 28/28.
- Mock Test catalog: 23 Start buttons were rendered, including `Bộ 4 kỹ năng 01` through `Bộ 4 kỹ năng 07`.
- No image/audio request failure was observed in the new asset namespace. A separate pre-existing `/favicon.ico` 404 was observed and is unrelated to this ingestion batch.

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
PRODUCTION DEPLOYMENT: VERIFIED AT 92879a750f8301237a096e436362bfa4a76605f4
```
