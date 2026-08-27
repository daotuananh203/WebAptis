"""Build a source-aware inventory for standard Speaking image mappings.

This deliberately does not infer mappings. It records what the source artifacts
actually contain and marks standard-test mappings BLOCKED when no relationship
between a task and a candidate image is present.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "tests"
PUBLIC_DIR = ROOT / "public"
IMAGE_DIR = PUBLIC_DIR / "images" / "speaking" / "gdrive"
BANK_PATH = ROOT / "data" / "prediction" / "speaking" / "speaking-bank.json"
MANIFEST_PATH = IMAGE_DIR / "manifest.json"
OUT_PATH = ROOT / "data" / "audits" / "speaking-image-forensic-inventory.json"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    manifest_by_path = {entry["localPath"].lstrip("/"): (index + 1, entry) for index, entry in enumerate(manifest.values())}
    bank = json.loads(BANK_PATH.read_text(encoding="utf-8"))

    candidate_images = []
    hash_to_paths: dict[str, list[str]] = {}
    for path in sorted(IMAGE_DIR.glob("*.jpg")):
        relative = path.relative_to(PUBLIC_DIR).as_posix()
        source_position, source_entry = manifest_by_path.get(relative, (None, {}))
        with Image.open(path) as image:
            width, height = image.size
            image_format = image.format
        image_hash = sha256(path)
        hash_to_paths.setdefault(image_hash, []).append("/" + relative)
        candidate_images.append(
            {
                "candidateImageId": source_entry.get("fileName", path.name),
                "path": "/" + relative,
                "filename": path.name,
                "sha256": image_hash,
                "width": width,
                "height": height,
                "format": image_format,
                "sourceArtifact": str(MANIFEST_PATH.relative_to(ROOT)).replace("\\", "/"),
                "sourcePosition": source_position,
                "sourcePart": source_entry.get("part"),
                "sourceTopic": source_entry.get("topic"),
            }
        )

    bank_relationships = []
    for index, topic in enumerate(bank.get("topics", []), start=1):
        bank_relationships.append(
            {
                "candidateId": topic.get("candidateId"),
                "part": topic.get("partNumber"),
                "topic": topic.get("topic"),
                "images": topic.get("images", []),
                "sourceArtifact": str(BANK_PATH.relative_to(ROOT)).replace("\\", "/"),
                "sourceOrder": index,
            }
        )

    standard_tasks = []
    for test_number in range(1, 17):
        test_id = f"aptis-b2-{test_number:02d}"
        path = DATA_DIR / f"{test_id}-public.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        speaking_parts = {part["partNumber"]: part for part in data["speaking"]["parts"]}
        for part_number in (2, 3):
            part = speaking_parts[part_number]
            image_paths = []
            if part_number == 2:
                image_paths = [part.get("imageUrl")]
                task_id = f"t{test_number:02d}_s2"
                prompts = [question["prompt"] for question in part.get("questions", [])]
            else:
                image_paths = [part.get("images", {}).get("image1Url"), part.get("images", {}).get("image2Url")]
                task_id = f"t{test_number:02d}_s3"
                prompts = [question["prompt"] for question in part.get("questions", [])]
            image_paths = [item for item in image_paths if item]
            exists = [((PUBLIC_DIR / item.lstrip("/")).exists()) for item in image_paths]
            standard_tasks.append(
                {
                    "testId": test_id,
                    "part": part_number,
                    "taskId": task_id,
                    "prompt": prompts,
                    "imageA": image_paths[0] if image_paths else None,
                    "imageB": image_paths[1] if len(image_paths) > 1 else None,
                    "sourceArtifact": str(path.relative_to(ROOT)).replace("\\", "/"),
                    "sourceOrder": part_number,
                    "assetExists": exists,
                    "candidateRelationshipFound": False,
                    "mappingConfidence": "BLOCKED",
                    "evidenceFound": [
                        "standard dataset contains the URL reference",
                        "no matching asset exists under project/public/images/speaking",
                        "no standard test/task relationship exists in speaking-bank.json",
                    ],
                    "missingEvidence": [
                        "authoritative source artifact linking this taskId to a candidate image",
                        "embedded DOCX/PDF image relationship for this standard test",
                    ],
                }
            )

    duplicate_groups = [
        {"sha256": image_hash, "paths": paths, "status": "UNEXPLAINED-DUPLICATE"}
        for image_hash, paths in sorted(hash_to_paths.items())
        if len(paths) > 1
    ]

    output = {
        "generatedAt": "2026-08-27",
        "sourceOfTruthPolicy": [
            "Original source structure",
            "Embedded image relationship",
            "Source ordering",
            "Explicit metadata",
            "Existing manifest",
            "Git history",
            "Candidate metadata",
            "Semantic inspection",
        ],
        "candidateImageInventory": candidate_images,
        "candidateBankRelationships": bank_relationships,
        "standardTaskInventory": standard_tasks,
        "duplicateGroups": duplicate_groups,
        "summary": {
            "standardTasks": len(standard_tasks),
            "expectedImages": sum(1 if task["part"] == 2 else 2 for task in standard_tasks),
            "existingStandardAssets": sum(sum(task["assetExists"]) for task in standard_tasks),
            "authoritativeStandardMappings": sum(task["candidateRelationshipFound"] for task in standard_tasks),
            "blockedStandardMappings": sum(task["mappingConfidence"] == "BLOCKED" for task in standard_tasks),
            "candidateImages": len(candidate_images),
            "duplicateGroups": len(duplicate_groups),
            "verdict": "SPEAKING IMAGE MAPPING BLOCKED",
        },
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(output["summary"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
