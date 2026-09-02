# Codex — Hermes QA Remediation Verification

## INDEPENDENT QA REMEDIATION VERIFICATION — LOCAL FIXES COMPLETE; PRODUCTION DEPLOYMENT BLOCKED

Đây là báo cáo sau remediation, không phải bản sao kết luận cũ của Hermes. Tôi đã đọc report Hermes, tái hiện các finding quan trọng trên production build cũ, tìm root cause ở code/data, sửa các finding có thể sửa an toàn và chạy regression local. Commit đã push lên master, nhưng production vẫn đang ở build baseline 14d688b3dbf0cf4f5c1bd8907e338bf46ca1fe6a vì Vercel CLI không có credentials và GitHub push chưa kích hoạt deployment.

Kết quả hiện tại:

- P1: 9/9 đã sửa và có bằng chứng local.
- P2 confirmed: 27/28 đã sửa; 1 blocked vì source candidate không có prompt/image có thể phục hồi mà không bịa dữ liệu.
- P3 confirmed: 2/2 đã sửa.
- 2 source limitations vẫn blocked: placement-hash authority và lifecycle của audit artifacts.
- 1 finding là design/expected, được đánh dấu NOT APPLICABLE.
- Không có P0 và không có false positive.

## Phạm vi và phương pháp

- Đã đọc project/docs/hermes-full-qa-report.md và project/data/audits/hermes-full-qa-report.json.
- Đã đối chiếu 20 finding ban đầu + 22 follow-up, ưu tiên security/auth, data integrity, exam correctness, AI grading, persistence/timer và UI/accessibility.
- Đã tái hiện production baseline bằng browser/API/source probes; sau đó kiểm chứng code/data đã sửa bằng test, production build local, API smoke và Chromium browser smoke.
- Với source-derived content, chỉ dùng text/mapping/hash có evidence; không thêm placeholder, không random hóa, không xóa answer key để làm test pass.
- Speaking AI real microphone chưa được tuyên bố PASS: campaign này không có human/live microphone evidence và không dùng TTS/synthetic audio.

## Validation evidence

- npm test: 44/44 master red-team suites PASS.
- npm run typecheck: PASS.
- npm run build: PASS. Còn một warning không blocking của Next.js về convention middleware deprecated.
- npm run smoke-test: PASS trên local production build (next start), gồm auth, protected routes, public test API và anonymous grading denial.
- npx playwright test e2e/remediation-browser.spec.ts --project=chromium: 1 passed; mobile navigation, no horizontal overflow, skill labels, settings, invalid-resource error và dialog semantics đã được kiểm tra.
- Content matrix: 7/7 four-skills Reading có Person A/B/C/D non-empty, 0 answer-key ID không render, 0 PDF position marker; standard Reading Part 2 scan còn 0 duplicate anchor.
- Speaking bank: Part 1=31, Part 2=34, Part 3=39, Part 4=29; p3-035 source-limited và fail-closed.
- Writing live local provider: Parts 1–4 đều trả 200 có score/criteria; multi-task Part 4 trả taskResults tách theo đúng task context.

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
| QA-FU-P1-004 | Writing multi-task dùng context task đầu tiên | SOURCE-CONFIRMED | BOTH | FIXED | P1 | Route resolve từng entry theo taskId và trả taskResults; live multi-task Part 4 tách informal/formal context đúng. |
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
| QA-FU-P3-001 | Mobile bottom-nav component không mount | YES | BOTH | NOT APPLICABLE | N/A | Mobile hamburger/sidebar là product contract đang mount và hoạt động; không có bằng chứng bottom nav là yêu cầu bắt buộc. |
| QA-FU-P3-002 | Mock submit dialog thiếu semantics/focus | SOURCE-CONFIRMED | BOTH | FIXED | P3 | Dialog có role/aria-modal/label, Escape, focus containment và restore; browser/accessibility tests PASS. |
| QA-FU-P3-003 | Audit artifacts mapping thiếu supersession metadata | YES | SOURCE ONLY | BLOCKED | P3 audit hygiene risk | Runtime mapping đã có status mới, nhưng crosswalk/graph lịch sử thiếu authoritative lifecycle/version owner; không thể sửa bằng phỏng đoán. |

## Phân loại cuối

### CONFIRMED P0:

Không có.

### CONFIRMED P1:

Đã sửa 9/9: QA-P1-001, QA-P1-002, QA-P1-003, QA-P1-004, QA-P1-005, QA-FU-P1-001, QA-FU-P1-002, QA-FU-P1-003, QA-FU-P1-004.

### CONFIRMED P2:

Đã sửa 27/28: QA-P2-001 đến QA-P2-014, QA-FU-P2-001 đến QA-FU-P2-010, QA-FU-P2-012, QA-FU-P2-013, QA-FU-P2-014.

Blocked: QA-FU-P2-011 vì source candidate gdrive_spk_p2_012 không có dữ liệu đủ để phục hồi trung thực.

QA-FU-P2-015 là source limitation bổ sung, không được tính vào 28 confirmed P2.

### CONFIRMED P3:

Đã sửa 2/2: QA-P3-001, QA-FU-P3-002.

### FIXED / NO LONGER REPRODUCIBLE:

Tất cả finding confirmed có thể sửa an toàn đều ở trạng thái FIXED: 9 P1, 27 P2 và 2 P3.

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

## Production gate

Local remediation và local verification đã hoàn tất. Commit 85e0379 đã push thành công. Production deployment và post-deploy smoke đang BLOCKED vì Vercel trả No existing credentials found / Logged out; production health vẫn xác nhận build baseline. Cần một operator đã đăng nhập Vercel deploy commit này rồi chạy smoke cho auth revocation, cross-user result ownership, progress rejection, Writing Parts 1–4 và Reading four-skills matrix. Real human microphone evidence vẫn là một giới hạn riêng, không được thay bằng TTS.
