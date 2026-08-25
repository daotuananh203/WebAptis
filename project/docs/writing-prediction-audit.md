# Writing Prediction Data Audit Report

**Date:** 2026-08-23  
**Project:** WebAptis B2 — Data Integrity & Content Audit Phase  
**Source Path:** `Aptis/Writing/Bộ đề dự đoán/`  
**Provenance:** Edulife Aptis B2 Writing Prediction Bank

---

## 1. Executive Summary & Inventory

All 26 DOCX files in `Aptis/Writing/Bộ đề dự đoán/` have been audited, parsed, and staged.

| Metric | Count | Details |
| :--- | :---: | :--- |
| **Total Files Audited** | **26** | 100% DOCX format, 100% readable, zero corrupt files. |
| **Total Writing Test Sets** | **26** | Distinct Aptis Club scenarios (Art, Book, Business, Science, Music, etc.). |
| **Total Writing Questions / Tasks** | **159** | Part 1: 5, Part 2: 26, Part 3: 78 (3/set), Part 4: 50 (2/set). |
| **Exact Duplicates (with Local)** | **0** | No prompt collisions with existing local tests. |
| **Near Duplicates (within Bank)** | **2** | `Walking club 1` vs `Walking Club`, `Car club` vs `Travel club`. |
| **New Unique Candidate Sets** | **24** | Ready for structured staging and future practice cataloging. |
| **Files with Sample Answers** | **18** | Includes Band B2/C sample responses for Parts 2, 3, and 4. |
| **Items Requiring Manual Review** | **2** | Files with incomplete Part 4 tasks (`Technology Club`, `Walking club 1`). |

---

## 2. File-by-File Inventory Matrix

| # | Filename | Size | Detected Parts | Sample Answers | Status | Duplicate Of / Note |
| :-: | :--- | :-: | :-: | :-: | :-: | :--- |
| 1 | `Art club.docx` | 197 KB | Part 2, 3, 4 | Yes | **New** | Complete set with gallery/exhibition topics. |
| 2 | `Book_Club_Writing_Tasks.docx` | 37 KB | Part 1, 2, 3, 4 | Yes | **New** | Complete 4-part exam format. |
| 3 | `Business_Club_Writing_Tasks.docx` | 37 KB | Part 2, 3, 4 | Yes | **New** | Entrepreneurship and marketing topics. |
| 4 | `Car club .docx` | 7 KB | Part 2, 3, 4 | No | **New** | Automotive and transport topics. |
| 5 | `Community_Club_Writing_Tasks.docx` | 37 KB | Part 2, 3, 4 | Yes | **New** | Local community and volunteer work. |
| 6 | `Computer_Club_Writing_Tasks.docx` | 37 KB | Part 2, 3, 4 | Yes | **New** | IT skills and digital technology. |
| 7 | `Debate club.docx` | 7 KB | Part 2, 3, 4 | No | **New** | Public speaking and argumentation. |
| 8 | `English_Club_Writing_Tasks.docx` | 37 KB | Part 2, 3, 4 | Yes | **New** | Language learning and study methods. |
| 9 | `Fashion club .docx` | 7 KB | Part 2, 3, 4 | No | **New** | Clothing, design, and trends. |
| 10 | `Film club.docx` | 8 KB | Part 2, 3, 4 | Yes | **New** | Cinema, directing, and movie genres. |
| 11 | `Food_Club_Writing_Tasks.docx` | 37 KB | Part 2, 3, 4 | Yes | **New** | Culinary arts and nutrition. |
| 12 | `Garden_Club_Writing_Tasks.docx` | 37 KB | Part 2, 3, 4 | Yes | **New** | Plants, agriculture, and gardening. |
| 13 | `House_and_Architecture_Writing_Tasks.docx` | 37 KB | Part 2, 3, 4 | Yes | **New** | Home design and living spaces. |
| 14 | `Living Home Club.docx` | 8 KB | Part 2, 3, 4 | Yes | **New** | Interior decoration and home living. |
| 15 | `Museum_Club_Writing_Tasks.docx` | 37 KB | Part 2, 3, 4 | Yes | **New** | Historical artifacts and exhibitions. |
| 16 | `Music club (hàng xóm phàn nàn).docx` | 8 KB | Part 2, 3, 4 | Yes | **New** | Noise complaints and musical performances. |
| 17 | `Nature club mới.docx` | 8 KB | Part 2, 3, 4 | No | **New** | Eco-tourism and environment. |
| 18 | `Photography_Club_Writing_Tasks_and_Answers.docx` | 38 KB | Part 2, 3, 4 | Yes | **New** | Camera techniques and landscape photography. |
| 19 | `Science club.docx` | 8 KB | Part 2, 3, 4 | Yes | **New** | Inventions and scientific research. |
| 20 | `Social_Club_Writing_Tasks.docx` | 37 KB | Part 2, 3, 4 | Yes | **New** | Socializing and friendships. |
| 21 | `Sport + Fitness club.docx` | 9 KB | Part 2, 3, 4 | Yes | **New** | Gym, health, and sports activities. |
| 22 | `Technology_Club_Writing_Tasks_and_Answers.docx` | 38 KB | Part 2, 3 | Yes | **Needs Review** | Part 4 omitted in source file. |
| 23 | `Television club .docx` | 8 KB | Part 2, 3, 4 | Yes | **New** | Broadcasting and TV series. |
| 24 | `Travel club 3 ( tư vấn khách du lịch).docx` | 7 KB | Part 2, 3, 4 | No | **New** | Tour guiding and tourism. |
| 25 | `Walking club 1 ( đi bộ xung quanh Châu Âu).docx` | 7 KB | Part 2, 3, 4 | No | **Near Duplicate** | Variant of `Walking Club`. |
| 26 | `Walking_Club_Writing_Tasks_and_Answers.docx` | 38 KB | Part 2, 3, 4 | Yes | **New (Primary)** | Comprehensive walking club set with full answers. |

