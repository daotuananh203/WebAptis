# BÁO CÁO CODEX REVIEW

Ngày kiểm tra: 2026-08-27
Phạm vi: độc lập audit Listening, source/XML, master audio, local runtime, Chromium production, scoring và các finding kiến trúc/security liên quan.

## Tổng quan

Listening hiện có 15 master audio nội bộ (Tests 01–15). Test 16 không có master audio trong `APTIS/Listening/.../03. Audio`; không có thể xác minh hoặc tự tạo audio thiếu. Sau khi áp dụng Audio Segmentation Contract:

- 59/64 Listening parts đạt `VERIFIED` ở cấp part.
- 5/64 `UNCERTAIN`: Test 03 Part 1 và toàn bộ Test 16.
- 194/195 câu Part 1 có master/source evidence hợp lệ; Test 03 Q13 còn thiếu phần kết trong master.
- 329 generated assets có transcript evidence; 1 block source/master conflict còn fail-closed.
- Không tuyên bố toàn bộ Listening production-ready.

## Findings theo severity

### HIGH — LISTENING-001 — Source/master coverage chưa đủ cho 5 parts

- **File/vị trí:** `project/data/listening-forensics/listening-audit-matrix.json`; `APTIS/Listening/.../Đề 3.mp3`; thiếu `APTIS/Listening/.../03. Audio/Đề 16.mp3`.
- **Vấn đề:** Test 03 Q13 source DOCX kết thúc bằng `Boring? Come on! Books can be exciting too! ... films are more entertaining for me!`, nhưng master alignment hiện chỉ chứng minh tới `Oh, that's because you are boring`. Test 16 không có master audio/artifact source tương ứng.
- **Impact:** Không thể chứng minh full task content, ending coverage hoặc production playback cho các part này.
- **Evidence:** Audit matrix `59 VERIFIED / 0 MISMATCH / 5 UNCERTAIN`; `listening-contract-audit.json` ghi ending coverage T03 Q13 `0.2143`; Test 16 không có file audio trong source tree và không có Git history/LFS asset.
- **Recommendation:** Bổ sung master audio gốc và xác minh lại bằng source transcript + ordered alignment; không dùng TTS/audio bên thứ ba để lấp gap.
- **Trạng thái:** CHƯA FIX; runtime fail-closed.

### HIGH — SECURITY-001 — AI grading/coach routes chưa tự xác thực session

- **File/vị trí:** `project/app/api/grade/writing/route.ts:8-43`, `project/app/api/grade/speaking/route.ts:8-45`, `project/app/api/coach/chat/route.ts:6-49`.
- **Vấn đề:** Route parse payload nhưng không gọi verifier session trước khi chạy AI. Writing/Speaking truyền `userId` từ request vào flow memory/grading.
- **Impact:** Có thể lạm dụng quota/cost; nếu downstream ghi memory theo ID client, có nguy cơ cross-user pollution.
- **Evidence:** Code route gọi `gradeWritingSubmission(..., parseResult.data.userId)`, `gradeSpeakingSubmission(..., parseResult.data.userId)` và `getCoachAdvice(parseResult.data)` mà không có auth guard.
- **Recommendation:** Lấy user ID từ signed session cookie ở server; từ chối anonymous AI requests; thêm rate limit theo user/IP.
- **Trạng thái:** CHƯA FIX trong scope audio.

### MEDIUM — SECURITY-002 — Middleware chấp nhận session payload chưa verify HMAC

- **File/vị trí:** `project/middleware.ts:14-34`.
- **Vấn đề:** Middleware decode hai phần token và kiểm tra `userId/expiresAt`, nhưng không verify chữ ký.
- **Impact:** Page protected có thể bị bypass ở lớp middleware dù API có thể từ chối token giả; authorization boundary không nhất quán.
- **Recommendation:** Dùng verifier HMAC edge-safe thống nhất hoặc bỏ page decision dựa trên payload chưa ký.
- **Trạng thái:** CHƯA FIX.

