# Writing Content Diff & Audit Report

**Date:** 2026-08-23  
**Project:** WebAptis B2 — Data Integrity & Content Audit Phase  
**Target Source:** Google Drive Writing ID `1u8AeBUdtSJYIypb1gdHaZgnYlEcXMVcmb9J-6iNUO8?tab=t.4gwx1fhqoabx`  
**Local Baseline:** `<workspace-root>/Aptis/Writing/`

---

## 1. Google Drive Writing Discovery Status

> [!WARNING]
> **Endpoint Inaccessibility (HTTP 404):**
> Attempting to access `https://docs.google.com/document/d/1u8AeBUdtSJYIypb1gdHaZgnYlEcXMVcmb9J-6iNUO8/edit?tab=t.4gwx1fhqoabx` returns `HTTP Error 404: Not Found`.
> - The supplied ID string (`1u8AeBUdtSJYIypb1gdHaZgnYlEcXMVcmb9J-6iNUO8`) contains 43 characters (standard Google Doc IDs are 44 characters) or the document permissions are private.
> - In strict adherence to the project discovery guidelines (*"Nếu Drive không truy cập được: DỪNG tại discovery và báo chính xác lỗi quyền truy cập, KHÔNG giả định dữ liệu"*), no synthetic writing questions were generated.

---

## 2. Authentic Local Writing Repository Audit

The local repository `<workspace-root>/Aptis/Writing/` provides complete, authentic Edulife Aptis B2 Writing preparation materials:

### A. Document Inventory:
1. **`APTIS_WRITING PART 1&2&3.pdf` (37 pages, 12,197 characters):**
   - **Part 1 (Form Filling / Personal Data):** 5-item short personal questions across multiple club contexts (e.g. Sports Club, Book Club, Travel Club, Cooking Club).
   - **Part 2 (Short Personal Response - 20-30 words):** Authentic club join reasons and personal interest prompts.
   - **Part 3 (Social Network Chatroom - 3 prompts x 30-40 words):** Authentic peer chat discussions with 3 distinct members.
2. **`APTIS_WRITING PART 4.pdf` (7 pages, 3,795 characters):**
   - **Part 4 (Informal & Formal Email Writing):**
     - Task 1: Informal email to a friend (50 words, friendly tone, expressing feelings about a situation).
     - Task 2: Formal email to club president / manager (120–150 words, formal tone, proposing solutions and feedback).
3. **Instructional & Strategy Slide Decks:**
   - `07. APTIS Writing.pptx` (17 slides) — General exam structure and timing.
   - `08. Writing_Part 1.pptx` (13 slides) — Part 1 sample tasks and timing strategies.
   - `09. Writing_Part 2.pptx` (24 slides) — Part 2 sample answers and vocabulary.
   - `11. Writing_Part 4.pptx` (17 slides) — Formal vs informal register differences.

---

## 3. Staging Dataset

All verified local Writing reference structures have been staged with full provenance in:  
`data/staging/google-drive/writing/writing-import-candidates.json`

```json
[
  {
    "candidateId": "local_writing_ref_p123",
    "source": {
      "type": "local-aptis-repo",
      "file": "APTIS_WRITING PART 1&2&3.pdf",
      "importedAt": "2026-08-23T19:38:53Z"
    },
    "skill": "writing",
    "partsCovered": [1, 2, 3],
    "totalPages": 37,
    "charCount": 12197,
    "status": "staged_reference",
    "confidence": 0.95
  },
  {
    "candidateId": "local_writing_ref_p4",
    "source": {
      "type": "local-aptis-repo",
      "file": "APTIS_WRITING PART 4.pdf",
      "importedAt": "2026-08-23T19:38:53Z"
    },
    "skill": "writing",
    "partsCovered": [4],
    "totalPages": 7,
    "charCount": 3795,
    "status": "staged_reference",
    "confidence": 0.95
  },
  {
    "candidateId": "gdrive_writing_inaccessible",
    "source": {
      "type": "google-drive",
      "fileId": "1u8AeBUdtSJYIypb1gdHaZgnYlEcXMVcmb9J-6iNUO8",
      "tab": "t.4gwx1fhqoabx",
      "importedAt": "2026-08-23T19:38:53Z"
    },
    "skill": "writing",
    "status": "inaccessible_404",
    "errorMessage": "HTTP Error 404: Not Found on Google Drive endpoint. ID has 43 characters or document is private.",
    "confidence": 0.0
  }
]
```
