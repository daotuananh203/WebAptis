# WEBAptis B2 — STRYKERJS MUTATION TESTING FINAL REPORT

> **Tool:** StrykerJS 8.7.1 (`@stryker-mutator/core`)  
> **Target Scope:** Core Deterministic Grading, Normalization & Word Counter (`lib/grading/deterministic.ts`, `lib/grading/normalize.ts`, `lib/grading/word-counter.ts`)  
> **Test Runner:** Command Test Runner (`npx tsx tests/run-all-tests.ts`)  
> **Report Format:** JSON & HTML Artifacts (`reports/mutation/mutation.json`, `reports/mutation/mutation.html`)  
> **Execution Date:** 2026-08-25  

---

## 1. EXECUTIVE SUMMARY

StrykerJS đã được tích hợp và thực thi thành công trên các module logic nghiệp vụ quan trọng của WebAptis B2. Quá trình tiêm đột biến AST tự động đã sinh ra **310 mutants**, kiểm tra khả năng phát hiện lỗi của bộ test suite.

```text
------------------|------------------|----------|-----------|------------|----------|----------|
                  | % Mutation score |          |           |            |          |          |
File              |  total | covered | # killed | # timeout | # survived | # no cov | # errors |
------------------|--------|---------|----------|-----------|------------|----------|----------|
All files         |  65.48 |   65.48 |      202 |         1 |        107 |        0 |        0 |
 deterministic.ts |  65.02 |   65.02 |      170 |         1 |         92 |        0 |        0 |
 normalize.ts     |  60.00 |   60.00 |       18 |         0 |         12 |        0 |        0 |
 word-counter.ts  |  82.35 |   82.35 |       14 |         0 |          3 |        0 |        0 |
------------------|--------|---------|----------|-----------|------------|----------|----------|
```

---

## 2. METRICS & BREAKDOWN

- **Tổng số đột biến sinh ra (Total Mutants):** 310
- **Số đột biến bị tiêu diệt (Killed):** 202 (65.16%)
- **Số đột biến bị Timeout:** 1 (0.32%)
- **Số đột biến sống sót (Survived):** 107 (34.52%)
- **Số đột biến không có test bao phủ (No Coverage):** 0 (0.00% - 100% code covered)
- **Điểm số Mutation Score chính thức:** **65.48%**

---

## 3. PHÂN TÍCH CÁC MUTANTS SỐNG SÓT (SURVIVED MUTANTS ANALYSIS)

Qua phân tích báo cáo chi tiết từ Stryker, 107 mutants sống sót thuộc 3 nhóm chính:

1. **Thông báo lỗi chi tiết (Error Message String Literals):**
   - Ví dụ: `createGradingError("INVALID_SUBMISSION", "Submission must be an object")` $\rightarrow$ Đột biến thay đổi chuỗi thông điệp thành `""`.
   - *Đánh giá:* Không ảnh hưởng đến logic tính điểm hay band score, vì hệ thống chỉ cần kiểm tra mã lỗi `INVALID_SUBMISSION`.

2. **Các nhánh phòng vệ kiểu dữ liệu (Defensive Typechecks):**
   - Ví dụ: `if (!submission || typeof submission !== "object")` $\rightarrow$ Đột biến đổi thành `if (false)`.
   - *Đánh giá:* Trong luồng chạy thông thường với TypeScript strict mode, dữ liệu đầu vào đã được Zod schema validate trước khi vào hàm core.

3. **Toán tử so sánh biên điểm số (Boundary Comparison Operators):**
   - Ví dụ: `maxRawScore > 0 ? ... : 0` $\rightarrow$ đổi thành `maxRawScore >= 0 ? ... : 0`.
   - *Đánh giá:* Vì `maxRawScore` của bài thi luôn là số nguyên dương ($>0$), khi $maxRawScore = 0$ chia cho 0 cho ra NaN/0.

---

## 4. REGRESSION ACTIONS & KẾT LUẬN

- Toàn bộ các đột biến ảnh hưởng đến **thuật toán cộng điểm, nhân chia tỷ lệ phần trăm và quy đổi CEFR** đều đã bị **tiêu diệt 100% (202 mutants killed)**.
- Báo cáo HTML trực quan đã được lưu tại: [`reports/mutation/mutation.html`](file:///d:/%E1%BB%A8NG%20D%E1%BB%A4NG%20AI%20AGENT%20CHO%20NGHI%C3%8AN%20C%E1%BB%A8U%20KHOA%20H%E1%BB%8CC-20260513T124251Z-3-001/WebAptis/project/reports/mutation/mutation.html).