### MEDIUM — LISTENING-002 — Legacy segmentation có thể đồng nhất opening/answer fragment với task

- **File/vị trí:** `scripts/listening_contract_audit.py:1098-1130`; dữ liệu T06 Q7 cũ.
- **Vấn đề:** Fixed word-neighborhood khử hai opening gần nhau mà không xét source block có repeated opening nội bộ. T06 Q7 bị chọn opening thứ hai ở khoảng `269.34s`; Q6 nuốt phần opening/t-shirt ở `256.54–268.27s`.
- **Impact:** Audio thiếu opening và lượt thoại nhưng vẫn có answer-bearing speech; đây chính là bug content đã được người dùng nghe thấy.
- **Evidence:** Source XML T06 Q7 chứa hai opening; master có đoạn đầu và đoạn sau; transcript candidate mới phủ `256.54–290.99s`.
- **Recommendation:** Đã sửa thuật toán nhận biết source-internal repeated opening, giữ earliest aligned opening, và thêm regression test.
- **Trạng thái:** ĐÃ FIX, production đã deploy.

### LOW — MAINT-001 — Next.js middleware convention deprecated

- **File/vị trí:** `project/middleware.ts`.
- **Evidence:** `npm run build` cảnh báo chuyển sang `proxy` convention.
- **Impact:** Không làm sai audio hiện tại nhưng tạo maintenance debt.
- **Recommendation:** Migration riêng, không gộp vào forensic audio fix.
- **Trạng thái:** CHƯA FIX.

### INFO — APTIS-001 — Official facts và project design phải tách biệt

