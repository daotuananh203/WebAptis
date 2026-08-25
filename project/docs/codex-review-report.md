# BÁO CÁO CODEX REVIEW

**Phạm vi:** `project/` — WebAptis B2  
**Ngày review:** 2026-08-22  
**Phương pháp:** đọc tài liệu và source độc lập, static review, unit/integration tests, production build, HTTP smoke/API abuse cases. Không commit/push/deploy.

## Tổng quan

Ứng dụng build được và bộ test nội bộ 13/13 nhóm pass, nhưng các test hiện tại chủ yếu kiểm tra domain/pure functions và mô phỏng flow. Review runtime cho thấy các flow quan trọng chưa đạt hợp đồng mà tài liệu mô tả, đặc biệt Speaking, Listening practice và full Mock Test. Vì vậy kết quả “pass” không đủ để kết luận production-ready.

Kiến trúc hiện tại là Next.js App Router với client-heavy UI, Route Handlers cho dataset/AI grading, deterministic grading cho objective sections và `localStorage` cho progress/session. Phân tách `GEMINI_API_KEY` khỏi client được thiết kế đúng, nhưng API AI hiện public, không có authentication/rate limit/chi phí quota.

## Findings theo severity

### CRITICAL

Không phát hiện Critical đã chứng minh được trong phạm vi test hiện tại.

### HIGH

#### H1 — Speaking practice không thể ghi âm/chấm theo flow thực tế

- **File/vị trí:** `project/components/practice/question-renderer.tsx:547-610`, `project/components/practice/practice-shell.tsx:195-225`.
- **Vấn đề:** UI chỉ có nút “Simulate Recording Audio” và lưu một chuỗi dummy WAV; không có `MediaRecorder`, microphone permission, countdown theo câu hỏi hay audio playback. Khi submit, client gửi `audioData.base64Data`, trong khi `/api/grade/speaking` yêu cầu `audioBase64`, `mimeType`, `taskId` và `durationSeconds`.
- **Evidence:** request thực tế với schema hợp lệ cho API khác cấu trúc client gửi; route trả 400 nếu `audioBase64` thiếu. Sau khi đổi payload, client còn đọc `gradingResultData.score.scaledScore`, nhưng server trả `overallScore`/`maxOverallScore` ở top level.
- **Impact:** Speaking practice luôn lỗi hoặc không thể đánh giá recording thật; kết quả progress không đáng tin.
- **Recommendation:** triển khai và test một recorder thật theo từng task; thống nhất một DTO dùng chung giữa UI/route/result; thêm browser test có mock `MediaRecorder`.
- **Status:** **Chưa fix** — vượt phạm vi hardening nhỏ.

#### H2 — Full Mock Test chỉ grade/render phần đầu của các kỹ năng

- **File/vị trí:** `project/components/mock-test/exam-shell.tsx:88-113`, `:135-181`; `project/components/practice/question-renderer.tsx:170-208`, `:386-480`.
- **Vấn đề:** Mock chọn `reading.parts[0]`, `listening.parts[0]`, `writing.parts[0]`, `speaking.parts[0]` và gán `partIdentifier` cố định `part1`; submit cũng gọi API với `partNumber: 1`. `currentIndex` chỉ thay đổi palette nhưng không đổi `activePartData`/part identifier. Renderer Reading Part 2 còn lấy `stories[0]`; Listening chỉ có UI cho Part 1 và Part 3.
- **Impact:** một “full mock” bỏ qua hoặc không cho trả lời/chấm Reading 2–4, Listening 2/4, Writing 2–4, Speaking 2–4. Có thể lưu progress với điểm thiếu hoặc zero nhưng hiển thị như đã hoàn thành.
- **Recommendation:** model hóa section/task navigation rõ ràng, map mọi part/task vào session, grade toàn bộ section bằng orchestrator; thêm E2E assertion cho từng part.
- **Status:** **Chưa fix**.

#### H3 — AI endpoints không có auth, rate limiting hoặc cost protection

- **File/vị trí:** `project/app/api/grade/writing/route.ts:7-64`, `project/app/api/grade/speaking/route.ts:7-69`, `project/app/api/coach/chat/route.ts:7-59`.
- **Vấn đề:** các POST route public; không có authentication, per-IP/user throttling, concurrency cap, request timeout, quota hoặc retry policy. Chỉ cần gọi route hợp lệ là có thể kích hoạt Gemini cost và audio processing.
- **Impact:** abuse/DoS/chi phí ngoài dự kiến; nếu deploy public, đây là rủi ro production rõ ràng.
- **Recommendation:** auth/session hoặc server-issued abuse token, rate limit phân tán, body-size limit ở edge/server, timeout/circuit breaker, quota/observability.
- **Status:** **Chưa fix**.

