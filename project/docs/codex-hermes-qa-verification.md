# Codex — Hermes QA Remediation Verification

## FINAL PRODUCTION DEPLOYMENT + VERIFICATION

Đây là báo cáo xác minh sau remediation trên Production hiện tại, không phải bản sao kết luận cũ của Hermes. Finding QA-FU-P1-004 đã được sửa ở route/service/prompt/schema và đã được kiểm chứng bằng Gemini thật trên deployment Production `4qUnmxrrb9o6cmy9n5Xdee1oJFcP`, alias `https://web-aptis.vercel.app`, commit `04af9beebbb219fbfb3ce04e81e57ac3fc4ef68b`.

Kết quả hiện tại:

- P1: 9/9 remediation đã được kiểm chứng trên Production hiện tại; không có P1 regression.
- P2 confirmed: 27/28 đã sửa và được kiểm chứng; 1 blocked vì source candidate không có prompt/image có thể phục hồi mà không bịa dữ liệu.
- P3 confirmed: 2/2 đã sửa.
- 2 source limitations vẫn blocked: placement-hash authority và lifecycle của audit artifacts.
- 1 finding là design/expected, được đánh dấu NOT APPLICABLE.
- Không có P0 và không có false positive.
- Finding mới QA-P2-COACH-001 đã được sửa và kiểm chứng ở local; chưa tính là Production-fixed cho tới khi deployment tiếp theo được kiểm tra.

## Phạm vi và phương pháp

- Đã đọc project/docs/hermes-full-qa-report.md và project/data/audits/hermes-full-qa-report.json.
- Đã đối chiếu 20 finding ban đầu + 22 follow-up, ưu tiên security/auth, data integrity, exam correctness, AI grading, persistence/timer và UI/accessibility.
- Đã tái hiện production baseline bằng browser/API/source probes; sau đó kiểm chứng deployment mới bằng HTTPS API, Gemini thật, source-to-render matrix và Chromium browser smoke.
- Với source-derived content, chỉ dùng text/mapping/hash có evidence; không thêm placeholder, không random hóa, không xóa answer key để làm test pass.
- Speaking AI real microphone chưa được tuyên bố PASS: campaign này không có human/live microphone evidence và không dùng TTS/synthetic audio.

## Validation evidence

- npm test: 44/44 master red-team suites PASS.
- npm run typecheck: PASS.
- npm run build: PASS. Còn một warning không blocking của Next.js về convention middleware deprecated.
- npm run smoke-test: PASS trên local production build (next start), gồm auth, protected routes, public test API và anonymous grading denial.
- Writing regression: multi-task 2-task và 4-task batch PASS; canonical task IDs được giữ, prompt chứa đúng context/answer của từng task, provider output được reorder theo canonical order, thiếu/unknown task bị fail-closed; single-task Parts 1–4 vẫn PASS.
- Chromium production smoke: PASS cho register/login, mobile navigation, no horizontal overflow, settings, invalid-resource error, dialog semantics, result ownership và safe redirect. Separate 69-image Speaking browser smoke và 7-test four-skills Listening browser smoke cũng PASS.
- Production content matrix: 7/7 four-skills Reading có Person A/B/C/D non-empty, 0 answer-key ID không render, 0 PDF position marker; standard Reading Part 2 source/data scan không ghi nhận duplicate anchor trong các dataset đã kiểm tra.
- Speaking bank Production API: Part 2=34, Part 3=39; p3-035 `source-limited` với Image A/B rỗng, available pairs không bị trộn; toàn bộ 69 image declarations render được trong Chromium.
- Writing baseline reproduction: multi-task route gọi provider tuần tự theo từng task; một provider response rỗng bị route quy thành `INVALID_ANSWER_FORMAT` và làm hỏng toàn submission. Sau fix, batch orchestration thực hiện một request có schema `taskResults[]`, bắt buộc exact task IDs và giữ context riêng từng task.
- Production hiện chạy commit `04af9beebbb219fbfb3ce04e81e57ac3fc4ef68b`; không còn chạy `00156259ece991933335a249367143a5ef84811d` hoặc `14d6883dbf0cf4f5c1bd8907e338bf46ca1fe6a`.
- AI Coach regression: baseline production đã tái hiện provider response rỗng/malformed bị route quy thành HTTP 400 `INVALID_ANSWER_FORMAT`; local remediation test xác nhận retry tối đa một lần, recovery thành công và lỗi cuối trả taxonomy provider/timeout an toàn.

