# Google Docs Speaking Image Mapping Audit

Ngày audit: 2026-08-27
Source: [Tổng hợp Speaking 2026](https://docs.google.com/document/d/1wsV6frhcqDHFMNWApkw0wl37C_HI7Zv9480r9ClAq1c/edit?tab=t.0#heading=h.gttuz9g05tb0)

## Verdict

**SPEAKING IMAGE MAPPING PARTIALLY VERIFIED**

Google Docs xác nhận được quan hệ:

```text
source topic/prompt → embedded image CID → source image URL → local candidate asset
```

Google Docs **không** xác nhận được quan hệ:

```text
aptis-b2-01 … aptis-b2-16 / t01_s2 … t16_s3 → source topic
```

Vì vậy không thay thế 48 standard URLs bằng phép gán theo thứ tự. Mapping standard-test vẫn `UNCERTAIN`.

## Browser / document forensics

Tài liệu đã được mở bằng Chrome channel qua Playwright ở chế độ read-only. Google Docs render nội dung trên canvas, không đưa text/images thành DOM thông thường. Browser inspection đã thu được `DOCS_modelChunk` và object map nội bộ:

- `ae` embedded object có `i_cid` dạng `s-blob-v1-IMAGE-*`.
- `te` cùng `objectId` cho `spi`, tức vị trí object trong document text.
- HTML/runtime map trực tiếp `i_cid → https://docs.google.com/docs-images-rt/...`.
- Mỗi source URL đã được browser request và trả HTTP 200 với `image/*`.

Document text length: `18116` ký tự. Section positions:

| Section | Text position |
|---|---:|
| Part 2 | 0 |
| Part 3 | 6226 |
| Part 4 | 12287 |

Source object inventory:

| Hạng mục | Kết quả |
|---|---:|
| Embedded image placements | 80 |
| Part 2 placements | 32 |
| Part 3 placements | 48 |
| Part 4 placements | 0 |
| Local candidate image files | 81 |
| Candidate bank topics | 94 |

Một source CID xuất hiện ở hai vị trí liên tiếp cho `Leo núi + Phòng gym`; đây là hai placement của cùng embedded object, không phải bằng chứng để tự gán cho hai standard tests.

## Source-authoritative topic mapping

### Part 2

32/32 candidate topic units có quan hệ source rõ ràng. Ví dụ đầu tiên:

| Evidence | Giá trị |
|---|---|
| Source section/order | Part 2, placement 1 |
| Nearby source text | `Part 2 → Cô gái trên boong thuyền → * → Q1: Describe the picture` |
| Embedded CID | `s-blob-v1-IMAGE-DIzIjGEoNrg` |
| Source image | `docs-images-rt/...` mapped from the CID |
| Candidate bank | `gdrive_spk_p2_002`, topic `Cô gái trên boong thuyền` |
| Local asset | `/images/speaking/gdrive/part_2_Cô_gái_trên_boong_thuyền_1_058a5a03.jpg` |
| Status | VERIFIED for topic → image; UNCERTAIN for standard test → topic |

Các source topic tiếp theo cũng được xác định bằng nearby text + CID/document position, không bằng candidate filename riêng lẻ: `Mẹ dạy con cưỡi ngựa`, `Nhóm người ở triển lãm`, `Nhóm người đợi tàu`, `Cô gái ngồi làm việc`, `Nhóm người ở phòng làm việc`, rồi các topic Part 2 còn lại.

### Part 3

32/33 candidate topic units có embedded image relationship; 1 topic không có image trong source:

```text
Between these 2 locations, where do you prefer? Why?
```

Ví dụ `Leo núi + Phòng gym`:

| Evidence | Giá trị |
|---|---|
| Source section/order | Part 3, placements 33–34 |
| Nearby source text | `Part 3 → Leo núi + Phòng gym → Q1: Compare these two pictures?` |
| Embedded CID | `s-blob-v1-IMAGE-i40z0qA8qy4` ở cả hai placement |
| Candidate bank | `gdrive_spk_p3_035` |
| Local assets | `part_3_Leo_núi___Phòng_gym_1_bbb5cf32.jpg`, `part_3_Leo_núi___Phòng_gym_2_bbb5cf32.jpg` |
| Status | VERIFIED for source topic/placement; standard task mapping UNCERTAIN |

Một số Part 3 topics trong source chỉ có một embedded image dù prompt nói “two pictures”. Đây là tình trạng của source, không được tự tạo/copy ảnh thứ hai.

## Candidate comparison

Đã đối chiếu source image responses với local candidate files bằng SHA-256, dimensions và normalized visual signature:

- 64/80 source image responses có SHA-256 trùng trực tiếp local candidate.
- 16/80 có byte khác nhưng có local candidate gần nhất theo normalized visual signature và cùng source-topic relationship trong candidate bank.
- Byte hash khác không tự động là mismatch vì source response là ảnh Google Docs render/transform, còn local asset là file public đã trích xuất.
- Exact duplicate local group vẫn cần giữ cảnh báo nếu source không chứng minh chủ đích:

```text
SHA256 aac5ca2a0f5721d17e3895e91bc9ed4f3c449002561fb264f3e428d346cc276e
part_3_Leo_núi___Phòng_gym_1_bbb5cf32.jpg
part_3_Leo_núi___Phòng_gym_2_bbb5cf32.jpg
```

Inventory chi tiết nằm tại [google-doc-speaking-image-inventory.json](../data/audits/google-doc-speaking-image-inventory.json), được tạo bởi [recover-google-doc-speaking-mapping.ts](../scripts/recover-google-doc-speaking-mapping.ts).

## Vì sao chưa được phép sửa 48 standard URLs

Các file `project/data/tests/aptis-b2-01-public.json` … `aptis-b2-16-public.json` hiện có:

- cùng dạng prompt generic cho Part 2: `Describe what you see in the picture in detail.`
- cùng dạng prompt generic cho Part 3: `Compare these two different situations shown in the pictures.`
- không có topic title từ Google Docs.
- không có `sourceOrder`, Google Docs CID, candidate ID hoặc image relationship.

Google Docs cũng không có headings hoặc labels `Test 01` … `Test 16`, `aptis-b2-*`, `t01_s2` hoặc `t01_s3`. Nó chỉ có một bank tổng hợp theo Part/topic. Do đó các phép gán như “16 topic đầu tiên = 16 standard tests” hoặc “candidate ID 002 = Test 01” đều là unsupported inference.

File `docs/speaking-content-diff.md` có bảng “Proposed Staged Part 2 Topic”; chữ `Proposed` phản ánh đúng trạng thái đề xuất, không phải source evidence về standard-test assignment. Bảng đó không được dùng để tự động sửa mapping.

## Standard task status

| Scope | Source prompt/image relationship | Standard test relationship | Status |
|---|---|---|---|
| 16 Part 2 tasks | Candidate topic → image verified in Google Docs/candidate bank | No `aptis-b2`/task ID in source | UNCERTAIN |
| 16 Part 3 tasks | Candidate topic → image verified where source image exists | No `aptis-b2`/task ID in source | UNCERTAIN |
| 48 standard image references | URLs point to nonexistent `/images/speaking/test_XX_*` assets | No safe replacement | BLOCKED |

## Production status

Production browser audit trước đó trên 32 standard Part 2/3 routes ghi nhận:

- 48 image references.
- 46 explicit HTTP 404.
- 2 response status chưa capture được.
- 48 `naturalWidth = 0`.

Vì chưa sửa dataset, production vẫn chưa render đúng 48 standard images. Không có claim production fixed trong audit này.

## Files changed

- `project/scripts/recover-google-doc-speaking-mapping.ts`
- `project/data/audits/google-doc-speaking-image-inventory.json`
- `project/docs/google-doc-speaking-mapping-audit.md`

Không sửa standard dataset, UI, candidate assets hoặc Listening. Không có Google credentials/cookie/token được lưu.

## Final status

Đã recover được source-authoritative mapping cho candidate topics/images trong Google Docs. Chưa recover được standard-test/task mapping nên không thể an toàn đạt `SPEAKING IMAGES FULLY VERIFIED`.

**Final verdict: SPEAKING IMAGE MAPPING PARTIALLY VERIFIED**