#### H4 — Structured output mới được validate sau model call, chưa dùng `responseSchema`

- **File/vị trí:** `project/lib/grading/writing-ai.ts:254-261`, `project/lib/grading/speaking-ai.ts:256-263`, `project/lib/coach/advisor.ts:88-95`.
- **Vấn đề:** code đặt `responseMimeType: "application/json"` và Zod-validate response sau đó, nhưng không truyền schema JSON vào Gemini dù docs dự án tuyên bố structured output bị ràng buộc bằng response schema. `maxOverallScore` và số criteria cũng không được đối chiếu với rubric/task context; model có thể trả một scale khác nhưng vẫn qua Zod.
- **Impact:** malformed score bị chặn phần nào, nhưng rubric drift/điểm sai scale vẫn có thể lọt; AI có thể trả recommendation/model answer không grounded.
- **Recommendation:** dùng `responseSchema` tương thích SDK, validate invariant deterministically (allowed criterion names, max score, score sum, task ID), fallback an toàn khi model lỗi.
- **Status:** **Chưa fix**.

### MEDIUM

#### M1 — Error response có thể leak chi tiết SDK/server

- **File/vị trí:** các API route, ví dụ `project/app/api/grade/writing/route.ts:54-61` và `project/app/api/tests/[testId]/route.ts:25-28`.
- **Vấn đề:** trả trực tiếp `error.message` cho client. SDK/Gemini/path/runtime errors có thể chứa endpoint, model, file path hoặc chi tiết vận hành.
- **Impact:** information disclosure và khó kiểm soát contract lỗi.
- **Recommendation:** log server-side với correlation ID; client chỉ nhận mã lỗi/message allowlist; không trả stack/SDK message ở production.
- **Status:** **Chưa fix**.

#### M2 — Prompt injection defense chỉ là instruction, không phải enforcement

- **File/vị trí:** `project/lib/grading/prompts/writing.ts`, `project/lib/grading/prompts/speaking.ts`, `project/lib/coach/prompts.ts`.
- **Vấn đề:** input được đặt trong delimiter và system instruction nói không nghe lệnh candidate, nhưng vẫn gửi toàn văn candidate/transcript vào cùng model context. Không có post-check để loại system-prompt leak, fabricated statistics hoặc recommendation ngoài trusted context.
- **Impact:** model có thể bị yêu cầu bỏ rubric, bịa nguồn/số liệu, hoặc lộ nội dung instruction; Zod không phát hiện semantic abuse.
- **Recommendation:** tách trusted task data khỏi untrusted text/audio, không cho coach tự tạo statistics (chỉ render số từ context), output policy check và grounding checks.
- **Status:** **Chưa fix**.

#### M3 — Audio validation chưa kiểm tra base64/magic bytes và duration

- **File/vị trí:** `project/lib/grading/speaking-ai.ts:152-170`; `project/lib/grading/speaking-schema.ts:38-50`.
- **Vấn đề:** chỉ allowlist MIME và ước lượng kích thước từ chuỗi; không verify base64 hợp lệ, container signature, decoded duration hoặc consistency giữa duration và payload.
- **Impact:** dữ liệu hỏng/không phải audio vẫn đi tới Gemini; tiêu tốn tài nguyên và lỗi khó chẩn đoán.
- **Recommendation:** decode/validate bounded bytes, sniff container, enforce duration per part và reject mismatch trước model call.
- **Status:** **Chưa fix**.

#### M4 — `localStorage` được tin cậy khi load và có thể làm sai progress

- **File/vị trí:** `project/lib/storage/storage.ts:80-93`, `project/app/dashboard/page.tsx:17-37`.
- **Vấn đề:** JSON được parse và chỉ kiểm tra một số container ở vài hàm; không validate schema/range cho `ProgressAttemptRecord`, score, timestamps, skill hoặc session state. Người dùng/extension có thể sửa dữ liệu local.
- **Impact:** dashboard/recommendation/streak có thể hiển thị sai; dữ liệu client không nên được coi là audit-grade.
- **Recommendation:** schema-validate khi load, clamp/reject invalid records, version migration, coi toàn bộ progress là untrusted client state.
- **Status:** **Chưa fix**.

#### M5 — Practice timer không gắn submit khi hết giờ và thời gian không theo Aptis part

- **File/vị trí:** `project/components/practice/practice-shell.tsx:246-247`, `project/components/practice/practice-timer.tsx:17-48`.
- **Vấn đề:** `PracticeTimer` nhận callback optional nhưng caller không truyền `onTimeExpired`/`onTick`; mọi practice dùng `initialSeconds={600}` dù catalog/tài liệu mô tả timing khác nhau. Timer hết không auto-submit/lock.
- **Impact:** practice timing không phản ánh project spec; người dùng vẫn có thể submit sau timeout.
- **Recommendation:** centralize timing config, persist remaining time, auto-submit/lock deterministically và test expiry.
- **Status:** **Chưa fix**.