## Production deployment verification

- Production URL: https://web-aptis.vercel.app
- Vercel deployment: `4qUnmxrrb9o6cmy9n5Xdee1oJFcP`, trạng thái READY, Production alias `https://web-aptis.vercel.app`, deployment URL `https://web-aptis-fozevm0y1-beng18.vercel.app`.
- Git source: branch `master`, source commit `04af9beebbb219fbfb3ce04e81e57ac3fc4ef68b`; local HEAD và `origin/master` khớp SHA này trước deployment.
- Version evidence: `GET /api/health` HTTP 200, `buildCommit=04af9beebbb219fbfb3ce04e81e57ac3fc4ef68b`.
- Health: `status=healthy`, `aiProvider=configured`, `database=connected`, `knowledgeBrain=compiled_ready`, `listeningAudio=available`.

### P1 production matrix

| ID | Production evidence | Status |
|---|---|---|
| QA-P1-001 | Login/session cũ sau `POST /api/auth/logout` bị từ chối: `/api/auth/me` và `/api/user/progress` đều HTTP 401. | FIXED |
| QA-P1-002 | Anonymous `POST /api/grade/deterministic` HTTP 401; authenticated request HTTP 200, score `0/5`. | FIXED |
| QA-P1-003 | Authenticated valid Writing Part 1/2/3/4 lần lượt HTTP 200, score `5/5`, `5/5`, `4/5`, `4.5/5`; không có `INVALID_ANSWER_FORMAT`. | FIXED |
| QA-P1-004 | Production API/assets audit 23/23 Speaking Part 3 pairs: image A/B tồn tại HTTP 200, không cùng URL và không có pair lỗi; p3-035 source-limited. | FIXED |
| QA-P1-005 | Fake test ID, negative/over-max/non-number score và malformed JSON đều HTTP 400; valid record HTTP 200. | FIXED |
| QA-FU-P1-001 | Chromium: A xem được result URL của chính A; B mở cùng direct URL nhận “Không tìm thấy bài thi”. | FIXED |
| QA-FU-P1-002 | Production 7/7 four-skills Reading Part 3 có 4 people, `emptyPeople=0`; Chromium render thấy Person A/B. | FIXED |
| QA-FU-P1-003 | Production 7/7 four-skills Reading Part 2: 10/10 answer IDs mỗi bộ tồn tại trong rendered data, `missing=0`. | FIXED |
| QA-FU-P1-004 | Production live Gemini: multi-task 2 task HTTP 200 với 2 task IDs/types và score/criteria/feedback; multi-task 4 task HTTP 200 với 4 unique task IDs; unknown/malformed task HTTP 400; không còn `INVALID_ANSWER_FORMAT`. | FIXED / PRODUCTION VERIFIED |

### P2/P3 production smoke

- P2 remediation đã fixed/verified: 27/28 confirmed P2. Production Chromium/API smoke xác nhận catalog label, invalid-resource error, external redirect fallback, login throttling (`401,401,401,401,429,429`), mobile/nav/overlay/layout, `/settings`, four-skills marker scan, Listening availability/audio và p3-035 fail-closed. Canonical persistence với disclaimer ghi nhận record sau refresh/logout/login và duplicate cùng ID không tạo bản ghi thứ hai.
- P2 blocked/source-limited còn lại: QA-FU-P2-011 (source candidate `gdrive_spk_p2_012` không đủ prompt/image authoritative) và QA-FU-P2-015 (placement-hash authority source inaccessible). Không chuyển các mục này thành FIXED.
- P3: QA-P3-001 và QA-FU-P3-002 được kiểm chứng bằng Chromium; QA-FU-P3-001 là NOT APPLICABLE theo product contract; QA-FU-P3-003 vẫn BLOCKED vì audit artifact lifecycle thiếu authoritative owner/version.
- Chromium production state smoke trước deployment gate đã xác nhận Vocabulary palette, cursor reload, native audio replay limit, mobile nav, no overflow và dialog `role=dialog`, `aria-modal=true`, focus/Escape; deployment mới không làm thay đổi các route này. E2E history fixture cũ gửi thiếu `disclaimer` và bị 400 đúng schema, nên persistence được re-run bằng payload canonical và PASS.

### AI and microphone limitation