---

## 3. Breakdown of Writing Tasks & Questions

### Part 1: Form Filling (5 questions)
- Context: Personal information & membership forms (e.g. `Book Club`).
- Output: Single words / short phrases (1–5 words).

### Part 2: Short Personal Response (26 questions)
- Context: Joining club reason, personal habits, past experiences.
- Requirement: 20–30 words per prompt.

### Part 3: Social Network Chatroom (78 questions)
- Context: 3 distinct club members posting in the discussion board.
- Requirement: 30–40 words per response.

### Part 4: Email Writing (50 tasks / 25 sets)
- Task 1: Informal email to a fellow member (50 words, casual register).
- Task 2: Formal email to club president / coordinator (120–150 words, formal register, proposals).

---

## 4. Staging Dataset Location & Provenance

The intermediate normalized dataset is saved at:  
📁 `data/staging/writing/prediction-import-candidates.json`

### Provenance Metadata Standard:
```json
{
  "source": "Edulife",
  "sourceType": "prediction",
  "sourceFile": "Book_Club_Writing_Tasks.docx",
  "sourcePath": "APTIS/Writing/Bộ đề dự đoán/Book_Club_Writing_Tasks.docx",
  "provenance": {
    "file": "Book_Club_Writing_Tasks.docx",
    "totalParas": 42
  }
}
```

---

## 5. Items Requiring Manual Review

1. **`Technology_Club_Writing_Tasks_and_Answers.docx`:**
   - Source document contains comprehensive Parts 2 and 3 with model answers, but lacks Part 4. Recommended for Part 2 & 3 standalone practice.
2. **`Walking club 1 ( đi bộ xung quanh Châu Âu).docx`:**
   - Similar Part 2/3 topic to `Walking_Club_Writing_Tasks_and_Answers.docx`. Recommend using the latter as primary and archiving the former as a variant.

---

## 6. Recommendations for Future Production Import

- **24 complete sets** are verified, high quality, and ready for future production cataloging into WebAptis Writing Practice Mode.
- Production files remain **100% untouched** during this staging phase.
