"""Merge targeted rebuilt artifacts into a checkpointed Listening manifest."""

from __future__ import annotations

import argparse
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def resolve(value: Path) -> Path:
    return value if value.is_absolute() else ROOT / value


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", type=Path, required=True)
    parser.add_argument("--update", type=Path, action="append", default=[])
    parser.add_argument(
        "--audit-file",
        type=Path,
        help="Replace every test audit while preserving validated artifacts",
    )
    parser.add_argument(
        "--only-test",
        help="Comma-separated test IDs/numbers to merge from update manifests",
    )
    args = parser.parse_args()
    target = resolve(args.target)
    results = json.loads(target.read_text(encoding="utf-8"))
    by_test = {result["audit"]["testId"]: result for result in results}
    selected_tests = None
    if args.only_test:
        selected_tests = {
            value if value.startswith("aptis-b2-") else f"aptis-b2-{int(value):02d}"
            for value in args.only_test.split(",")
        }

    for update_path in args.update:
        for update in json.loads(resolve(update_path).read_text(encoding="utf-8")):
            test_id = update["audit"]["testId"]
            if selected_tests is not None and test_id not in selected_tests:
                continue
            destination = by_test[test_id]
            destination["audit"] = update["audit"]
            artifacts = {item["blockId"]: item for item in destination["artifacts"]}
            for artifact in update["artifacts"]:
                artifacts[artifact["blockId"]] = artifact
                print(
                    f"{test_id} {artifact['blockId']}: merged "
                    f"{artifact.get('sha256', artifact['status'])}"
                )
            destination["artifacts"] = list(artifacts.values())

    if args.audit_file:
        audits = json.loads(resolve(args.audit_file).read_text(encoding="utf-8"))
        for audit in audits:
            by_test[audit["testId"]]["audit"] = audit
        print(f"Updated {len(audits)} test audits without resetting artifact evidence")

    target.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