- Writing AI Production: Part 1/2/3/4 lần lượt HTTP 200 với score, criteria và feedback; multi-task 2 task HTTP 200 (`tasks=2`, `invalidFormat=false`), multi-task 4 task HTTP 200 (`tasks=4`, `unique=4`, `invalidFormat=false`). Different task IDs/types were resolved by server-owned canonical contexts; no first-task context contamination was observed. Provider failure injection is not externally controllable, while local strict-parser tests cover safe 502 handling.
- Speaking asset/provenance UI: PASS cho fail-closed p3-035 và 23/23 Part 3 asset pairs.
- Real Speaking AI microphone: NOT VERIFIED. Môi trường này không có human/live microphone input; không dùng TTS, synthetic audio hoặc generated speech để tuyên bố PASS.

### Current local remediation — QA-P2-COACH-001

- Hermes/Codex incident: AI Coach provider có thể trả response rỗng hoặc malformed; `getCoachAdvice()` trước đây để lộ parser/provider failure dưới code `INVALID_ANSWER_FORMAT`, khiến route trả HTTP 400 và UI hiển thị lỗi kết nối chung.
- Root cause: provider execution và provider-output parsing không có ranh giới lỗi riêng; không có retry bounded sau response rỗng/malformed; route map mọi `GradingError` thành 400.
- Fix: route dùng `INVALID_REQUEST` cho input client, `502 AI_PROVIDER_ERROR` cho provider/response không dùng được, `504 AI_PROVIDER_TIMEOUT` cho timeout; service dùng canonical Coach model config, tối đa 2 attempts, retry delay bounded, trim/validate output sau mỗi attempt, truyền `AbortSignal`, log request-id/attempt/model an toàn; frontend hiển thị thông báo phân biệt theo taxonomy.
- Evidence local: Coach suite PASS cho normal response, empty→valid, malformed→valid, malformed cả hai lần→provider error, timeout→504 mapping, bounded attempt count và request-id sanitization; typecheck PASS. Production chưa deploy trong task này, nên finding có trạng thái `FIXED LOCALLY / DEPLOYMENT PENDING`.

## Final matrix

Reproduced là kết quả kiểm chứng Hermes baseline; Environment phân biệt production baseline, source và code sau remediation. Trạng thái cuối chỉ dùng ba giá trị được quy định: FIXED, BLOCKED, NOT APPLICABLE.

