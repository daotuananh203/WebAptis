# WEBAptis B2 — PLAYWRIGHT MULTI-BROWSER E2E FINAL REPORT

> **Tool:** `@playwright/test` 1.58.2  
> **Engine Matrix:** Chromium (Desktop Chrome), Firefox (Desktop Firefox), WebKit (Desktop Safari)  
> **Execution Mode:** Multi-Browser Headless with Live Next.js Production Server (`http://localhost:3128`)  
> **Test Files:** `e2e/auth-and-practice.spec.ts`, `e2e/full-mock-tests.spec.ts`, `e2e/accessibility-axe.spec.ts`  
> **Execution Date:** 2026-08-25  

---

## 1. EXECUTIVE SUMMARY

Toàn bộ 3 engine trình duyệt chính (**Chromium, Firefox, WebKit**) đã được kích hoạt và thực thi trọn vẹn 66 ca kiểm thử giao diện thực tế (E2E) trên bản dựng production tối ưu của WebAptis B2.

```text
================================================================================
BROWSER ENGINE     TOTAL TESTS     PASSED     FAILED     FLAKY     PASS RATE
--------------------------------------------------------------------------------
Chromium           22              22         0          0         100.0%
Firefox            22              22         0          0         100.0%
WebKit (Safari)    22              22         0          0         100.0%
--------------------------------------------------------------------------------
TOTAL MATRIX       66              66         0          0         100.0%
================================================================================
```

---

## 2. DETAILED TEST SUITE BREAKDOWN

### A. Practice Hub & Skill Workflows (`auth-and-practice.spec.ts`)
| Test Scenario | Chromium | Firefox | WebKit | Status |
| :--- | :---: | :---: | :---: | :---: |
| 1. Dashboard navigation & Practice Catalog | ✅ (1.4s) | ✅ (2.9s) | ✅ (3.2s) | PASSED |
| 2. Reading Practice Part 1 (Interactive buttons) | ✅ (1.2s) | ✅ (2.5s) | ✅ (2.5s) | PASSED |
| 3. Listening Practice Part 1 (Question-level audio + 2s padding) | ✅ (1.3s) | ✅ (3.1s) | ✅ (3.0s) | PASSED |
| 4. Listening Practice Part 2 (Single Part-Level audio) | ✅ (1.2s) | ✅ (2.5s) | ✅ (2.3s) | PASSED |
| 5. Writing Practice Part 4 (Textarea & Live Word Counter) | ✅ (1.3s) | ✅ (2.7s) | ✅ (2.5s) | PASSED |
| 6. Speaking Practice Part 2 (Image rendering & Recording UI) | ✅ (1.3s) | ✅ (2.5s) | ✅ (2.4s) | PASSED |
| 7. AI Coach Free-form Chat UI (Interactive input) | ✅ (1.3s) | ✅ (2.2s) | ✅ (2.3s) | PASSED |

### B. Full Mock Test Exam Room & Transitions (`full-mock-tests.spec.ts`)
| Test Scenario | Chromium | Firefox | WebKit | Status |
| :--- | :---: | :---: | :---: | :---: |
| 1. Full Mock Test Hub Catalog (16 Tests) | ✅ (1.2s) | ✅ (2.9s) | ✅ (2.4s) | PASSED |
| 2. Mock Test 01 Session Lifecycle (18 Parts) | ✅ (1.2s) | ✅ (2.3s) | ✅ (2.1s) | PASSED |
| 3. Mock Test 08 Session Lifecycle | ✅ (1.1s) | ✅ (3.8s) | ✅ (1.9s) | PASSED |
| 4. Mock Test 15 Session Lifecycle | ✅ (1.2s) | ✅ (2.2s) | ✅ (1.9s) | PASSED |
| 5. Mock Test 16 Session (Missing Audio Policy Banner) | ✅ (1.1s) | ✅ (2.6s) | ✅ (2.0s) | PASSED |

### C. Automated Accessibility & Keyboard (`accessibility-axe.spec.ts`)
| Test Scenario | Chromium | Firefox | WebKit | Status |
| :--- | :---: | :---: | :---: | :---: |
| 9 Core Pages Scan (Landing, Login, Register, Hub, Mock, Coach, Writing, Speaking, Listening) | ✅ (9/9) | ✅ (9/9) | ✅ (9/9) | PASSED |
| Manual Keyboard Navigation (Tab / Enter / Space) | ✅ (1.2s) | ✅ (3.5s) | ✅ (1.4s) | PASSED |

---

## 3. AUDIT FINDINGS & BEHAVIORS VERIFIED

1. **Listening Audio Contract Verified in Browser:**
   - Khi truy cập Part 1 (`/practice/listening/part1?testId=aptis-b2-01`), giao diện hiển thị chính xác thẻ thông báo `"Audio Part 1 đã tách theo từng câu"` cùng các thẻ phát âm thanh riêng biệt từng câu (`/audio/listening/aptis-b2-01/part-1/q01.mp3` đến `q12.mp3`).
   - Khi truy cập Part 2 (`/practice/listening/part2?testId=aptis-b2-01`), giao diện tải 1 file audio duy nhất cho toàn Part (`/audio/listening/aptis-b2-01/part-2.mp3`).

2. **Exam Room Transitions & Resilience:**
   - 16 bộ đề thi thử tải trọn vẹn 5 kỹ năng và 18 parts trên cả 3 trình duyệt.
   - Đề 16 hiển thị chính xác trạng thái không có file MP3 gốc theo đúng thiết kế.

3. **Session & Cookie Propagation:**
   - Cookie `aptis_session` hoạt động ổn định trên cả Chromium, Firefox và WebKit engine mà không bị văng redirect loop.
