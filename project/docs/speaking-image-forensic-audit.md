# WebAptis B2 — Speaking Image Forensic Audit

Ngày audit: 2026-08-27  
Production: https://web-aptis.vercel.app

## Verdict

**SPEAKING IMAGE MAPPING BLOCKED**

Không có mapping authoritative nối các task Speaking standard `aptis-b2-01` … `aptis-b2-16` với ảnh candidate. Theo segmentation/mapping contract, không được thay thế bằng mapping theo số thứ tự, filename, semantic guess hoặc ảnh của test khác. Vì vậy không có thay đổi production mapping nào được thực hiện.

Production hiện vẫn có lỗi user-facing: dataset trỏ tới 48 URL standard nhưng các asset tương ứng không tồn tại.

## Phạm vi và source đã kiểm tra

Đã kiểm tra:

- `APTIS/Speaking/04. Speaking_Part 2.pptx`
- `APTIS/Speaking/05. Speaking_Part 3.pptx`
- các PDF Speaking trong `APTIS/Speaking/`
- `project/data/tests/aptis-b2-01-public.json` … `aptis-b2-16-public.json`
- `project/resources/edulife/normalized/aptis-b2-01.json` … `aptis-b2-16.json`
- `project/data/prediction/speaking/speaking-bank.json`
- `project/public/images/speaking/gdrive/manifest.json`
- toàn bộ candidate files trong `project/public/images/speaking/gdrive/`
- git object/history trên các ref hiện có

PPTX được đọc qua XML trong archive, gồm `ppt/slides/slide*.xml`, `ppt/slides/_rels/*.rels` và relationship targets. PDF được đọc theo page order và text extraction. Kết quả:

- PPTX/PDF chỉ chứa format/training examples generic; không có `aptis-b2-*`, `t01_s2`, `t01_s3`, `test_XX_part2.jpg` hoặc quan hệ standard-test/task → image.
- Dataset standard chỉ chứa URL generic và alt text generic, không chứa image identity hoặc source relationship.
- Candidate bank có candidate IDs `gdrive_spk_*`, không phải standard test IDs.
- Git history không chứa asset hoặc mapping standard tương ứng; search các refs không tìm thấy image `test_XX_part2/part3`.

## Machine-readable inventory

Inventory được tạo bằng:

- `project/scripts/build-speaking-image-forensic-inventory.py`
- `project/data/audits/speaking-image-forensic-inventory.json`

Kết quả:

| Hạng mục | Kết quả |
|---|---:|
| Standard Speaking tasks Part 2/3 | 32 |
| Expected standard image references | 48 |
| Standard image assets tồn tại local | 0 |
| Mapping authoritative | 0 |
| Task mappings bị block | 32 |
| Candidate image files | 81 |
| Candidate bank topics | 94 |
| Candidate Part 2 topics | 32 |
| Candidate Part 3 topics | 33 |
| Candidate Part 4 topics | 29 |

Mỗi record standard trong inventory có `mappingConfidence: BLOCKED`, `candidateRelationshipFound: false`, expected URL, prompt, source artifact và evidence còn thiếu. Không record nào được nâng lên `VERIFIED` bằng suy luận.

## Standard task matrix