### LOW

#### L1 — Dead/placeholder UI và type safety yếu ở đường critical

- **File/vị trí:** `practice-shell.tsx`, `exam-shell.tsx`, `question-renderer.tsx` dùng nhiều `any`; Speaking hiển thị đường dẫn ảnh dạng text thay vì ảnh thật; audio assets là mock paths.
- **Impact:** maintainability thấp, lỗi contract khó bắt ở compile time, UX có thể gây hiểu nhầm.
- **Recommendation:** tạo discriminated union cho part/task DTO, bỏ `any` theo từng flow, kiểm tra asset tồn tại.
- **Status:** **Chưa fix**.

#### L2 — Duplicate orchestration giữa practice/mock và domain graders

- **File/vị trí:** `practice-shell.tsx`, `exam-shell.tsx`, `lib/grading/*`, `lib/storage/session.ts`.
- **Vấn đề:** mapping result, score scaling, persistence và error handling lặp ở UI; dễ tạo mismatch như Speaking hiện tại.
- **Impact:** regression risk và khó bảo trì.
- **Recommendation:** chỉ sau khi sửa flow, đưa orchestration vào typed application service dùng chung; đây là refactor có kiểm soát, không phải ưu tiên trước các H findings.
- **Status:** **Chưa fix**.

### INFO

#### I1 — Hardening đã thực hiện trong review

- `project/app/api/tests/[testId]/route.ts`: reject `testId` chứa path separator/ký tự ngoài allowlist.
- `project/app/api/grade/deterministic/route.ts`: validate `testId`, reject array answers.
- `project/lib/grading/writing-schema.ts`: giới hạn test ID, submission text 20,000 ký tự và tối đa 20 response fields.
- `project/lib/grading/speaking-schema.ts`: giới hạn test ID, base64 14,000,000 ký tự và transcript 20,000 ký tự.
- Các thay đổi này không giải quyết auth/rate-limit hay flow defects.

## Bugs đã sửa

Đã sửa hardening nhỏ, an toàn nêu ở I1. Không sửa các flow Speaking/Mock/Listening vì cần thay đổi state model và UI architecture, không phù hợp chính sách “không refactor lớn”. Không thêm feature mới.

## Tests đã chạy

- `npm run typecheck` — **PASS**.
- `npm test` — **PASS, 13/13 nhóm**; lưu ý đây là test domain/mock UI-flow, chưa phải browser E2E.
- `npm run build` — **PASS**; Next.js 16.3.2/Turbopack compile, typecheck, static generation thành công.
- `npm run start` — **đã chạy thành công trước khi hardening trên `http://localhost:3000`**.
- HTTP smoke trước hardening trên port 3000: `/`, `/dashboard`, `/practice`, `/practice/reading/part1`, `/mock-test`, `/mock-test/session/aptis-b2-01`, `/mock-test/results/fake`, `/coach` đều HTTP 200; `/api/tests/aptis-b2-01` HTTP 200; unknown dataset 404.
- API abuse cases: missing deterministic payload 400; path-like test ID bị reject/không đọc được file; empty audio 400; 20,000-char coach message 400.
- Live Gemini writing/speaking chưa chạy vì không có API key/network contract được cấu hình cho test; đây là giới hạn verify, không phải pass.

## E2E/browser verification

Không có browser automation tool trong môi trường hiện tại, nên chưa verify click/navigation/timer/autosave/microphone bằng browser thật. HTTP smoke chỉ chứng minh route render/response, không chứng minh hydration, button interaction, MediaRecorder, audio playback, hoặc localStorage resume. Khi restart sau build, port 3000 bị giữ (`EADDRINUSE`) và port thay thế cũng bận; không claim clean post-fix server E2E.

Các flow chưa được chứng minh end-to-end: Speaking recording/submission, full Mock grading/result, Listening Part 2/4 interaction, progress update sau browser submission, recommendation sau AI result, AI Coach live response.

## Security

Điểm tốt: API key chỉ được đọc trong `lib/gemini/config.ts`/server client; không thấy `GEMINI_API_KEY` trong client components; public dataset tách khỏi answer key và anti-leak test pass; Zod có giới hạn cơ bản cho coach/audio.

Điểm không đạt: public AI endpoints không auth/rate-limit/quota; error leakage; input/audio chưa validate sâu; prompt injection chỉ dựa vào instruction; localStorage không phải trusted storage. Không phát hiện path traversal đọc file trong thử nghiệm; đã thêm allowlist hardening.

