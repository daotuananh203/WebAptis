"""Build Listening segments from complete source-aligned renditions only.

The builder consumes evidence from ``listening_contract_audit``.  It never
cuts on an answer-bearing sentence and it never spans across another detected
task.  Consecutive renditions of one task remain a continuous master clip;
interleaved renditions are concatenated without the intervening task.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import time
from pathlib import Path

import imageio_ffmpeg
from mutagen.mp3 import MP3

import listening_contract_audit as audit


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_AUDIO = ROOT / "project" / "public" / "audio" / "listening" / "segments"
MANIFEST_PATH = (
    ROOT / "project" / "data" / "listening-forensics" / "listening-audio-manifest.json"
)
RECOVERY_MAP_PATH = (
    ROOT
    / "project"
    / "data"
    / "listening-forensics"
    / "source-duplicate-recovery-map.json"
)


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def detected_timeline(result: dict) -> list[dict]:
    timeline = []
    for block in result["blocks"]:
        for occurrence in block.get("occurrences", []):
            if occurrence.get("speechStart") is None or occurrence.get("speechEnd") is None:
                continue
            timeline.append(
                {
                    "blockId": block["blockId"],
                    "part": block["part"],
                    **occurrence,
                }
            )
    return sorted(timeline, key=lambda item: (item["speechStart"], item["speechEnd"]))


def padded_intervals(result: dict) -> dict[str, list[dict]]:
    timeline = detected_timeline(result)
    by_block: dict[str, list[dict]] = {}
    for index, item in enumerate(timeline):
        if not item["completeSourceRendition"]:
            continue
        previous_end = timeline[index - 1]["speechEnd"] if index else 0.0
        next_start = timeline[index + 1]["speechStart"] if index + 1 < len(timeline) else None
        start = max(item["speechStart"] - 1.0, (previous_end + item["speechStart"]) / 2.0)
        end = item["speechEnd"] + 1.0
        if next_start is not None:
            end = min(end, (item["speechEnd"] + next_start) / 2.0)
        by_block.setdefault(item["blockId"], []).append(
            {
                **item,
                "clipStart": round(start, 3),
                "clipEnd": round(end, 3),
            }
        )

    # Preserve natural silence between consecutive renditions of the same
    # task.  A different task, including an incomplete false start, is always
    # a hard blocker and prevents merging.
    timeline_position = {
        (item["blockId"], item["speechStart"]): index for index, item in enumerate(timeline)
    }
    for block_id, intervals in list(by_block.items()):
        merged: list[dict] = []
        for interval in intervals:
            if not merged:
                merged.append(interval)
                continue
            prior = merged[-1]
            prior_position = timeline_position[(block_id, prior["lastSpeechStart"])] if "lastSpeechStart" in prior else timeline_position[(block_id, prior["speechStart"])]
            current_position = timeline_position[(block_id, interval["speechStart"])]
            if current_position == prior_position + 1:
                prior["clipEnd"] = interval["clipEnd"]
                prior["speechEnd"] = interval["speechEnd"]
                prior["lastSpeechStart"] = interval["speechStart"]
                prior.setdefault("renditions", [prior["rendition"]]).append(interval["rendition"])
            else:
                merged.append(interval)
        by_block[block_id] = merged
    return by_block


def render(master: Path, intervals: list[dict], output: Path) -> None:
    if not intervals:
        raise ValueError(f"No complete source rendition for {output}")
    filters = []
    labels = []
    for index, interval in enumerate(intervals):
        label = f"a{index}"
        filters.append(
            f"[0:a]atrim=start={interval['clipStart']}:end={interval['clipEnd']},"
            f"asetpts=PTS-STARTPTS[{label}]"
        )
        labels.append(f"[{label}]")
    if len(labels) == 1:
        filters.append(f"{labels[0]}anull[out]")
    else:
        filters.append(f"{''.join(labels)}concat=n={len(labels)}:v=0:a=1[out]")
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary_output = output.with_name(f"{output.stem}.contract-tmp.mp3")
    subprocess.run(
        [
            imageio_ffmpeg.get_ffmpeg_exe(),
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(master),
            "-filter_complex",
            ";".join(filters),
            "-map",
            "[out]",
            "-codec:a",
            "libmp3lame",
            "-q:a",
            "4",
            str(temporary_output),
        ],
        check=True,
    )
    for attempt in range(20):
        try:
            temporary_output.replace(output)
            break
        except PermissionError:
            if attempt == 19:
                raise
            time.sleep(0.25)


def concatenate_audio(inputs: list[Path], output: Path) -> None:
    """Concatenate already validated task blocks in their source order."""
    if not inputs or any(not path.exists() for path in inputs):
        raise ValueError(f"Missing input while creating {output}: {inputs}")
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary_output = output.with_name(f"{output.stem}.contract-tmp.mp3")
    command = [imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-loglevel", "error", "-y"]
    for path in inputs:
        command.extend(["-i", str(path)])
    labels = "".join(f"[{index}:a]" for index in range(len(inputs)))
    command.extend(
        [
            "-filter_complex",
            f"{labels}concat=n={len(inputs)}:v=0:a=1[out]",
            "-map",
            "[out]",
            "-codec:a",
            "libmp3lame",
            "-q:a",
            "4",
            str(temporary_output),
        ]
    )
    subprocess.run(command, check=True)
    for attempt in range(20):
        try:
            temporary_output.replace(output)
            break
        except PermissionError:
            if attempt == 19:
                raise
            time.sleep(0.25)


def block_output(test_id: str, block_id: str) -> Path:
    base = PUBLIC_AUDIO / test_id
    if block_id.startswith("p1-q"):
        return base / "part-1" / f"{block_id.removeprefix('p1-')}.mp3"
    if block_id.startswith("p2-spk-"):
        return base / "part-2" / f"{block_id.removeprefix('p2-')}.mp3"
    if block_id == "p3-task-all":
        return base / "part-3" / "task-all.mp3"
    if block_id.startswith("p4-mono"):
        return base / "part-4" / f"{block_id.removeprefix('p4-')}.mp3"
    raise ValueError(block_id)


def artifact_record(path: Path, intervals: list[dict]) -> dict:
    return {
        "path": str(path.relative_to(ROOT)).replace("\\", "/"),
        "url": "/" + str(path.relative_to(ROOT / "project" / "public")).replace("\\", "/"),
        "sha256": file_sha256(path),
        "bytes": path.stat().st_size,
        "durationSeconds": round(float(MP3(path).info.length), 6),
        "masterClips": [
            {"start": item["clipStart"], "end": item["clipEnd"]} for item in intervals
        ],
    }


def recovery_map() -> dict[tuple[str, str], dict]:
    payload = json.loads(RECOVERY_MAP_PATH.read_text(encoding="utf-8"))
    return {
        (item["testId"], item["blockId"]): item
        for item in payload.get("recoveries", [])
    }


def build_test(
    test_number: int, *, only_block: str | None = None, render_audio: bool = True
) -> dict:
    result = audit.audit_test(test_number)
    test_id = result["testId"]
    master = ROOT / result["masterAudio"]
    intervals_by_block = padded_intervals(result)
    recoveries = recovery_map()
    artifacts = []
    selected_blocks = set(only_block.split(",")) if only_block else None
    for block in result["blocks"]:
        if selected_blocks and block["blockId"] not in selected_blocks:
            continue
        intervals = intervals_by_block.get(block["blockId"], [])
        recovery = recoveries.get((test_id, block["blockId"]))
        source_master = master
        source_test_id = test_id
        expected_renditions = block["completeRenditions"]
        if (block["status"] != "CANDIDATE" or not intervals) and recovery:
            source_number = int(recovery["sourceTestId"].rsplit("-", 1)[1])
            source_result = audit.audit_test(source_number)
            source_block = next(
                candidate
                for candidate in source_result["blocks"]
                if candidate["blockId"] == recovery["sourceBlockId"]
            )
            if (
                source_block["status"] != "CANDIDATE"
                or source_block["sourceTranscriptSha256"]
                != block["sourceTranscriptSha256"]
                or source_block["sourceTranscriptSha256"]
                != recovery["sourceTranscriptSha256"]
            ):
                raise ValueError(f"Unsafe source-duplicate recovery rejected: {recovery}")
            intervals = padded_intervals(source_result).get(source_block["blockId"], [])
            source_master = ROOT / source_result["masterAudio"]
            source_test_id = source_result["testId"]
            expected_renditions = source_block["completeRenditions"]

        if (block["status"] != "CANDIDATE" and not recovery) or not intervals:
            artifacts.append(
                {
                    "blockId": block["blockId"],
                    "status": "UNCERTAIN",
                    "reason": "No fully source-aligned rendition; existing asset was not overwritten",
                }
            )
            continue
        output = block_output(test_id, block["blockId"])
        if render_audio:
            render(source_master, intervals, output)
        elif not output.exists():
            raise FileNotFoundError(f"Manifest-only mode found no generated asset: {output}")
        artifacts.append(
            {
                "blockId": block["blockId"],
                "status": "GENERATED_PENDING_TRANSCRIPT_VALIDATION",
                "sourceTranscriptSha256": block["sourceTranscriptSha256"],
                "expectedCompleteRenditions": expected_renditions,
                "discardedIncompleteRenditions": block["discardedIncompleteRenditions"],
                "sourceMasterTestId": source_test_id,
                **({"sourceDuplicateRecovery": recovery} if recovery else {}),
                **artifact_record(output, intervals),
            }
        )

    if not selected_blocks or selected_blocks.intersection({"p2-task-all", "p4-task-all"}):
        for part, block_id, relative_path in (
            (2, "p2-task-all", "part-2/task-all.mp3"),
            (4, "p4-task-all", "part-4/task-all.mp3"),
        ):
            if selected_blocks and block_id not in selected_blocks:
                continue
            part_blocks = {block["blockId"] for block in result["blocks"] if block["part"] == part}
            part_intervals = sorted(
                [item for key in part_blocks for item in intervals_by_block.get(key, [])],
                key=lambda item: item["clipStart"],
            )
            if part_intervals and all(block["status"] == "CANDIDATE" for block in result["blocks"] if block["part"] == part):
                output = PUBLIC_AUDIO / test_id / relative_path
                if render_audio:
                    render(master, part_intervals, output)
                elif not output.exists():
                    raise FileNotFoundError(
                        f"Manifest-only mode found no generated asset: {output}"
                    )
                artifacts.append(
                    {
                        "blockId": block_id,
                        "status": "GENERATED_PENDING_TRANSCRIPT_VALIDATION",
                        **artifact_record(output, part_intervals),
                    }
                )
            elif part == 4:
                part_blocks = [block for block in result["blocks"] if block["part"] == 4]
                part_artifacts = {
                    item["blockId"]: item
                    for item in artifacts
                    if item["blockId"] in {block["blockId"] for block in part_blocks}
                    and item["status"].startswith("GENERATED")
                }
                if len(part_artifacts) == len(part_blocks):
                    ordered_inputs = [block_output(test_id, block["blockId"]) for block in part_blocks]
                    output = PUBLIC_AUDIO / test_id / relative_path
                    if render_audio:
                        concatenate_audio(ordered_inputs, output)
                    elif not output.exists():
                        raise FileNotFoundError(
                            f"Manifest-only mode found no generated asset: {output}"
                        )
                    artifacts.append(
                        {
                            "blockId": block_id,
                            "status": "GENERATED_PENDING_TRANSCRIPT_VALIDATION",
                            "sourceDuplicateRecovery": True,
                            "expectedBlockRenditions": {
                                block["blockId"]: part_artifacts[block["blockId"]][
                                    "expectedCompleteRenditions"
                                ]
                                for block in part_blocks
                            },
                            **artifact_record(output, []),
                        }
                    )
    return {"audit": result, "artifacts": artifacts}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", required=True, help="1-15 or comma-separated list")
    parser.add_argument("--only-block")
    parser.add_argument(
        "--manifest-only",
        action="store_true",
        help="Rebuild evidence and hashes from existing contract-generated assets without re-encoding",
    )
    parser.add_argument("--manifest", type=Path, default=MANIFEST_PATH)
    args = parser.parse_args()
    tests = [int(value) for value in args.test.split(",")]
    results = [
        build_test(
            number,
            only_block=args.only_block,
            render_audio=not args.manifest_only,
        )
        for number in tests
    ]
    args.manifest.parent.mkdir(parents=True, exist_ok=True)
    args.manifest.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    for result in results:
        generated = sum(item["status"].startswith("GENERATED") for item in result["artifacts"])
        uncertain = sum(item["status"] == "UNCERTAIN" for item in result["artifacts"])
        print(f"{result['audit']['testId']}: generated={generated} uncertain={uncertain}")


if __name__ == "__main__":
    main()
