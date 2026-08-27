"""Build the source-backed Speaking Part 2/3 reconstruction.

The current standard test pack contains generic Speaking prompts and placeholder
image URLs.  The Google Docs import contains real source topics and embedded
images, but it does not contain the historical aptis-b2 test assignment.  This
script therefore makes that distinction explicit: it assigns a verified source
topic to each standard slot using a deterministic SHA-256 ordering, while
preserving the source topic/questions and recording provenance in a canonical
manifest.

This is intentionally not an attempt to recover the original test ordering.
"""

from __future__ import annotations

import hashlib
import io
import json
import urllib.request
from datetime import date
from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BANK_PATH = PROJECT_ROOT / "data/prediction/speaking/speaking-bank.json"
CROSSWALK_PATH = PROJECT_ROOT / "data/audits/speaking-standard-topic-crosswalk.json"
MANIFEST_PATH = PROJECT_ROOT / "data/speaking/canonical-speaking-mapping.json"
PUBLIC_ROOT = PROJECT_ROOT / "public"
RECONSTRUCTED_ROOT = PUBLIC_ROOT / "images/speaking/reconstructed"

SOURCE_DOCUMENT_URL = (
    "https://docs.google.com/document/d/"
    "1wsV6frhcqDHFMNWApkw0wl37C_HI7Zv9480r9ClAq1c/edit"
)

PART2_SOURCE_IDS = [
    f"gdrive_spk_p2_{number:03d}"
    for number in [*range(2, 9), 10, 11, *range(13, 20)]
]

# Prefer topics with three source questions and a verified image relationship.
# A single wide source placement is split into A/B crops below when the source
# image itself is a side-by-side comparison plate.
PART3_SOURCE_IDS = [
    "gdrive_spk_p3_036",
    "gdrive_spk_p3_040",
    "gdrive_spk_p3_041",
    "gdrive_spk_p3_042",
    "gdrive_spk_p3_043",
    "gdrive_spk_p3_044",
    "gdrive_spk_p3_046",
    "gdrive_spk_p3_047",
    "gdrive_spk_p3_048",
    "gdrive_spk_p3_050",
    "gdrive_spk_p3_051",
    "gdrive_spk_p3_052",
    "gdrive_spk_p3_053",
    "gdrive_spk_p3_054",
    "gdrive_spk_p3_055",
    "gdrive_spk_p3_056",
]


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def stable_order(source_ids: list[str]) -> list[str]:
    return sorted(source_ids, key=lambda value: hashlib.sha256(value.encode()).hexdigest())


def public_path_to_file(public_path: str) -> Path:
    if not public_path.startswith("/"):
        raise ValueError(f"Expected a public absolute path, got {public_path}")
    return PUBLIC_ROOT / public_path.lstrip("/")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def image_metadata(path: Path) -> dict:
    with Image.open(path) as image:
        width, height = image.size
        image_format = image.format or path.suffix.lstrip(".").upper()
    return {
        "path": "/" + path.relative_to(PUBLIC_ROOT).as_posix(),
        "sha256": sha256_file(path),
        "width": width,
        "height": height,
        "format": image_format,
        "bytes": path.stat().st_size,
    }


def source_evidence(topic: dict, crosswalk_topic: dict) -> dict:
    placements = []
    for image in crosswalk_topic.get("images", []):
        for placement in image.get("sourcePlacements", []):
            placements.append(
                {
                    "sourceOrder": placement.get("sourceOrder"),
                    "documentPosition": placement.get("documentPosition"),
                    "imageCid": placement.get("imageCid"),
                    "sourceSha256": placement.get("sourceSha256"),
                    "sourceTextBefore": placement.get("sourceTextBefore"),
                    "sourceTextAfter": placement.get("sourceTextAfter"),
                }
            )
    return {
        "sourceDocument": SOURCE_DOCUMENT_URL,
        "sourceArtifact": "project/data/prediction/speaking/speaking-bank.json",
        "sourceTopicId": topic["candidateId"],
        "topic": topic["topic"],
        "sourceOrder": crosswalk_topic.get("sourceLocation", {}).get("sourceOrder"),
        "sourceRelationshipStatus": crosswalk_topic.get("sourceRelationshipStatus"),
        "embeddedImagePlacements": placements,
        "relationshipEvidence": (
            "Google Docs forensic inventory records the topic text immediately "
            "adjacent to the embedded image relationship and its source CID."
        ),
    }