| ID | Hermes finding | Reproduced | Environment | Current Status | Severity | Evidence / remediation |
|---|---|---|---|---|---|---|
| QA-P1-001 | Logout không revoke bearer token | YES | Production baseline → BOTH | FIXED | P1 | lib/auth/api.ts lưu session, kiểm tra DB expiry/owner và revoke khi logout; auth tests + local smoke PASS. |
| QA-P1-002 | Deterministic grading là answer oracle anonymous | YES | Production baseline → BOTH | FIXED | P1 | Route yêu cầu getAuthenticatedSessionAsync; anonymous deterministic request trả 401 trong regression/smoke. |
| QA-P1-003 | Writing Part 2/3 valid trả INVALID_ANSWER_FORMAT | YES | Production baseline → LOCAL live provider | FIXED | P1 | writing-ai.ts thêm Gemini schema và normalize scores/errorLog/lexicalUpgrades; Part 1–4 live local trả 200 score/feedback. |
| QA-P1-004 | Speaking Part 3 crop lẫn stimulus kế bên | YES | Production baseline → BOTH | FIXED | P1 | Asset audit toàn bank; clip documented edge cho p3-036-b/p3-052-a; duplicate/source-limited pair không còn được render như available. |
| QA-P1-005 | Progress nhận fake test ID/score | YES | Production baseline → BOTH | FIXED | P1 | lib/progress/validation.ts kiểm tra catalog, objective maximum server-owned, type/range/percentage/provenance trước persistence; regression đầy đủ. |
| QA-P2-001 | Catalog Listening/Reading/Grammar bị label Writing | YES | Production baseline → BOTH | FIXED | P2 | Heading/card/count lấy từ selected skill; Chromium smoke đã kiểm tra Listening. |
| QA-P2-002 | Dashboard counters lệch catalog | PARTIAL | BOTH | FIXED | P2 | lib/exam/catalog-summary.ts là single source of truth cho dashboard/catalog; full suite/browser smoke PASS. |
| QA-P2-003 | Invalid resource để spinner vô hạn | YES | Production baseline → BOTH | FIXED | P2 | Practice/mock shell phân biệt loading với error/retry; invalid practice browser smoke hiển thị error hữu ích. |
| QA-P2-004 | Wrong-type body leak PostgreSQL/parser error | YES | Production baseline → BOTH | FIXED | P2 | JSON/schema guard chạy trước DB, API trả safe error; path progress id:7 bị reject trước SQL. |
| QA-P2-005 | Auth redirect nhận URL ngoài | YES | Production baseline → BOTH | FIXED | P2 | lib/auth/redirect.ts chỉ cho same-origin internal target; login/register dùng sanitizer. |
| QA-P2-006 | Failed login không throttling | YES | Production baseline → BOTH | FIXED | P2 | In-memory IP+email guard 5 failures/15 phút, trả 429 + Retry-After; không lock user vĩnh viễn. |
| QA-P2-007 | Tab B stale authenticated sau logout tab A | YES | Production baseline → BOTH | FIXED | P2 | AuthContext đồng bộ logout qua BroadcastChannel và storage event; API vẫn revalidate server-side. |
| QA-P2-008 | Mock confirmation đếm active part | SOURCE-CONFIRMED | BOTH | FIXED | P2 | exam-shell.tsx aggregate toàn bộ part trong section trước khi mở dialog; mock/browser tests PASS. |
| QA-P2-009 | Practice timer hết nhưng không terminal | SOURCE-CONFIRMED | BOTH | FIXED | P2 | Wall-clock deadlineAt là source of truth và expiry wired vào submit; timer/session tests PASS. |
| QA-P2-010 | Active Speaking recording mất khi refresh | SOURCE-CONFIRMED | BOTH | FIXED | P2 | Thêm beforeunload warning khi recorder đang active; completed audio vẫn theo Stop flow. Không dùng synthetic audio để giả lập recovery. |
| QA-P2-011 | Cross-user progress collision bị acknowledge rồi drop | PARTIAL | BOTH | FIXED | P2 | saveAttempt trả false khi owner khác; API trả 409 thay vì syncedCount=1; security/progress tests PASS. |
| QA-P2-012 | Auth/Writing/Reading thiếu programmatic label | YES | BOTH | FIXED | P2 | Auth fields, Writing textarea, Reading/audio/recorder controls có label/id/aria name; accessibility suite PASS. |
| QA-P2-013 | /settings 404 | YES | Production baseline → BOTH | FIXED | P2 | Thêm app/settings/page.tsx và sidebar/top-bar links; browser smoke thấy heading Cài đặt. |
| QA-P2-014 | Lexi floating CTA che dashboard | YES | BOTH | FIXED | P2 | Responsive offset/max-width/z-index được chỉnh; 390px browser smoke không overflow. |
| QA-P3-001 | Home và History cùng active | SOURCE-CONFIRMED | BOTH | FIXED | P3 | Sidebar kiểm tra hash #history; browser assertion xác nhận overview chỉ active Home. |
| QA-FU-P1-001 | User B đọc result User A | YES | Production baseline → BOTH | FIXED | P1 | Result page kiểm tra auth + exact sessionId/submitted/userId; completed mock key scoped theo user. |
| QA-FU-P1-002 | 7 four-skills Reading P3 Person A/B rỗng | SOURCE-CONFIRMED | BOTH | FIXED | P1 | Khôi phục exact source-derived A/B text trong 7 datasets; mapping/parser/render matrix và ingestion tests PASS. |
| QA-FU-P1-003 | 14 four-skills Reading P2 answer IDs không render | SOURCE-CONFIRMED | BOTH | FIXED | P1 | Reconcile public sentence IDs với answer keys; 7/7 matrix hiện 0 invalid answer-key ID, không xóa key. |
| QA-FU-P1-004 | Writing multi-task dùng context task đầu tiên / INVALID_ANSWER_FORMAT | SOURCE-CONFIRMED | PRODUCTION baseline → PRODUCTION remediation | FIXED | P1 | Production live Gemini trả HTTP 200 cho batch 2 task và 4 task; result có task IDs/types/score/criteria/feedback, không duplicate/missing và không `INVALID_ANSWER_FORMAT`. Unknown/malformed task bị 400. Canonical server-side context binding và strict batch parser đã được chứng minh thêm bằng local regression suite. |
| QA-FU-P2-001 | Listening available dù audio nested missing/uncertain | SOURCE-CONFIRMED | BOTH | FIXED | P2 | Validator kiểm tra nested resources; dataset incomplete/uncertain fail-closed, không quảng cáo audio thiếu là available. |
| QA-FU-P2-002 | Native Listening không enforce replay limit | SOURCE-CONFIRMED | BOTH | FIXED | P2 | LimitedAudio lưu count theo audio/session và disable sau 2 plays, thay vì tin native controls. |
| QA-FU-P2-003 | Mock timer callback tick kéo dài thời gian | SOURCE-CONFIRMED | BOTH | FIXED | P2 | ExamTimer tính từ deadlineAt persisted; throttled callback không thể gia hạn session. |
| QA-FU-P2-004 | Vocabulary palette vẫn 0/5 | PARTIAL | BOTH | FIXED | P2 | Answered state đã bao gồm Vocabulary và persistence; practice/session tests PASS. |
| QA-FU-P2-005 | Cursor reload quay về Q1 | PARTIAL | BOTH | FIXED | P2 | Persist/restore currentQuestionId/currentIndex khi session match đúng route/test/part. |
| QA-FU-P2-006 | Mock hub tạo global anonymous session key | SOURCE-CONFIRMED | BOTH | FIXED | P2 | Authenticated hub truyền user.id vào load/create; global fallback chỉ còn cho explicit anonymous flow. |
| QA-FU-P2-007 | Speaking p3-035 Image A/B byte-identical | YES | Production baseline → BOTH | FIXED | P2 | p3-035 chuyển source-limited, bỏ image fields invalid và render IMAGE SOURCE UNAVAILABLE; không random replacement. |
| QA-FU-P2-008 | Reading Part 2 duplicate anchor | YES | BOTH | FIXED | P2 | Audit/sửa toàn bộ 16 standard datasets; 32 stories scan hiện 0 duplicate anchor, answer mapping đã reconcile. |
| QA-FU-P2-009 | Four-skills Reading còn PDF answer-position marker | YES | BOTH | FIXED | P2 | Loại marker ở learner-facing data; provenance/audit giữ tách biệt; scan 7 datasets = 0. |
| QA-FU-P2-010 | User-provided bundle bị gọi edulife | YES | BOTH | FIXED | P2 | Metadata chuyển sourceType=user-provided, giữ isOfficialBritishCouncil=false và source provenance. |
| QA-FU-P2-011 | Speaking Part 2 bỏ sót 2 source candidates | YES | BOTH | BLOCKED | P2 | Khôi phục được gdrive_spk_p2_009; gdrive_spk_p2_012 không có prompt/image recoverable. Đã ghi unresolved ledger; không bịa để đánh dấu fixed. |
| QA-FU-P2-012 | Speaking raw/placeholder-like title | YES | BOTH | FIXED | P2 | lib/speaking/topic-title.ts tạo learner title ổn định; raw source giữ trong provenance. |
| QA-FU-P2-013 | Reconstructed assignment không ghi reconstructed | YES | BOTH | FIXED | P2 | Mapping ghi RECONSTRUCTED_SOURCE_BACKED_NOT_HISTORICAL; UI không còn ngụ ý historical recovery. |
| QA-FU-P2-014 | Docs nói toàn bộ content synthetic | YES | BOTH | FIXED | P2 | Cập nhật UX reference/data architecture để phân biệt mixed provenance, source-derived và fail-closed. |
| QA-FU-P2-015 | Placement-hash mismatch vẫn available | SOURCE-CONFIRMED | SOURCE ONLY | BLOCKED | P2 provenance risk | Google Docs authoritative source inaccessible; mismatch có evidence nhưng không đủ authority để đoán placement đúng. |
| QA-P2-COACH-001 | AI Coach provider failure bị phân loại thành INVALID_ANSWER_FORMAT | YES | Production baseline → LOCAL remediation; deployment pending | FIXED (LOCAL) | P2 | Baseline browser/API đã tái hiện 400 không ổn định; advisor hiện retry/validate bounded, route phân biệt 400/502/504, frontend phân biệt thông báo; Coach regression PASS. Chưa tuyên bố Production-fixed trước deployment. |
| QA-FU-P3-001 | Mobile bottom-nav component không mount | YES | BOTH | NOT APPLICABLE | N/A | Mobile hamburger/sidebar là product contract đang mount và hoạt động; không có bằng chứng bottom nav là yêu cầu bắt buộc. |
| QA-FU-P3-002 | Mock submit dialog thiếu semantics/focus | SOURCE-CONFIRMED | BOTH | FIXED | P3 | Dialog có role/aria-modal/label, Escape, focus containment và restore; browser/accessibility tests PASS. |
| QA-FU-P3-003 | Audit artifacts mapping thiếu supersession metadata | YES | SOURCE ONLY | BLOCKED | P3 audit hygiene risk | Runtime mapping đã có status mới, nhưng crosswalk/graph lịch sử thiếu authoritative lifecycle/version owner; không thể sửa bằng phỏng đoán. |

