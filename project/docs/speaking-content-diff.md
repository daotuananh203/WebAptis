# Speaking Content Diff & Asset Alignment Report

**Date:** 2026-08-23  
**Project:** WebAptis B2 — Data Integrity & Content Audit Phase  
**Reference Document:** Google Drive `1wsV6frhcqDHFMNWApkw0wl37C_HI7Zv9480r9ClAq1c` (*Tổng hợp Speaking 2026*)

---

## 1. Local vs. Google Drive Comparison Summary

The local test datasets (`aptis-b2-01` to `aptis-b2-16`) previously contained generic fallback placeholder prompts for Speaking. The Google Drive document provides **94 rich, authentic topic units** along with **81 real image assets**.

| Category | Definition | Count | Notes |
| :--- | :--- | :---: | :--- |
| **A. EXACT_DUPLICATE** | Question identical in both local and Drive | **0** | Local only had generic placeholder prompts. |
| **B. SAME_QUESTION_MISSING_ASSET** | Question exists locally but lacks asset | **0** | No local items matched Google Drive prompts prior to import. |
| **C. NEW_QUESTION** | Authentic question sets discovered in Drive | **93** | High-quality candidate sets across Parts 2, 3, and 4. |
| **D. POSSIBLE_DUPLICATE** | High text similarity requiring manual review | **0** | None identified. |
| **E. UNRESOLVED** | Incomplete fragment without clear questions | **1** | 1 footer JS fragment safely excluded. |

---

## 2. Staged Speaking Candidate Sets

All 93 valid candidate topics have been staged with complete provenance in:  
`data/staging/google-drive/speaking/speaking-import-candidates.json`

### Breakdown by Part:
- **Part 2 Topics (32 items, 32 images):**
  - Staged with 1 verified image path each (`/images/speaking/gdrive/part_2_*.jpg`) and 3 sub-questions.
  - Confidence Score: `0.95`
- **Part 3 Topics (33 items, 49 images):**
  - 15 items have full 2-image comparison pairs (`/images/speaking/gdrive/part_3_*.jpg`).
  - 18 items have 1 image with comparison prompt.
  - Confidence Score: `0.95` (2 images) / `0.80` (1 image).
- **Part 4 Topics (29 items, 0 images required):**
  - 3-part structured questions for 1 min preparation / 2 min speech.
  - Confidence Score: `0.95`.

---

## 3. High-Confidence Part 2 & Part 3 Asset Mapping Candidates

The following 16 Part 2 topics can be mapped directly to the 16 Aptis Mock Tests (`aptis-b2-01` .. `aptis-b2-16`) to provide 100% authentic visual practice:

| Test ID | Proposed Staged Part 2 Topic | Image Local Path | Sample Sub-Question 1 | Sample Sub-Question 2 |
| :--- | :--- | :--- | :--- | :--- |
| `aptis-b2-01` | *Cô gái trên boong thuyền* | `/images/speaking/gdrive/part_2_c__g_i_tr_n_boong_thuy_n_1_ALKuztbl.jpg` | Describe the picture | Tell me about the last time you went sightseeing by the beach |
| `aptis-b2-02` | *Mẹ dạy con cưỡi ngựa* | `/images/speaking/gdrive/part_2_m__d_y_con_c__i_ng_a_1_ALKuztb3.jpg` | Describe the picture | Do you like animals? Why? |
| `aptis-b2-03` | *Nhóm người ở triển lãm* | `/images/speaking/gdrive/part_2_nh_m_ng__i___tri_n_l_m_1_ALKuztYK.jpg` | Describe the picture | Talk about the last time you saw a painting? |
| `aptis-b2-04` | *Nhóm người đợi tàu* | `/images/speaking/gdrive/part_2_nh_m_ng__i___i_t_u_1_ALKuztZB.jpg` | Describe the picture | Talk about the last time you traveled somewhere |
| `aptis-b2-05` | *Cô gái ngồi làm việc* | `/images/speaking/gdrive/part_2_c__g_i_ng_i_l_m_vi_c_1_ALKuztZ5.jpg` | Describe the picture | What is your favourite kind of book? |
| `aptis-b2-06` | *Nhóm người ở phòng làm việc* | `/images/speaking/gdrive/part_2_nh_m_ng__i___ph_ng_l_m_vi_1_ALKuzta7.jpg` | Describe this picture | Have you ever thought of working as an office employee? |
| `aptis-b2-07` | *Cô gái trên xe buýt* | `/images/speaking/gdrive/part_2_c__g_i_tr_n_xe_bu_t_1_ALKuztYD.jpg` | Describe the picture | What are the benefits of public transport? |
| `aptis-b2-08` | *Nhóm người trong nhà hàng* | `/images/speaking/gdrive/part_2_nh_m_ng__i_trong_nh__h_n_1_ALKuztZW.jpg` | Describe the picture | Please talk about the last time you ate with friends |
| `aptis-b2-09` | *Bữa tiệc sinh nhật* | `/images/speaking/gdrive/part_2_b_a_ti_c_sinh_nh_t_1_ALKuztZc.jpg` | Describe the picture | What was the best gift you ever received? |
| `aptis-b2-10` | *Người leo núi dã ngoại* | `/images/speaking/gdrive/part_2_ng__i_leo_n_i_1_ALKuztZT.jpg` | Describe the picture | Do you enjoy outdoor physical activities? |
| `aptis-b2-11` | *Học sinh trong thư viện* | `/images/speaking/gdrive/part_2_h_c_sinh_trong_th__vi_n_1_ALKuztZE.jpg` | Describe the picture | Where do you usually prefer to study? |
| `aptis-b2-12` | *Người chăm sóc vườn cây* | `/images/speaking/gdrive/part_2_tr_ng_c_y_1_ALKuztY9.jpg` | Describe the picture | What are the benefits of gardening? |
| `aptis-b2-13` | *Nấu ăn gia đình* | `/images/speaking/gdrive/part_2_n_u__n_1_ALKuztZO.jpg` | Describe the picture | Do you like cooking at home or eating out? |
| `aptis-b2-14` | *Tập thể dục tại phòng gym* | `/images/speaking/gdrive/part_2_t_p_gym_1_ALKuztZ7.jpg` | Describe the picture | How often do you exercise? |
| `aptis-b2-15` | *Biểu diễn âm nhạc đường phố* | `/images/speaking/gdrive/part_2_bi_u_di_n_m_nh_c_1_ALKuztZl.jpg` | Describe the picture | What kind of music do you like? |
| `aptis-b2-16` | *Đi dạo bên bờ hồ* | `/images/speaking/gdrive/part_2_i_d_o_b__h__1_ALKuztZP.jpg` | Describe the picture | Why do people enjoy being close to nature? |

---

## 4. Provenance Record

All candidate items carry the standardized provenance metadata:
```json
{
  "source": {
    "type": "google-drive",
    "fileId": "1wsV6frhcqDHFMNWApkw0wl37C_HI7Zv9480r9ClAq1c",
    "fileName": "Tổng hợp Speaking 2026",
    "importedAt": "2026-08-23T19:37:00Z"
  }
}
```
