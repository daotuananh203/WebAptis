# Google Drive Content Audit Report

**Date:** 2026-08-23  
**Project:** WebAptis B2 — Data Integrity & Content Audit Phase  
**Source of Truth Policy:** Forensic validation, zero synthetic data, strict provenance preservation.

---

## 1. Google Drive Inventory & Discovery Status

| Target Source | Provided Drive ID / URL | Detected Resource Type | HTTP Status | Accessibility | Parse Status | Total Images | Total Questions / Topics |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Speaking Drive** | `1wsV6frhcqDHFMNWApkw0wl37C_HI7Zv9480r9ClAq1c` | Google Document (*"Tổng hợp Speaking 2026"*) | 200 OK | **Accessible** (via `mobilebasic`) | **Fully Parsed** | **81** | **94 Topics** (Part 2: 32, Part 3: 33, Part 4: 29) |
| **Speaking Part 4 Suggestions** | `1u8AeBUdtSJYIypb1gdHaZgnYlEcXMVcmb9J-6iNUO8?tab=t.eix9qtcfp1b1c` | Google Document Tab | 404 Not Found | **Inaccessible** (43-char ID / Private) | **Halted** | 0 | 0 |
| **Writing Drive** | `1u8AeBUdtSJYIypb1gdHaZgnYlEcXMVcmb9J-6iNUO8?tab=t.4gwx1fhqoabx` | Google Document Tab | 404 Not Found | **Inaccessible** (43-char ID / Private) | **Halted** | 0 | 0 |

> [!IMPORTANT]
> **Discovery Rule Compliance:**
> As specified in the Discovery Rules: *"Nếu Drive không truy cập được: DỪNG tại discovery và báo chính xác lỗi quyền truy cập, KHÔNG giả định dữ liệu."*
> The second and third URLs returned `HTTP Error 404: Not Found` across all Google Docs, Sheets, and Drive endpoints. Discovery was halted immediately for those URLs without synthetic extrapolation.

---

## 2. Speaking Drive Deep Inventory (`1wsV6frhcqDHFMNWApkw0wl37C_HI7Zv9480r9ClAq1c`)

- **Document Title:** *Tổng hợp Speaking 2026*
- **Character Count:** 17,709 characters
- **Total Downloadable Assets:** 81 high-resolution images (`.jpg` / `.png`)
- **Asset Storage Location:** `public/images/speaking/gdrive/`
- **Asset Manifest:** `public/images/speaking/gdrive/manifest.json`

### Section Breakdown:
1. **Speaking Part 2 (1 photo x 3 questions):**
   - **Total Topics:** 32 topic sets
   - **Total Images:** 32 authentic photos
   - **Representative Topics:** *Cô gái trên boong thuyền*, *Mẹ dạy con cưỡi ngựa*, *Nhóm người ở triển lãm*, *Nhóm người đợi tàu*, *Cô gái ngồi làm việc*, *Nhóm người ở phòng làm việc*, *Cô gái trên xe buýt* (Versions 1 & 2), *Nhóm người trong nhà hàng*, *Bữa tiệc sinh nhật*, *Người leo núi*, *Học sinh trong thư viện*, etc.
2. **Speaking Part 3 (2 photos x 3 comparison questions):**
   - **Total Topics:** 33 topic sets (15 with complete 2-image pairs, 18 with 1 image/prompt)
   - **Total Images:** 49 authentic photos
   - **Representative Topics:** *Bowling vs Leo núi*, *Đi bộ công viên vs đường phố*, *Tập thể thao ngoài trời vs trong nhà*, *Mua sắm online vs chợ*, etc.
3. **Speaking Part 4 (3 questions x 1 min prep / 2 min speech):**
   - **Total Topics:** 29 topic sets with structured sub-questions
   - **Representative Topics:** *Thay đổi công việc*, *Internet*, *Thành công & Mục tiêu*, *Một lần vội vã*, *Tác phẩm nghệ thuật*, *Làm việc nhóm (Teamwork)*, *Tặng quà*, *Cười lớn*, *Đặt câu hỏi khó*, *Tiết kiệm*, etc.

---

## 3. Local Repository Inventory Cross-Reference

In addition to Google Drive, the authentic local repository at `<workspace-root>/Aptis/` contains supplementary materials:
- **Speaking Files:**
  - `03. Speaking_Part 1.pptx` (1.58 MB)
  - `04. Speaking_Part 2.pptx` (1.82 MB)
  - `05. Speaking_Part 3.pptx` (2.08 MB)
  - `06. Speaking_Part 4.pptx` (1.94 MB)
  - `APTIS_SPEAKING PART 1&2.pdf` (20 pages, 11,002 chars)
  - `APTIS_SPEAKING PART 1_Questions.pdf` (1 page, 1,314 chars)
  - `APTIS_SPEAKING PART 2(full).pdf` (14 pages, 11,577 chars)
  - `APTIS_SPEAKING PART 4.pdf` (8 pages, 4,254 chars)
  - `Aptis_Speaking_Part 3.pdf` (8 pages, 4,804 chars)
- **Writing Files:**
  - `07. APTIS Writing.pptx` (1.47 MB)
  - `08. Writing_Part 1.pptx` (1.32 MB)
  - `09. Writing_Part 2.pptx` (1.63 MB)
  - `11. Writing_Part 4.pptx` (1.62 MB)
  - `APTIS_WRITING PART 1&2&3.pdf` (37 pages, 12,197 chars)
  - `APTIS_WRITING PART 4.pdf` (7 pages, 3,795 chars)