## Phân loại cuối

### CONFIRMED P0:

Không có.

### CONFIRMED P1:

Đã sửa và verify trên Production 9/9: QA-P1-001, QA-P1-002, QA-P1-003, QA-P1-004, QA-P1-005, QA-FU-P1-001, QA-FU-P1-002, QA-FU-P1-003, QA-FU-P1-004. QA-FU-P1-004 được chứng minh bằng production live Gemini batch 2-task/4-task, score/feedback/task identity, fail-closed unknown/malformed input; đồng thời batch contract, context-isolation, typecheck, build, full suite và clean-clone suite đều PASS.

### CONFIRMED P2:

Đã sửa 27/28: QA-P2-001 đến QA-P2-014, QA-FU-P2-001 đến QA-FU-P2-010, QA-FU-P2-012, QA-FU-P2-013, QA-FU-P2-014.

Blocked: QA-FU-P2-011 vì source candidate gdrive_spk_p2_012 không có dữ liệu đủ để phục hồi trung thực.

QA-FU-P2-015 là source limitation bổ sung, không được tính vào 28 confirmed P2.

QA-P2-COACH-001 đã FIXED ở local và sẵn sàng cho deployment; chưa được cộng vào số P2 Production-fixed của deployment `4qUnmxrrb9o6cmy9n5Xdee1oJFcP`.

