# WebAptis B2 — Speaking Final Audit

Date: 2026-08-27  
Production: https://web-aptis.vercel.app  
Verified application commit: `c9c7c56` (`fix(speaking): block unresolved image placeholders`)

## Verdict

`SPEAKING PARTIALLY FIXED`

The production UI no longer requests the known unresolved `test_XX` image placeholders and no longer exposes a broken image. The authoritative mapping from the 32 standard Part 2/3 tasks to the Google Docs topics/images is still unresolved, so real images have deliberately not been assigned.

## Source and mapping status

- Standard datasets: 16 Part 2 tasks and 16 Part 3 tasks were inspected.
- Google Docs forensic inventory: Part 2 and Part 3 source topics/embedded placements are available, but contain no `testId`, `aptis-b2-*`, `taskId`, or legacy bridge.
- Existing crosswalk/provenance artifacts report zero verified standard-task-to-topic mappings.
- Mapping by order, filename, candidate ID, or generic prompt similarity was not used.
- Listening was not modified; the existing state remains 59/64 verified and 5 uncertain.

## Production/browser evidence

Clean Chromium with a fresh audit session opened:

| Flow | UI state | Image requests | Placeholder `<img>` | Failed image requests |
|---|---:|---:|---:|---:|
| Test 01 Part 2 | 1 `IMAGE SOURCE UNAVAILABLE` | 0 | 0 | 0 |
| Test 01 Part 3 | 2 `IMAGE SOURCE UNAVAILABLE` | 0 | 0 | 0 |

This proves the deployed safety behavior, not image correctness. Since the source mapping is not authoritative, the standard tasks currently render an explicit unavailable state rather than an image.

## Changes

- Added a Speaking image availability policy that rejects known standard placeholders, external URLs, and query/hash variants.
- Added an accessible `IMAGE SOURCE UNAVAILABLE` component and runtime image error state.
- Prevented unresolved image URLs from entering Speaking AI visual context.
- Removed the fake fallback audio payload from Speaking practice submission.
- Bound the recorded audio key and submitted task ID to the current Speaking question.
- Added regression coverage for all 48 standard Part 2/3 image references and updated the stale placeholder assumptions in the Speaking context test.

## Validation

- `npm run typecheck` — PASS
- `npm test` — PASS, master suite exit code 0
- `npm run build` — PASS
- Local clean-Chromium verification — PASS for safe unavailable state; no placeholder image request
- Production clean-Chromium verification — PASS for safe unavailable state; no placeholder image request

## Remaining blockers

- 16 standard Part 2 image mappings: `UNCERTAIN`
- 16 standard Part 3 image pairs: `UNCERTAIN`
- Therefore 48 real production image references cannot be marked verified.
- Full Speaking production recording/AI/persistence, responsive, and accessibility journeys were not re-certified end-to-end in this run; existing unit/security coverage passed, but that is not equivalent to full browser certification.

## Production readiness

Speaking is not fully ready for standard Part 2/3 image-based practice. The broken-image failure mode is fixed, but the core content requirement—showing the correct source image for every standard task—remains blocked by missing authoritative mapping evidence.