## Aptis correctness

### OFFICIAL FACT

Theo British Council, Aptis ESOL General gồm core Grammar & Vocabulary, Listening, Reading, Speaking và Writing; timing chính thức là Core 25 phút, Reading 35, Listening khoảng 40, Writing 50 và Speaking khoảng 12 phút. British Council mô tả Listening 17 tasks/20 recordings và nghe mỗi recording tối đa hai lần; Writing Part 4 là informal 40–50 từ và formal 120–150 từ; Speaking có 30 giây Part 1, 45 giây cho từng response Parts 2–3, và 60 giây chuẩn bị/120 giây nói Part 4. Nguồn: [British Council — Prepare for Aptis ESOL General](https://www.britishcouncil.org/exam/english/aptis/prepare-general), [Aptis General format overview PDF](https://www.britishcouncil.org/sites/default/files/aptis_general_test_format_overview_2023_0.pdf), [British Council Vietnam — Aptis ESOL General](https://www.britishcouncil.vn/thi/aptis/cac-phien-ban/thong-dung).

### PROJECT DESIGN

Các raw score, rubric 0–5, practice disclaimer và estimated band trong code là thiết kế practice, không phải official score conversion. Code có disclaimer “NOT AN OFFICIAL BRITISH COUNCIL SCORE”, đây là đúng hướng.

### Kết quả audit

Dataset schema ghi đúng nhiều format/timing cốt lõi. Tuy nhiên implementation không đạt dataset contract: Reading Part 2 chỉ render story đầu; Listening Part 2/4 không render; Speaking UI không record; Mock không ghép/chấm đủ parts. Ngoài ra project docs có claim “100% compliant/verified” nhưng evidence runtime không đủ để hỗ trợ claim đó.

Không tự tạo hoặc xác nhận bất kỳ bảng chuyển đổi CEFR chính thức nào.

## AI review

- `@google/genai` được dùng server-side qua singleton; model identifiers tập trung trong `lib/gemini/models.ts`.
- Writing/Speaking/Coach có Zod post-validation và prompt delimiter; đây là kiểm soát hữu ích nhưng chưa đủ chống semantic prompt injection/rubric drift.
- Không có retry/backoff/rate-limit/timeout/circuit breaker rõ ràng; mọi exception bị quy về grading error và có thể leak message.
- Writing không enforce max overall score hoặc criterion set theo task sau khi parse; Speaking cho phép `maxOverallScore` dương tùy model trong khi schema overall score max 25. UI lại kỳ vọng scale 50. Đây là điểm correctness nghiêm trọng.
- AI Coach nhận context trusted từ client (`coachContext`) nhưng route không xác minh history/statistics server-side; client có thể gửi số liệu giả để nhận recommendation/answer dựa trên dữ liệu giả.

## Architecture verdict

**Needs major corrective work before production.** Next App Router/server boundary cơ bản đúng, nhưng UI orchestration và data-flow không nhất quán với domain model; static build không bắt được các mismatch runtime.

## Security verdict

**Not production-safe for public exposure.** API key không bị thấy trong client bundle theo source review, nhưng public AI routes thiếu abuse controls và còn error/input/prompt risks.

## Aptis correctness verdict

**Partial.** Format/timing dataset và tài liệu phần lớn khớp OFFICIAL FACT, nhưng implementation practice/mock không cover đầy đủ các part và không nên được mô tả là full Aptis simulation.

## AI verdict

**Unsafe as a high-trust grader.** Có structured parsing và disclaimer, nhưng chưa có invariant scoring/grounding/rate protection; Speaking contract hiện hỏng ở client-server boundary.

## Test verdict

**Build/test pass, independent runtime review fails acceptance.** 13/13 test groups, typecheck và build pass; HTTP route smoke pass; browser E2E và live Gemini chưa verify. Các defect H1–H4 vẫn tồn tại.

## Production-readiness verdict

**Not production-ready.** Còn nhiều HIGH findings và các E2E quan trọng chưa verify.

## Files thay đổi

- `project/docs/codex-review-report.md` — báo cáo này.
- `project/app/api/tests/[testId]/route.ts` — `testId` allowlist.
- `project/app/api/grade/deterministic/route.ts` — payload/test ID hardening.
- `project/lib/grading/writing-schema.ts` — giới hạn input.
- `project/lib/grading/speaking-schema.ts` — giới hạn audio/transcript input.

## Một bước tiếp theo duy nhất

Sửa và browser-test **một vertical slice Speaking hoàn chỉnh** (MediaRecorder → taskId/DTO → API → validated result → progress), rồi dùng cùng contract đó làm mẫu để sửa Mock Test orchestration.