### CONFIRMED P3:

Đã sửa 2/2: QA-P3-001, QA-FU-P3-002.

### FIXED / NO LONGER REPRODUCIBLE:

Các finding confirmed có thể sửa an toàn và đã pass: 9 P1, 27 P2 và 2 P3. 9/9 P1 đã được kiểm chứng lại trên Production deployment `4qUnmxrrb9o6cmy9n5Xdee1oJFcP`.

### FALSE POSITIVE:

Không có.

### SOURCE LIMITATION:

- QA-FU-P2-015: placement-hash/source authority bị giới hạn bởi Google Docs inaccessible.
- QA-FU-P3-003: audit crosswalk/provenance artifact không có authoritative supersession/version owner.

### BLOCKED:

- QA-FU-P2-011: cần source owner cung cấp prompt/image gốc của gdrive_spk_p2_012; không được tự fabricated.
- QA-FU-P2-015: cần authoritative placement source.
- QA-FU-P3-003: cần quyết định artifact authoritative và lifecycle metadata từ source owner.

### NOT APPLICABLE:

- QA-FU-P3-001: bottom MobileNav không thuộc product contract hiện tại; mounted mobile hamburger/sidebar đã được kiểm tra.

## Production gate — final result

Production deployment `4qUnmxrrb9o6cmy9n5Xdee1oJFcP` ở trạng thái READY và alias `https://web-aptis.vercel.app` trả `buildCommit=04af9beebbb219fbfb3ce04e81e57ac3fc4ef68b`. Health HTTP 200: `healthy`, AI provider configured, database connected, knowledge brain ready và listening audio available. Writing live Gemini multi-task 2/4 task PASS; security critical checks PASS; không phát hiện P1 regression. QA-P2-COACH-001 mới chỉ có local remediation evidence và đang chờ deployment/post-deploy verification.

P2 đã verify 27/28; P2 blocked/source-limited còn `QA-FU-P2-011` và `QA-FU-P2-015`. P3 runtime đã verify 2/2; `QA-FU-P3-003` vẫn là audit-source limitation và `QA-FU-P3-001` NOT APPLICABLE theo product contract. Real human Speaking microphone không có bằng chứng nên giữ NOT VERIFIED; không dùng TTS/synthetic audio. Verdict cuối: **PRODUCTION VERIFIED — NON-BLOCKING SOURCE LIMITATIONS REMAIN**.