| Test | Part | Task ID | Expected image reference | Exists | Authoritative candidate mapping | Status |
|---|---:|---|---|---|---|---|
| 01 | 2 | `t01_s2` | `/images/speaking/test_01_part2.jpg` | NO | NONE | BLOCKED |
| 01 | 3 | `t01_s3` | `/images/speaking/test_01_part3_a.jpg`, `_b.jpg` | NO | NONE | BLOCKED |
| 02 | 2 | `t02_s2` | `/images/speaking/test_02_part2.jpg` | NO | NONE | BLOCKED |
| 02 | 3 | `t02_s3` | `/images/speaking/test_02_part3_a.jpg`, `_b.jpg` | NO | NONE | BLOCKED |
| 03 | 2 | `t03_s2` | `/images/speaking/test_03_part2.jpg` | NO | NONE | BLOCKED |
| 03 | 3 | `t03_s3` | `/images/speaking/test_03_part3_a.jpg`, `_b.jpg` | NO | NONE | BLOCKED |
| 04 | 2 | `t04_s2` | `/images/speaking/test_04_part2.jpg` | NO | NONE | BLOCKED |
| 04 | 3 | `t04_s3` | `/images/speaking/test_04_part3_a.jpg`, `_b.jpg` | NO | NONE | BLOCKED |
| 05 | 2 | `t05_s2` | `/images/speaking/test_05_part2.jpg` | NO | NONE | BLOCKED |
| 05 | 3 | `t05_s3` | `/images/speaking/test_05_part3_a.jpg`, `_b.jpg` | NO | NONE | BLOCKED |
| 06 | 2 | `t06_s2` | `/images/speaking/test_06_part2.jpg` | NO | NONE | BLOCKED |
| 06 | 3 | `t06_s3` | `/images/speaking/test_06_part3_a.jpg`, `_b.jpg` | NO | NONE | BLOCKED |
| 07 | 2 | `t07_s2` | `/images/speaking/test_07_part2.jpg` | NO | NONE | BLOCKED |
| 07 | 3 | `t07_s3` | `/images/speaking/test_07_part3_a.jpg`, `_b.jpg` | NO | NONE | BLOCKED |
| 08 | 2 | `t08_s2` | `/images/speaking/test_08_part2.jpg` | NO | NONE | BLOCKED |
| 08 | 3 | `t08_s3` | `/images/speaking/test_08_part3_a.jpg`, `_b.jpg` | NO | NONE | BLOCKED |
| 09 | 2 | `t09_s2` | `/images/speaking/test_09_part2.jpg` | NO | NONE | BLOCKED |
| 09 | 3 | `t09_s3` | `/images/speaking/test_09_part3_a.jpg`, `_b.jpg` | NO | NONE | BLOCKED |
| 10 | 2 | `t10_s2` | `/images/speaking/test_10_part2.jpg` | NO | NONE | BLOCKED |
| 10 | 3 | `t10_s3` | `/images/speaking/test_10_part3_a.jpg`, `_b.jpg` | NO | NONE | BLOCKED |
| 11 | 2 | `t11_s2` | `/images/speaking/test_11_part2.jpg` | NO | NONE | BLOCKED |
| 11 | 3 | `t11_s3` | `/images/speaking/test_11_part3_a.jpg`, `_b.jpg` | NO | NONE | BLOCKED |
| 12 | 2 | `t12_s2` | `/images/speaking/test_12_part2.jpg` | NO | NONE | BLOCKED |
| 12 | 3 | `t12_s3` | `/images/speaking/test_12_part3_a.jpg`, `_b.jpg` | NO | NONE | BLOCKED |
| 13 | 2 | `t13_s2` | `/images/speaking/test_13_part2.jpg` | NO | NONE | BLOCKED |
| 13 | 3 | `t13_s3` | `/images/speaking/test_13_part3_a.jpg`, `_b.jpg` | NO | NONE | BLOCKED |
| 14 | 2 | `t14_s2` | `/images/speaking/test_14_part2.jpg` | NO | NONE | BLOCKED |
| 14 | 3 | `t14_s3` | `/images/speaking/test_14_part3_a.jpg`, `_b.jpg` | NO | NONE | BLOCKED |
| 15 | 2 | `t15_s2` | `/images/speaking/test_15_part2.jpg` | NO | NONE | BLOCKED |
| 15 | 3 | `t15_s3` | `/images/speaking/test_15_part3_a.jpg`, `_b.jpg` | NO | NONE | BLOCKED |
| 16 | 2 | `t16_s2` | `/images/speaking/test_16_part2.jpg` | NO | NONE | BLOCKED |
| 16 | 3 | `t16_s3` | `/images/speaking/test_16_part3_a.jpg`, `_b.jpg` | NO | NONE | BLOCKED |

## Candidate duplicate audit

Có một exact duplicate group chưa giải thích được từ source:

