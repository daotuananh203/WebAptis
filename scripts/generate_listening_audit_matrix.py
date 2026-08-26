"""Generate the honest 16-test × 4-part Listening verification matrix."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "project/data/listening-forensics/listening-audio-manifest.json"
DEFAULT_OUTPUT = ROOT / "project/data/listening-forensics/listening-audit-matrix.json"


def part_status(artifacts: dict[str, dict], required: list[str]) -> tuple[str, list[str]]:
    missing_or_uncertain = [
        block_id
        for block_id in required
        if artifacts.get(block_id, {}).get("status") != "VERIFIED"
    ]
    mismatches = [
        block_id
        for block_id in required
        if artifacts.get(block_id, {}).get("status") == "MISMATCH"
    ]
    if mismatches:
        return "MISMATCH", mismatches
    if missing_or_uncertain:
        return "UNCERTAIN", missing_or_uncertain
    return "VERIFIED", []


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    manifest_path = args.manifest if args.manifest.is_absolute() else ROOT / args.manifest
    output_path = args.output if args.output.is_absolute() else ROOT / args.output
    results = json.loads(manifest_path.read_text(encoding="utf-8"))
    result_by_id = {result["audit"]["testId"]: result for result in results}

    matrix = []
    summary = {"VERIFIED": 0, "MISMATCH": 0, "UNCERTAIN": 0}
    for number in range(1, 17):
        test_id = f"aptis-b2-{number:02d}"
        result = result_by_id.get(test_id)
        if result is None:
            parts = [
                {
                    "part": part,
                    "status": "UNCERTAIN",
                    "reason": "MISSING_SOURCE_AUDIO",
                    "unverifiedBlocks": [],
                }
                for part in range(1, 5)
            ]
        else:
            artifacts = {item["blockId"]: item for item in result["artifacts"]}
            requirements = {
                1: [f"p1-q{question:02d}" for question in range(1, 14)],
                2: ["p2-task-all", *[f"p2-spk-{letter}" for letter in "abcd"]],
                3: ["p3-task-all"],
                4: ["p4-task-all", "p4-mono1", "p4-mono2"],
            }
            parts = []
            for part, required in requirements.items():
                status, unverified = part_status(artifacts, required)
                parts.append(
                    {
                        "part": part,
                        "status": status,
                        "reason": None if status == "VERIFIED" else "SOURCE_OR_AUDIO_CONTRACT_NOT_PROVEN",
                        "unverifiedBlocks": unverified,
                    }
                )
        for part in parts:
            summary[part["status"]] += 1
        matrix.append({"testId": test_id, "parts": parts})

    payload = {
        "contractVersion": 1,
        "totalTests": 16,
        "totalParts": 64,
        "summary": {
            "verified": summary["VERIFIED"],
            "mismatch": summary["MISMATCH"],
            "uncertain": summary["UNCERTAIN"],
        },
        "matrix": matrix,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload["summary"], ensure_ascii=False))


if __name__ == "__main__":
    main()
