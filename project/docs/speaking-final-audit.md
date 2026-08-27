# WebAptis B2 — Speaking Part 2/3 Final Audit

Date: 2026-08-27  
Production: https://web-aptis.vercel.app  

## Verdict

`SPEAKING PART 2/3 — RECONSTRUCTED FROM VERIFIED SOURCE`

The historical assignment from `aptis-b2-*` to the Google Docs topics was not
found. The application now uses an explicit, reproducible reconstruction: each
standard slot keeps a source topic's real questions and embedded source image;
the slot assignment is deterministic SHA-256 ordering and is not presented as
the original Aptis ordering.

## Source-backed mapping

- 16 standard Part 2 mappings: `RECONSTRUCTED`, source relationship `VERIFIED`.
- 16 standard Part 3 mappings: `RECONSTRUCTED`, source relationship `VERIFIED`.
- Part 2 images keep the verified source bytes under stable
  `/images/speaking/reconstructed/gdrive_spk_p2-*.{jpg,png}` asset names.
- Part 3 uses seven topics with two verified source placements and nine source
  side-by-side plates split into deterministic A/B crops. Crop rectangles,
  parent SHA-256, source order, CIDs, and source text context are in
  `data/speaking/canonical-speaking-mapping.json`.
- The imported Part 2/3 source topics not selected for standard slots remain in
  the existing Speaking Practice Bank and are listed in the manifest.
- No mapping was made from test number, candidate filename, or visual guess.

The manifest deliberately records `historicalStandardMapping: NOT_RECOVERED`.
This is a usable source-backed reconstruction, not a claim that the original
standard test pack was recovered.

## Browser and asset evidence

Local production build, clean Chromium:

| Scope | Expected | Rendered | HTTP failures | `naturalWidth = 0` |
|---|---:|---:|---:|---:|
| Standard Part 2 | 16 | 16 | 0 | 0 |
| Standard Part 3 | 32 | 32 | 0 | 0 |
| Total image references | 48 | 48 | 0 | 0 |

The Playwright integrity spec checks every standard Test 01–16 Part 2/3 route,
the actual rendered `<img>` elements, public network responses, content type,
and non-zero browser dimensions. Representative source crops were also
visually inspected before materialization.

## AI context

`resolveSpeakingTaskContext()` now returns the same public paths used by the
UI. The examiner attaches the corresponding public image bytes to Gemini as
inline image parts: one for Part 2 and two in A/B order for Part 3. The image
loader is restricted to the public asset directory and rejects unresolved or
path-traversal URLs.

## Changes

- Added the canonical source-backed reconstruction manifest and generator.
- Materialized 48 stable public source/crop assets without private source URLs.
- Replaced all 32 standard Part 2/3 placeholder references and generic prompts
  with source topic questions and source-backed image mappings.
- Made the dataset generator preserve the reconstruction when rerun.
- Added source mapping, asset existence, AI context, and full Chromium integrity
  regression tests.
- Kept Listening unchanged (`59/64 VERIFIED`, `5 UNCERTAIN`).

## Validation

- `npm test` — PASS, 42/42 suites.
- `npm run typecheck` — PASS.
- `npm run build` — PASS.
- Local clean Chromium image integrity — PASS, 48/48 image references rendered.
- Production verification — pending the deployment of this reconstruction
  commit; no production PASS is claimed in this report until that check is
  repeated against the deployed commit.

## Limitations

The source did not expose the original `aptis-b2-01`…`aptis-b2-16` ordering, so
historical fidelity is unresolved. The manifest makes the fallback assignment
explicit and reproducible. The source-derived composite crops preserve the
source plate content but are not a claim that the original source stored two
separate image files.

## Readiness

For standard Speaking Parts 2/3, the local build is usable and source-backed.
The final production verdict remains conditional until GitHub/Vercel commit
identity and clean-browser production verification are recorded.