- **Official fact:** British Council mô tả Aptis Listening General theo các part/task và cho biết recording có thể được nghe tối đa hai lần: [British Council Prepare for Aptis ESOL General](https://www.britishcouncil.org/exam/english/aptis/prepare-general), [Aptis ESOL General Guide for Teachers](https://www.britishcouncil.org/sites/default/files/aptis_esol_general_guide_for_teachers_2023.pdf).
- **Project design:** Corpus Edulife nội bộ dùng 13 Part 1 task, segment MP3 riêng và contract evidence riêng. Đây không phải official CEFR conversion hay official British Council score mapping.

## Root Cause

Root cause đã chứng minh cho T06 Q7 là **boundary detection/occurrence grouping**, không phải deployment, API hay UI mapping. Pipeline cũ khử repeated opening theo khoảng cách ASR cố định; nó không hiểu repeated opening là một phần của source-defined conversation block. Vì vậy đoạn chứa đáp án vẫn “đúng” về từ khóa nhưng không đầy đủ về recording.

T03 Q13 là **source/master coverage conflict** chưa thể sửa an toàn. Test 16 là **missing source/master artifact**. Không có bằng chứng cho UI mismatch ở các asset đã verify.

## Q1 Evidence — Test 01 Part 1 Q1

- Source transcript: `project/data/listening-forensics/segment-transcripts/aptis-b2-01/p1-q01.json` và DOCX transcript tương ứng.
- Master source: `APTIS/Listening/.../03. Audio/Đề 1.mp3`.
- Local `q01.mp3`: contract-generated, 2 ordered renditions, duration khoảng 45.53s; transcript có đầy đủ `3,250 pounds`, replay thứ hai và không có Q2.
- Production browser `currentSrc`: `https://web-aptis.vercel.app/audio/listening/segments/aptis-b2-01/part-1/q01.mp3?v=dc362d453b57827b`.
- Production response trước bản T06: 206 Range `0-495151/495152`, SHA `dc362d453b57827b5a6bc626a9f074552c5a979fa15e20096a0cca0763221e0c`, duration decoded khoảng 45.531s.
- Kết luận riêng Q1: `Q1 VERIFIED`.

## T06 Q7 Evidence — regression đã sửa

Source Q7 trong DOCX:

```text
Hey, Sarah, let's check out this store. I need something for work.
Sarah: Sure, John. How about this t-shirt? It looks nice.
John: Hey, Sarah, let's check out this store. I need something for work.
Sarah: Oh, okay. What about this hat? It would look great on you.
John: Haha, maybe, but not today. I really need a suit for the office.
Sarah: Look, this one seems perfect. That's a good choice. It's smart and looks comfortable.
Joh: Great, I'll buy the suit. Let's keep looking for other things we might need.
```

Local corrected block: `256.54–291.99s` (master speech `256.54–290.99s`), duration `35.500408s`, SHA `8ba0be0bbd5413b41f3e7685e0c1591086dbe7613218f7fc6472c633c20899ab`.

Transcript coverage: opening, t-shirt exchange, repeated opening, hat, suit, final `Let's keep looking...`. No Q8 opening. Q6 ends at `256.54`; Q8 starts at `294.14` clip boundary / `295.14` speech. Regression: `project/tests/listening-part1-t06-q7-regression.test.ts`.

An external Studocu page and a public Drive file were used only as corroboration that the t-shirt opening is semantically expected; they were not copied into the project or treated as source-of-truth. The project DOCX + project master remain authoritative.

## Production Verification

- GitHub commit: `733acee63b93bc59ef1b365daab35c6394975a34`.
- Vercel deployment: `6121221244`, Production, success, matching commit above.
- Browser context: clean Chromium context with newly registered test user and service workers blocked.
- T06 Q7 `audio.currentSrc`: `https://web-aptis.vercel.app/audio/listening/segments/aptis-b2-06/part-1/q07.mp3?v=8ba0be0bbd5413b4`.
- Click Play network: one `GET` request, `Range: bytes=0-`, response `206`, `Content-Range: bytes 0-391635/391636`, `Content-Length: 391636`, `Content-Type: audio/mpeg`.
- Browser response bytes SHA-256: `8ba0be0bbd5413b41f3e7685e0c1591086dbe7613218f7fc6472c633c20899ab`.
- Browser duration: `35.45s` (MP3 decoded duration `35.500408s`).
- Browser transcript: full T06 Q7 block; no Q8.
- Scoring request: `partIdentifier=part1`, `t06_l1_q07 = suit for the office`; UI result `1 / 13` for the single selected answer.
- Cache policy observed: `public, max-age=0, must-revalidate`; URL also carries content hash version.

## Test verdict

PASS:

- `npm test` — all master suites pass, including new T06 Q7 regression.
- `npm run typecheck` — pass.
- `npm run build` — pass; only existing middleware deprecation warning.
- `npx playwright test e2e/listening-content-integrity.spec.ts --project=chromium --reporter=line` — `17 passed`.
- Source/master contract audit — `59 VERIFIED` parts, `0 MISMATCH`, `5 UNCERTAIN`.
- T06 Q7 local and production exact-byte/transcript/browser/scoring verification — pass.

PASS không đồng nghĩa toàn bộ Listening pass: các test kỹ thuật không thể tự chứng minh content của source/master bị thiếu.

## E2E/browser verification matrix

| Test | Part 1 | Part 2 | Part 3 | Part 4 |
|---|---|---|---|---|
| 01 | VERIFIED | VERIFIED | VERIFIED | VERIFIED |
| 02 | VERIFIED | VERIFIED | VERIFIED | VERIFIED |
| 03 | UNCERTAIN (Q13) | VERIFIED | VERIFIED | VERIFIED |
| 04 | VERIFIED | VERIFIED | VERIFIED | VERIFIED |
| 05 | VERIFIED | VERIFIED | VERIFIED | VERIFIED |
| 06 | VERIFIED | VERIFIED | VERIFIED | VERIFIED |
| 07 | VERIFIED | VERIFIED | VERIFIED | VERIFIED |
| 08 | VERIFIED | VERIFIED | VERIFIED | VERIFIED |
| 09 | VERIFIED | VERIFIED | VERIFIED | VERIFIED |
| 10 | VERIFIED | VERIFIED | VERIFIED | VERIFIED |
| 11 | VERIFIED | VERIFIED | VERIFIED | VERIFIED |
| 12 | VERIFIED | VERIFIED | VERIFIED | VERIFIED |
| 13 | VERIFIED | VERIFIED | VERIFIED | VERIFIED |
| 14 | VERIFIED | VERIFIED | VERIFIED | VERIFIED |
| 15 | VERIFIED | VERIFIED | VERIFIED | VERIFIED |
| 16 | UNCERTAIN (missing audio) | UNCERTAIN | UNCERTAIN | UNCERTAIN |

## Bugs đã sửa

- Sửa source-internal repeated-opening grouping trong `scripts/listening_contract_audit.py`.
- Recut T06 Q6 để không nuốt opening của Q7.
- Tạo T06 Q7 asset đầy đủ và transcript evidence.
- Cập nhật T06 runtime metadata/hash/cache version.
- Thêm strict T06 Q7 regression vào master test runner.
- Giữ fail-closed cho T03 Q13/Test 16.

## Architecture verdict

Audio segmentation architecture hiện đúng hướng: source transcript/structure là authority, master audio là evidence, Whisper chỉ alignment, asset chỉ được runtime dùng khi transcript contract pass. Tuy nhiên source coverage chưa đủ cho 64/64 và một số security boundary còn tồn tại.

**Verdict: PARTIALLY ACCEPTED — chưa đủ để gọi full production-ready.**

## Security verdict

Static public dataset không leak answer key/API key theo tests; audio API/cache headers hiện phù hợp hơn với việc cập nhật asset. Nhưng HIGH auth findings ở AI grading/Coach và MEDIUM middleware signature vẫn chưa được xử lý.

**Verdict: NOT CLEARED.**

## Aptis correctness verdict

Đã phân biệt official facts với project design; không tự suy ra official CEFR conversion. Mapping/answer/scoring của T06 Q7 và Q1 T01 khớp source project. Toàn bộ 64 parts chưa thể xác minh do thiếu source/master.

**Verdict: PARTIAL; không phải official Aptis certification score validation.**

## AI verdict

Whisper không quyết định boundary một mình; structured transcript evidence và fail-closed runtime được dùng cho audio. Writing/Speaking/Coach tests và injection suites pass, nhưng AI route auth/rate-limit chưa được cleared.

**Verdict: FUNCTIONALLY TESTED, SECURITY NOT CLEARED.**

## Production-readiness verdict

`LISTENING NOT FULLY VERIFIED`.

Không được tuyên bố `LISTENING FULLY VERIFIED` hoặc `production-ready`: còn 5/64 parts `UNCERTAIN`, trong đó Test 16 thiếu toàn bộ master audio và T03 Q13 thiếu ending evidence; security HIGH findings cũng còn mở.

## Files thay đổi trong commit 733acee

- `scripts/listening_contract_audit.py`
- `project/data/listening-forensics/listening-audio-manifest.json`
- `project/data/listening-forensics/listening-audit-matrix.json`
- T06 Q6/Q7 transcript evidence, runtime dataset và MP3 assets
- Listening regression tests và `project/tests/run-all-tests.ts`

Các file user-memory/QA dirty khác được giữ nguyên, không đưa vào commit audio.

## Một bước tiếp theo duy nhất

Bổ sung source master audio gốc cho Test 16 và source/master recording đầy đủ cho Test 03 Q13; sau đó chạy lại đúng contract từ source XML → master alignment → transcript validation → clean-browser production verification.

## Verdict

```text
LISTENING NOT FULLY VERIFIED
```

---

# FINAL PRODUCTION USER AUDIT — ADDENDUM

Ngày audit cuối: 2026-08-27. Addendum này supersede trạng thái security cũ ở trên; các kết luận về Listening chưa đủ source/master vẫn giữ nguyên.

## Production / repository state

- Production: https://web-aptis.vercel.app
- GitHub `master`: `1a865668a87693f12b12a9a66db9bb3f7dd1c0a4` (`fix(security): enforce authenticated AI grading and session integrity`). GitHub đã nhận commit.
- Sau khi GitHub nhận commit, production đã phản ánh behavior mới: unauthenticated `POST /api/coach/chat`, `/api/grade/writing`, `/api/grade/speaking` đều trả `401 Authentication required`. Vercel deployment ID/commit metadata không được expose bởi public app và Vercel CLI không có credential trong môi trường audit, nên không ghi invent một deployment ID; behavioral evidence xác nhận code mới đang live.
- Chrome plugin/Chrome DevTools connector không callable trong môi trường này; đã dùng clean Playwright Chromium context với service workers bị block để tái hiện browser UI, request và response body. Đây là giới hạn verification cần ghi nhận, không phải bằng chứng PASS cho Chrome GUI.

## Finding mới — P1 SPEAKING-IMAGE-001

- **File/vị trí:** `project/data/tests/aptis-b2-01-public.json` … `aptis-b2-16-public.json`; các `imageUrl`, `image1Url`, `image2Url` dưới `/images/speaking/test_XX_*.jpg`.
- **Vấn đề:** Browser production đã đăng nhập bằng một user audit và mở cả 32 trang Speaking Part 2/3 của 16 test. UI phát sinh 48 image requests; 46 response rõ ràng là HTTP 404, 2 response không thu được status event nhưng cũng không render; tất cả 48 `<img>` có `naturalWidth=0`, kèm console 404 errors.
- **Impact:** Người học không nhìn thấy ảnh Speaking Part 2/3; Part 2/3 prompt không thể thực hiện theo task. Đây là lỗi user-facing correctness nghiêm trọng, độc lập với việc local speaking bank có 81 file ảnh render được.
- **Evidence:** `project/reports/final-production-speaking-audit.json`; production URL mẫu `https://web-aptis.vercel.app/images/speaking/test_01_part2.jpg` trả 404; candidate source URL `https://web-aptis.vercel.app/images/speaking/gdrive/part_2_C%C3%B4_g%C3%A1i_tr%C3%AAn_boong_thuy%E1%BB%81n_1_058a5a03.jpg` render 800×534, nhưng không có authoritative mapping từ candidate này tới `aptis-b2-01`.
- **Root cause:** Dataset standard `aptis-b2-*` trỏ tới tên asset `test_XX_*` không tồn tại trong `project/public/images/speaking/`; ảnh source bank nằm ở namespace `gdrive/` và thuộc candidate IDs khác. Đây là data/asset mapping + deployment asset gap, không phải CSS hay browser cache.
- **Recommendation:** Bổ sung mapping nguồn authoritative cho từng standard test/task rồi cập nhật dataset và asset path; không tự gán bank image theo thứ tự hoặc dùng placeholder. Sau đó chạy lại image inventory bằng browser sạch.
- **Trạng thái:** CHƯA FIX; production `MISMATCH`.

## Security re-audit

### Findings đã sửa trong code nhưng chưa chứng minh live production

- AI Coach, Writing grading và Speaking grading hiện gọi `getAuthenticatedSession()` và lấy `userId` từ signed cookie, không tin `userId` trong body.
- Middleware hiện verify HMAC-SHA256 bằng Web Crypto trước khi cho qua protected pages; token sửa payload với signature cũ bị từ chối.
- Production secret mặc định đã bị loại bỏ: production thiếu `AUTH_SECRET`/`SESSION_SECRET` sẽ fail closed.
- AI route 500 errors đã được sanitize; không trả raw provider/internal error message.
- PostgreSQL progress upsert có owner predicate `WHERE progress_attempts.user_id = EXCLUDED.user_id`, chặn reuse attempt ID để overwrite attempt của user khác.

### Evidence local

- `npm test`: 41/41 pass, gồm API session guard/tampered cookie và progress owner predicate regression.
- `npm run typecheck`: pass.
- `npm run build`: pass; chỉ còn warning middleware convention deprecated.
- Local `next start` với explicit audit-only `AUTH_SECRET`: unauth Coach 401, protected `/dashboard` redirect `/login`, valid session `/api/auth/me` 200.

### Production status

Production đã phản ánh guard/HMAC behavior của commit `1a865668`:

| Security scenario | Local code | Production |
|---|---:|---:|
| Unauthenticated AI endpoints | PASS | PASS — 401 on all 3 AI routes |
| Protected page route | PASS | PASS — tampered session redirected to `/login` |
| Session HMAC verification | PASS | PASS — valid `/api/auth/me` 200, forged payload 401 |
| Tampered cookie | PASS | PASS — signature reuse rejected |
| User isolation / IDOR upsert | PASS by code/test | PASS by owner predicate; live DB mutation not directly inspected |
| Secret exposure | No default production secret | PASS by code; secret value not exposed |

## Final master matrix

| Area | Scenario | Expected | Actual | Severity | Status |
|---|---|---|---|---|---|
| Security | AI routes unauthenticated | 401 | Production returns 401 on Coach/Writing/Speaking | P1 | PASS |
| Security | HMAC/tampered cookie | Reject | Production `/api/auth/me` returns 401 and protected page redirects | P1 | PASS |
| Security | Progress cross-user upsert | No overwrite | Owner predicate added and tested locally | P1 | LOCAL PASS / PROD UNCERTAIN |
| Speaking Part 1 | Prompt/count/timer data | Correct | Dataset/schema tests pass; browser technical smoke pass | P2 | PASS (not full manual semantic audit) |
| Speaking Part 2 | Image visible and task-matched | 200/rendered/correct | 16/16 pages: 16 image URLs 404, 0 rendered | P1 | FAIL |
| Speaking Part 3 | Both images visible/order/match | 200/rendered/correct | 16/16 pages: 32 image URLs non-rendered; 30 explicit 404 + 2 status unresolved | P1 | FAIL |
| Speaking Part 4 | Prompt/timer/recording UI | Correct | Dataset and unit/runtime tests pass | P2 | WARN |
| AI Speaking | Task context/rubric | Correct user recording/task | Local mock/red-team pass; live AI not re-invoked after auth deploy | P1 | UNCERTAIN |
| Writing | Parts 1–4/context | Correct | Unit, schema and source tests pass; full live quality matrix not independently verified | P2 | WARN |
| Listening | T01 Q1/T06 Q7 regression | Full source block | Browser/source/hash/transcript evidence pass | P1 | PASS for representatives |
| Listening | Full 64 parts | 64 verified | 59 VERIFIED, 5 UNCERTAIN; no mass rebuild | P1 | PARTIAL |
| Reading | Parts 1–4/scoring | Correct | Dataset/deterministic/E2E tests pass | P2 | WARN |
| Grammar/Vocabulary | UI/scoring/timer | Correct | Unit/E2E coverage pass | P2 | WARN |
| AI Teacher | injection/error/provenance | Controlled | Local 110-query + 10-jailbreak tests pass; live post-auth check pending | P2 | WARN |
| Dashboard/Progress | ownership/persistence | User-scoped | Local store/tests and owner predicate pass; live DB mutation not directly inspected | P1 | WARN |
| Mock Exam | navigation/autosave/sections | Correct | State-machine and E2E tests pass; full live user journey not completed | P2 | WARN |
| Responsive | 390/768/1440/1920 | No overflow/overlap | Automated coverage exists; no complete independent production matrix | P2 | WARN |
| Accessibility | labels/focus/alt/keyboard | Accessible | Axe/unit suite pass; missing images still violate practical content usability | P2 | WARN |

## Speaking final matrix

- Speaking Part 1: `PASS` for dataset/runtime contract; not a complete manual recording-quality certification.
- Speaking Part 2: 16 tasks, 16 image URLs requested, 16 non-rendered, 16 `FAIL`.
- Speaking Part 3: 16 tasks, 32 image URLs requested, 32 non-rendered, 16 pairs `FAIL`.
- Speaking Part 4: `WARN`; technical/unit coverage pass, independent live recording-to-AI verification remains incomplete.
- Recording pipeline: `PASS` locally by mock/schema tests; live browser microphone/AI run not re-certified after security change.
- STT: `PASS` in local mocked/edge suite only.
- Task context: `PASS` in local tests; production post-deploy verification pending.
- AI rubric: `PASS` in local structured-output tests; not a claim of objective examiner validity.
- Result persistence: `WARN`; local isolation tests pass, production logout/login ownership journey not fully re-run.

## Listening regression matrix

| Scope | Status | Evidence |
|---|---|---|
| Test 01 Part 1 Q1 | VERIFIED | Full source-defined block, browser bytes/currentSrc/transcript, no Q2 |
| Test 06 Part 1 Q7 | VERIFIED | Full repeated-opening block, exact browser bytes/transcript, no Q8, scoring 1/13 for selected answer |
| Test 03 Part 1 | UNCERTAIN | Q13 master ends before source transcript ending |
| Test 16 Parts 1–4 | UNCERTAIN | No authoritative master audio; production assets intentionally absent |
| Remaining previously validated parts | VERIFIED | 59/64 part-level contract matrix |

## Totals

- Total master-audit scenarios recorded: 32 production Speaking Part 2/3 pages + 48 browser image requests + security endpoint checks + local full suite and Listening regression matrix. This is not a claim that every requested manual scenario was completed.
- PASS: local tests/build/typecheck and verified Listening representatives.
- FAIL: 48 standard Speaking Part 2/3 image loads; production AI auth remains old until deployment is confirmed.
- WARN/UNCERTAIN: full live AI quality/persistence, 5 Listening regions, pending production deployment verification, broad responsive/manual accessibility.
- P0: 0 evidenced.
- P1: 1 open (`SPEAKING-IMAGE-001`). Security P1 is fixed and production-auth behavior is verified.
- P2: maintenance/manual verification gaps listed in matrix.
- P3: 0 newly evidenced.

## Final verdict

`FULL PRODUCTION USER AUDIT — ACTION REQUIRED`

`LISTENING NOT FULLY VERIFIED`

`Q1 VERIFIED` remains valid for the previously audited Listening Test 01 Part 1 Q1 only. It does not upgrade the five UNCERTAIN regions or the full module.

Production readiness: **NOT READY**. Do not claim `FULL PRODUCTION USER AUDIT — PASS` until all 48 standard Speaking image references have authoritative task mappings and render in a clean browser, and the incomplete live AI/persistence/error-flow scenarios are re-run.

## Files changed by this audit

- Committed: `project/app/api/coach/chat/route.ts`, `project/app/api/grade/speaking/route.ts`, `project/app/api/grade/writing/route.ts`, `project/lib/auth/api.ts`, `project/lib/auth/index.ts`, `project/lib/auth/session.ts`, `project/lib/db/progress-store.ts`, `project/middleware.ts`, `project/tests/auth.test.ts`, `project/tests/postgres-store.test.ts`, `project/tests/listening-t16-source-parser.test.ts`, `project/tests/run-all-tests.ts`, `scripts/listening_contract_audit.py`.
- Uncommitted audit evidence intentionally left local: `project/reports/final-production-speaking-audit.json`, its script/log, and prior forensic scratch files. Existing user-memory/QA changes were not staged.

## Một bước tiếp theo duy nhất

Bổ sung mapping authoritative cho 48 ảnh Speaking `aptis-b2-*` (không gán theo thứ tự bank), sau đó chạy lại clean-browser production audit.
