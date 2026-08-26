"""Transcribe generated Listening bytes and enforce the content contract."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from faster_whisper import WhisperModel

import listening_contract_audit as audit


ROOT = Path(__file__).resolve().parents[1]
TRANSCRIPT_ROOT = ROOT / "project" / "data" / "listening-forensics" / "segment-transcripts"


def transcribe(path: Path, model: WhisperModel) -> tuple[list[audit.TranscriptWord], dict]:
    iterator, info = model.transcribe(
        str(path),
        language="en",
        beam_size=5,
        best_of=5,
        word_timestamps=True,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 350},
        condition_on_previous_text=False,
        temperature=0.0,
    )
    segments = []
    words = []
    for segment in iterator:
        segment_words = []
        for word in segment.words or []:
            normalized = audit.tokens(word.word)
            for value in normalized:
                words.append(audit.TranscriptWord(float(word.start), float(word.end), value))
            segment_words.append(
                {
                    "start": round(float(word.start), 3),
                    "end": round(float(word.end), 3),
                    "word": word.word,
                    "probability": round(float(word.probability), 5),
                }
            )
        segments.append(
            {
                "start": round(float(segment.start), 3),
                "end": round(float(segment.end), 3),
                "text": segment.text.strip(),
                "words": segment_words,
            }
        )
    return words, {
        "engine": "faster-whisper",
        "model": "base",
        "language": info.language,
        "segments": segments,
    }


def expected_blocks(audit_result: dict, artifact: dict) -> list[dict]:
    block_id = artifact["blockId"]
    if block_id == "p2-task-all":
        return [block for block in audit_result["blocks"] if block["part"] == 2]
    if block_id == "p4-task-all":
        return [block for block in audit_result["blocks"] if block["part"] == 4]
    return [block for block in audit_result["blocks"] if block["blockId"] == block_id]


def validate_artifact(audit_result: dict, artifact: dict, words: list[audit.TranscriptWord]) -> dict:
    expected = expected_blocks(audit_result, artifact)
    expected_ids = {block["blockId"] for block in expected}
    source_by_id = {
        block["blockId"]: audit.SourceBlock(
            block["blockId"], block["part"], block["label"], block["sourceText"]
        )
        for block in expected
    }
    starts_by_id = {
        block_id: audit.find_all_word_openings(source, words)
        for block_id, source in source_by_id.items()
    }
    timeline = sorted(
        (word_index, block_id)
        for block_id, starts in starts_by_id.items()
        for word_index, _ in starts
    )
    next_opening = {
        (block_id, word_index): (
            timeline[index + 1][0] if index + 1 < len(timeline) else len(words)
        )
        for index, (word_index, block_id) in enumerate(timeline)
    }
    checks = []
    for block in expected:
        source = source_by_id[block["blockId"]]
        starts = starts_by_id[block["blockId"]]
        complete = []
        for index, opening_match in starts:
            alignment = audit.occurrence_alignment(
                source,
                words,
                index,
                next_opening[(block["blockId"], index)],
            )
            alignment["openingMatch"] = round(opening_match, 4)
            alignment["complete"] = (
                opening_match >= 0.62
                and alignment["sourceTokenCoverage"] >= 0.82
                and alignment["openingCoverage"] >= 0.72
                and alignment["endingCoverage"] >= 0.72
                and alignment["sequenceMatch"] >= 0.68
            )
            if alignment["complete"]:
                complete.append(alignment)
        expected_count = artifact.get("expectedBlockRenditions", {}).get(
            block["blockId"],
            artifact.get("expectedCompleteRenditions", block["completeRenditions"]),
        )
        checks.append(
            {
                "blockId": block["blockId"],
                "expectedCompleteRenditions": expected_count,
                "detectedCompleteRenditions": len(complete),
                "pass": len(complete) == expected_count,
                "occurrences": complete,
            }
        )

    contamination = []
    for block in audit_result["blocks"]:
        if block["blockId"] in expected_ids:
            continue
        source = audit.SourceBlock(block["blockId"], block["part"], block["label"], block["sourceText"])
        for index, opening_match in audit.find_all_word_openings(source, words):
            if opening_match < 0.72:
                continue
            aligned = audit.occurrence_alignment(source, words, index, len(words))
            if aligned["sourceTokenCoverage"] >= 0.78 and aligned["endingCoverage"] >= 0.64:
                contamination.append(
                    {
                        "unexpectedBlockId": block["blockId"],
                        "openingMatch": round(opening_match, 4),
                        "sourceTokenCoverage": aligned["sourceTokenCoverage"],
                    }
                )
    passed = bool(checks) and all(check["pass"] for check in checks) and not contamination
    return {
        "status": "VERIFIED" if passed else "MISMATCH",
        "checks": checks,
        "unexpectedTaskContamination": contamination,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    parser.add_argument(
        "--test",
        help="Optional comma-separated test numbers to validate (for example 1,4,15)",
    )
    args = parser.parse_args()
    manifest_path = args.manifest if args.manifest.is_absolute() else ROOT / args.manifest
    output_path = args.output or manifest_path
    if not output_path.is_absolute():
        output_path = ROOT / output_path
    results = json.loads(manifest_path.read_text(encoding="utf-8"))
    selected_tests = (
        {f"aptis-b2-{int(value):02d}" for value in args.test.split(",")}
        if args.test
        else None
    )
    print("Loading faster-whisper base from local cache...", flush=True)
    model = WhisperModel("base", device="cpu", compute_type="int8", local_files_only=True)
    for result in results:
        test_id = result["audit"]["testId"]
        if selected_tests is not None and test_id not in selected_tests:
            continue
        for artifact in result["artifacts"]:
            if not artifact["status"].startswith("GENERATED"):
                continue
            path = ROOT / artifact["path"]
            words, transcript = transcribe(path, model)
            validation = validate_artifact(result["audit"], artifact, words)
            transcript_path = TRANSCRIPT_ROOT / test_id / f"{artifact['blockId']}.json"
            transcript_path.parent.mkdir(parents=True, exist_ok=True)
            transcript_record = {
                "testId": test_id,
                "blockId": artifact["blockId"],
                "audioPath": artifact["path"],
                "audioSha256": artifact["sha256"],
                "transcription": transcript,
                "validation": validation,
            }
            transcript_path.write_text(json.dumps(transcript_record, ensure_ascii=False, indent=2), encoding="utf-8")
            artifact["status"] = validation["status"]
            artifact["transcriptEvidence"] = str(transcript_path.relative_to(ROOT)).replace("\\", "/")
            print(f"{test_id} {artifact['blockId']}: {artifact['status']}", flush=True)
            # Checkpoint after every exact asset. Long corpus validation can be
            # interrupted by a workstation/session restart; completed ASR
            # evidence must remain durable without promoting unfinished work.
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(
                json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
            )


if __name__ == "__main__":
    main()