- SHA-256: `aac5ca2a0f5721d17e3895e91bc9ed4f3c449002561fb264f3e428d346cc276e`
- `/images/speaking/gdrive/part_3_Leo_núi___Phòng_gym_1_bbb5cf32.jpg`
- `/images/speaking/gdrive/part_3_Leo_núi___Phòng_gym_2_bbb5cf32.jpg`

Hai file đã được mở/kiểm tra trực quan và là cùng một ảnh slide có nội dung núi và phòng gym. Tuy nhiên source chưa chứng minh đây là reuse có chủ đích hay extraction duplicate, nên inventory giữ trạng thái `UNEXPLAINED-DUPLICATE`. Group này không được dùng để suy ra mapping standard.

## Production browser evidence

Đã chạy clean Playwright Chromium trên production, đăng nhập bằng user audit riêng và mở đủ 32 route Speaking Part 2/3 standard. Audit kiểm tra `<img>`, `naturalWidth`, console và network image responses.

| Chỉ số | Kết quả |
|---|---:|
| Route standard đã mở | 32 |
| Image references | 48 |
| Explicit HTTP 404 | 46 |
| Response status chưa capture được trong 2 request còn lại | 2 |
| `naturalWidth = 0` | 48 |
| Console image errors | 48 |

Ví dụ production request:

`https://web-aptis.vercel.app/images/speaking/test_01_part2.jpg` → HTTP 404, image không render.

Đối chứng, candidate route đang tồn tại và render được: `gdrive_spk_p2_002` sử dụng `/images/speaking/gdrive/part_2_Cô_gái_trên_boong_thuyền_1_058a5a03.jpg`, browser ghi nhận kích thước 800×534. Điều này chứng minh namespace candidate hoạt động, nhưng không chứng minh candidate đó thuộc Test 01 hay bất kỳ standard test nào.

## Semantic verification

Không thể kết luận `MATCH` cho 32 standard tasks. Prompt standard hiện tại là generic, ví dụ `Describe what you see...` và `similar activity`, trong khi candidate bank chứa topic-specific prompts. Không có source relationship để chứng minh candidate nào là ảnh của task standard tương ứng. Semantic inspection vì vậy chỉ là hỗ trợ, không đủ làm bằng chứng mapping.

## Fix status

- Không sửa dataset mapping.
- Không copy candidate images thành `test_XX` aliases.
- Không sửa UI resolver.
- Không dùng placeholder hoặc AI-generated image.
- Không đụng tới Listening; trạng thái Listening vẫn là 59/64 VERIFIED và 5 UNCERTAIN như baseline.
- Không có production image fix để deploy, vì bất kỳ mapping cụ thể nào lúc này đều là đoán và có thể làm sai đề.

## Regression / files

Đã chạy inventory generator thành công. Không chạy lại `npm test`, `npm run typecheck` hoặc `npm run build` trong lượt này vì không có app code, dataset mapping hoặc UI behavior nào được sửa; chỉ tạo forensic inventory/report. Các file audit mới:

- `project/scripts/build-speaking-image-forensic-inventory.py`
- `project/data/audits/speaking-image-forensic-inventory.json`
- `project/docs/speaking-image-forensic-audit.md`

Các file dirty/untracked khác trong workspace không thuộc audit này và không được đưa vào thay đổi.

## Final acceptance

Không đạt tiêu chí `SPEAKING IMAGES FULLY VERIFIED`:

- Part 2: 0/16 verified, 16 blocked.
- Part 3: 0/16 verified, 16 blocked; 32 image references không render.
- Tổng: 0/48 image references verified; 48 non-render trên production.
- Prompt/image match: UNCERTAIN cho toàn bộ 32 task standard.
- Unexplained duplicate: 1 candidate group.

**Final verdict: SPEAKING IMAGE MAPPING BLOCKED**

Một mapping authoritative tối thiểu phải chứa quan hệ rõ ràng `standard test/task → image candidate` (hoặc source document với embedded relationship tương ứng). Cho tới khi artifact đó xuất hiện, không có cách sửa an toàn để đạt mục tiêu production mà không vi phạm nguyên tắc “không đoán mapping”.