def fetch_source_image(crosswalk_image: dict, source_id: str) -> tuple[bytes, dict]:
    """Fetch and hash-check the embedded image recorded by the Docs audit."""
    placements = crosswalk_image.get("sourcePlacements", [])
    if not placements or not placements[0].get("sourceUrl"):
        raise RuntimeError(f"No fetchable embedded source image for {source_id}")
    placement = placements[0]
    expected_sha = placement.get("sourceSha256")
    if not expected_sha:
        raise RuntimeError(f"Embedded source image has no SHA-256 for {source_id}")
    print(f"Fetching verified source image: {source_id}", flush=True)
    with urllib.request.urlopen(placement["sourceUrl"], timeout=15) as response:
        data = response.read()
    actual_sha = hashlib.sha256(data).hexdigest()
    if actual_sha != expected_sha:
        raise RuntimeError(
            f"Source image hash mismatch for {source_id}: expected {expected_sha}, got {actual_sha}"
        )
    return data, {
        "sourceSha256": actual_sha,
        "sourceOrder": placement.get("sourceOrder"),
        "documentPosition": placement.get("documentPosition"),
        "imageCid": placement.get("imageCid"),
    }


def crop_composite(source_bytes: bytes, source_id: str, source_info: dict) -> tuple[str, str, dict]:
    """Create two source-derived lossless crops from a side-by-side source plate."""
    RECONSTRUCTED_ROOT.mkdir(parents=True, exist_ok=True)
    with Image.open(io.BytesIO(source_bytes)) as image:
        width, height = image.size
        split_x = width // 2
        boxes = [(0, 0, split_x, height), (split_x, 0, width, height)]
        output_paths = []
        for suffix, box in zip(("a", "b"), boxes):
            output = RECONSTRUCTED_ROOT / f"{source_id}-{suffix}.png"
            image.crop(box).save(output, format="PNG", optimize=True)
            output_paths.append("/" + output.relative_to(PUBLIC_ROOT).as_posix())
        derivation = {
            "type": "source-composite-crop",
            "parentSource": "Google Docs embedded image",
            "parentSourceSha256": source_info["sourceSha256"],
            "parentSourceOrder": source_info.get("sourceOrder"),
            "parentDocumentPosition": source_info.get("documentPosition"),
            "parentImageCid": source_info.get("imageCid"),
            "cropBoxes": {
                "a": list(boxes[0]),
                "b": list(boxes[1]),
            },
            "method": "deterministic vertical split of the source side-by-side plate",
        }
    return output_paths[0], output_paths[1], derivation


def write_source_asset(source_bytes: bytes, source_id: str, suffix: str, source_info: dict) -> tuple[str, dict]:
    """Write exact embedded source bytes to a stable public name."""
    RECONSTRUCTED_ROOT.mkdir(parents=True, exist_ok=True)
    with Image.open(io.BytesIO(source_bytes)) as image:
        image_format = image.format or "PNG"
    extension = ".png" if image_format.upper() == "PNG" else ".jpg"
    output = RECONSTRUCTED_ROOT / f"{source_id}-{suffix}{extension}"
    output.write_bytes(source_bytes)
    public_output = "/" + output.relative_to(PUBLIC_ROOT).as_posix()
    return public_output, {
        "type": "source-asset",
        "parentSource": "Google Docs embedded image",
        "parentSourceSha256": source_info["sourceSha256"],
        "parentSourceOrder": source_info.get("sourceOrder"),
        "parentDocumentPosition": source_info.get("documentPosition"),
        "parentImageCid": source_info.get("imageCid"),
        "method": "byte-preserving materialization of hash-verified embedded source",
    }


def build_question(question: dict, question_id: str) -> dict:
    return {
        "id": question_id,
        "prompt": question["questionText"],
        "preparationTimeSeconds": 0,
        "responseTimeSeconds": 45,
    }


def main() -> None:
    bank = load_json(BANK_PATH)
    crosswalk = load_json(CROSSWALK_PATH)
    topics = {topic["candidateId"]: topic for topic in bank["topics"]}
    crosswalk_topics = {
        topic["candidateTopicId"]: topic for topic in crosswalk["googleDocTopicInventory"]
    }

    selected_ids = PART2_SOURCE_IDS + PART3_SOURCE_IDS
    for source_id in selected_ids:
        topic = topics.get(source_id)
        crosswalk_topic = crosswalk_topics.get(source_id)
        if not topic or not crosswalk_topic:
            raise RuntimeError(f"Missing source inventory entry for {source_id}")
        if crosswalk_topic.get("sourceRelationshipStatus") != "VERIFIED":
            raise RuntimeError(f"Source image relationship is not verified for {source_id}")
        if len(topic.get("questions", [])) != 3:
            raise RuntimeError(f"Expected exactly 3 source questions for {source_id}")
        if len(topic.get("images", [])) < 1:
            raise RuntimeError(f"Expected a source image for {source_id}")

    # Build image records once so the manifest and datasets use identical paths.
    image_records: dict[str, dict] = {}
    asset_derivations: dict[str, dict] = {}
    topic_image_paths: dict[str, list[str]] = {}
    composite_source_ids = {
        "gdrive_spk_p3_036",
        "gdrive_spk_p3_040",
        "gdrive_spk_p3_043",
        "gdrive_spk_p3_048",
        "gdrive_spk_p3_050",
        "gdrive_spk_p3_051",
        "gdrive_spk_p3_052",
        "gdrive_spk_p3_053",
        "gdrive_spk_p3_054",
    }

    for source_id in selected_ids:
        topic = topics[source_id]
        crosswalk_topic = crosswalk_topics[source_id]
        source_paths = topic["images"]
        if topic["partNumber"] == 2:
            if len(source_paths) != 1:
                raise RuntimeError(f"Expected one source image for {source_id}")
            source_bytes, source_info = fetch_source_image(crosswalk_topic["images"][0], source_id)
            output_path, derivation = write_source_asset(source_bytes, source_id, "a", source_info)
            topic_image_paths[source_id] = [output_path]
            asset_derivations[output_path] = derivation
            paths_for_inventory = [output_path]
        elif source_id in composite_source_ids:
            if len(source_paths) != 1:
                raise RuntimeError(f"Composite source must have one image: {source_id}")
            source_bytes, source_info = fetch_source_image(crosswalk_topic["images"][0], source_id)
            image_a, image_b, derivation = crop_composite(source_bytes, source_id, source_info)
            topic_image_paths[source_id] = [image_a, image_b]
            asset_derivations[image_a] = {**derivation, "cropRole": "a", "cropBox": derivation["cropBoxes"]["a"]}
            asset_derivations[image_b] = {**derivation, "cropRole": "b", "cropBox": derivation["cropBoxes"]["b"]}
            paths_for_inventory = [image_a, image_b]
        else:
            if len(source_paths) != 2:
                raise RuntimeError(f"Expected two source images for {source_id}")
            output_paths = []
            for index, source_path in enumerate(source_paths, 1):
                source_bytes, source_info = fetch_source_image(crosswalk_topic["images"][index - 1], source_id)
                output_path, derivation = write_source_asset(
                    source_bytes,
                    source_id,
                    "a" if index == 1 else "b",
                    source_info,
                )
                output_paths.append(output_path)
                asset_derivations[output_path] = derivation
            topic_image_paths[source_id] = output_paths
            paths_for_inventory = output_paths

        for path in paths_for_inventory:
            file_path = public_path_to_file(path)
            if not file_path.exists():
                raise RuntimeError(f"Missing public image file: {file_path}")
            record = image_metadata(file_path)
            record["sourceDocument"] = SOURCE_DOCUMENT_URL
            record["sourceTopicId"] = source_id
            record["sourceOrder"] = crosswalk_topic.get("sourceLocation", {}).get("sourceOrder")
            if path in asset_derivations:
                record["derivation"] = asset_derivations[path]
            image_records[path] = record

    ordered_part2 = stable_order(PART2_SOURCE_IDS)
    ordered_part3 = stable_order(PART3_SOURCE_IDS)
    standard_mappings: list[dict] = []

    for test_number in range(1, 17):
        test_id = f"aptis-b2-{test_number:02d}"
        # Preserve the canonical test-scoped IDs used by the existing public
        # records (including Test 01), so saved attempts and context lookups
        # do not change identity during reconstruction.
        prefix = f"t{test_number:02d}_"
        dataset_path = PROJECT_ROOT / f"data/tests/{test_id}-public.json"
        dataset = load_json(dataset_path)

        p2_source_id = ordered_part2[test_number - 1]
        p3_source_id = ordered_part3[test_number - 1]
        p2_topic = topics[p2_source_id]
        p3_topic = topics[p3_source_id]
        p2_crosswalk = crosswalk_topics[p2_source_id]
        p3_crosswalk = crosswalk_topics[p3_source_id]

        p2_questions = [
            build_question(question, f"{prefix}s2_q{index}")
            for index, question in enumerate(p2_topic["questions"], 1)
        ]
        p3_questions = [
            build_question(question, f"{prefix}s3_q{index}")
            for index, question in enumerate(p3_topic["questions"], 1)
        ]

        parts = dataset["speaking"]["parts"]
        parts[1] = {
            "partNumber": 2,
            "taskType": "describe-recount-opinion",
            "instructions": "Describe the photograph and answer the two follow-up questions. You have 45 seconds for each response.",
            "imageUrl": topic_image_paths[p2_source_id][0],
            "imageAlt": f"Source topic: {p2_topic['topic']}",
            "questions": p2_questions,
        }
        p3_images = topic_image_paths[p3_source_id]
        parts[2] = {
            "partNumber": 3,
            "taskType": "compare-speculate-opinion",
            "instructions": "Compare the two photographs and answer the two follow-up questions. You have 45 seconds for each response.",
            "images": {
                "image1Url": p3_images[0],
                "image1Alt": f"Source topic: {p3_topic['topic']} — image A",
                "image2Url": p3_images[1],
                "image2Alt": f"Source topic: {p3_topic['topic']} — image B",
            },
            "questions": p3_questions,
        }
        dataset_path.write_text(json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        for part, source_id, topic, crosswalk_topic, image_paths in [
            (2, p2_source_id, p2_topic, p2_crosswalk, topic_image_paths[p2_source_id]),
            (3, p3_source_id, p3_topic, p3_crosswalk, topic_image_paths[p3_source_id]),
        ]:
            standard_mappings.append(
                {
                    "testId": test_id,
                    "part": part,
                    "taskId": f"{prefix}s{part}",
                    "sourceTaskId": source_id,
                    "sourceTopic": topic["topic"],
                    "prompt": [question["questionText"] for question in topic["questions"]],
                    "imagePaths": image_paths,
                    "sourceEvidence": source_evidence(topic, crosswalk_topic),
                    "imageInventory": [image_records[path] for path in image_paths],
                    "confidence": "HIGH",
                    "status": "RECONSTRUCTED",
                    "assignmentMethod": "stable-sha256-slot-assignment",
                    "historicalMappingRecovered": False,
                    "reconstructionNote": (
                        "The source topic/image/question relationship is verified. "
                        "The original aptis-b2 test ordering was not present in the source; "
                        "this stable assignment creates a usable, reproducible practice pack."
                    ),
                }
            )

    all_source_topics = [topic for topic in bank["topics"] if topic.get("partNumber") in (2, 3)]
    selected_set = set(selected_ids)
    practice_topics = [
        {
            "sourceTaskId": topic["candidateId"],
            "part": topic["partNumber"],
            "topic": topic["topic"],
            "imagePaths": topic.get("images", []),
            "questionCount": len(topic.get("questions", [])),
            "available": topic["candidateId"] not in selected_set,
            "sourceArtifact": "project/data/prediction/speaking/speaking-bank.json",
        }
        for topic in all_source_topics
    ]

    manifest = {
        "manifestVersion": "1.0.0",
        "generatedAt": date.today().isoformat(),
        "mappingKind": "source-backed-reconstruction",
        "historicalStandardMapping": "NOT_RECOVERED",
        "sourceOfTruth": {
            "document": SOURCE_DOCUMENT_URL,
            "sourceDocumentId": "1wsV6frhcqDHFMNWApkw0wl37C_HI7Zv9480r9ClAq1c",
            "topicImageRelationship": "Google Docs embedded-image forensic inventory",
            "candidateBank": "project/data/prediction/speaking/speaking-bank.json",
            "crosswalkAudit": "project/data/audits/speaking-standard-topic-crosswalk.json",
        },
        "assignmentPolicy": {
            "method": "stable-sha256-slot-assignment",
            "part2Order": ordered_part2,
            "part3Order": ordered_part3,
            "prohibitedInference": "This ordering does not claim to be the historical Aptis test order.",
        },
        "standardMappings": sorted(standard_mappings, key=lambda item: (item["testId"], item["part"])),
        "imageInventory": sorted(image_records.values(), key=lambda item: item["path"]),
        "practiceBank": {
            "source": "project/data/prediction/speaking/speaking-bank.json",
            "description": "All imported Part 2/3 source topics remain available through the Speaking Practice Bank; selected standard topics are marked available=false.",
            "topics": practice_topics,
        },
        "summary": {
            "standardPart2": {"expected": 16, "verifiedSourceBacked": 16, "status": "RECONSTRUCTED"},
            "standardPart3": {"expected": 16, "verifiedSourceBacked": 16, "status": "RECONSTRUCTED"},
            "historicalStandardMappingsRecovered": 0,
            "sourceTopicImageRelationshipsVerified": len(selected_ids),
            "sourceDerivedCompositeTopics": sorted(composite_source_ids),
            "allPart2Part3PracticeTopicsRetained": len(all_source_topics),
        },
    }
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {MANIFEST_PATH}")
    print(f"Reconstructed {len(standard_mappings)} standard Speaking Part 2/3 mappings")
    print(f"Generated {len(asset_derivations)} stable public source/crop assets")


if __name__ == "__main__":
    main()
