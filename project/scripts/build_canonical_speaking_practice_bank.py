import hashlib
import json
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
source_pdf_sha = "1a80da050b08b61e226d7401cfbcd9bed536715b56886e39dd969b34e0d5eb84"

# These are the 18 Part 3 records that were source-limited because the Docs
# import retained one wide source plate (or no image).  The 17 records below
# have a real, topic-scoped side-by-side plate and may be split deterministically.
# gdrive_spk_p3_038 is intentionally absent: the forensic inventory contains no
# embedded image placement for that record.
PART3_COMPOSITE_RECOVERY_IDS = {
    f"gdrive_spk_p3_{number:03d}"
    for number in [36, 37, 40, 43, 48, 50, 51, 52, 53, 54, 58, 59, 60, 61, 62, 63, 64]
}

# The 064 source asset is a captured source page rather than a clean plate.
# These boxes isolate the two source pictures visible in that capture.  They
# are deliberately explicit rather than inferred from a filename or test id.
PART3_CROP_OVERRIDES = {
    "gdrive_spk_p3_064": ((214, 238, 397, 375), (397, 238, 579, 375)),
}

PART3_SOURCE_LIMITED_IDS = {"gdrive_spk_p3_038"}
GOOGLE_DOCS_ACCESS_STATUS = "GOOGLE_DOCS_INACCESSIBLE"
RECOVERY_ROOT = ROOT / "public" / "images" / "speaking" / "source-recovered" / "part3"
SEARCHED_SOURCE_LOCATIONS = [
    "APTIS/",
    "APTIS/Bộ đề 4 kĩ năng/",
    "resources/",
    "Aptis-AI-Brain/",
    "project/data/",
    "project/public/images/",
    "gdrive/",
    "Git history/archives",
    "Google Docs (inaccessible)",
]


def norm(value: str) -> str:
    value = value.lower().strip().replace("’", "'").replace("‘", "'")
    value = value.replace("“", '"').replace("”", '"')
    value = re.sub(r"[.!?,;:]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def qtext(value: object) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return str(value.get("questionText") or value.get("prompt") or value.get("question") or "")
    return ""


def sha_for(url: str | None) -> str | None:
    if not url:
        return None
    path = ROOT / "public" / url.lstrip("/")
    return hashlib.sha256(path.read_bytes()).hexdigest() if path.exists() else None


def recover_composite_pair(topic: dict) -> tuple[str, str, dict]:
    """Materialize two crops from one locally captured source composite.

    This never combines files from different topics.  The parent image is the
    exact local asset already indexed by the Google Docs forensic inventory.
    """
    candidate = topic["candidateId"]
    parent_path = topic.get("images", [None])[0]
    if candidate not in PART3_COMPOSITE_RECOVERY_IDS or not parent_path:
        raise ValueError(f"No composite recovery source for {candidate}")
    parent_file = ROOT / "public" / parent_path.lstrip("/")
    if not parent_file.exists():
        raise FileNotFoundError(parent_file)

    RECOVERY_ROOT.mkdir(parents=True, exist_ok=True)
    with Image.open(parent_file) as parent:
        width, height = parent.size
        boxes = PART3_CROP_OVERRIDES.get(candidate)
        if boxes is None:
            split_x = width // 2
            boxes = ((0, 0, split_x, height), (split_x, 0, width, height))
        for box in boxes:
            left, top, right, bottom = box
            if not (0 <= left < right <= width and 0 <= top < bottom <= height):
                raise ValueError(f"Invalid crop box {box} for {candidate} ({width}x{height})")

        output_paths: list[str] = []
        for suffix, box in zip(("a", "b"), boxes):
            output = RECOVERY_ROOT / f"{candidate}-{suffix}.png"
            parent.crop(box).save(output, format="PNG", optimize=True)
            output_paths.append("/" + output.relative_to(ROOT / "public").as_posix())

    parent_sha = sha_for(parent_path)
    derivation = {
        "type": "source-composite-crop",
        "parentImagePath": parent_path,
        "parentImageSha256": parent_sha,
        "cropBoxes": {"a": list(boxes[0]), "b": list(boxes[1])},
        "method": (
            "explicit crop of the same Google Docs source side-by-side plate"
            if candidate in PART3_CROP_OVERRIDES
            else "deterministic vertical split of the same Google Docs source side-by-side plate"
        ),
        "sourceDocumentAccess": GOOGLE_DOCS_ACCESS_STATUS,
        "crossTopicPairing": False,
        "visualReview": "CONFIRMED_SOURCE_TOPIC_PAIR",
    }
    return output_paths[0], output_paths[1], derivation


def gdrive_source(topic: dict) -> dict:
    candidate = topic["candidateId"]
    match = re.search(r"_p[234]_(\d+)$", candidate)
    relationship_status = (
        "NO_IMAGE_OR_UNRESOLVED_SOURCE_PLACEMENT"
        if candidate in PART3_SOURCE_LIMITED_IDS
        else "VERIFIED"
    )
    return {
        "type": "google-drive",
        "fileId": topic["source"].get("fileId"),
        "fileName": topic["source"].get("fileName"),
        "sourceOrder": int(match.group(1)) if match else None,
        "sourceArtifact": "data/prediction/speaking/speaking-bank.json",
        "sourceRelationshipStatus": relationship_status,
        "sourceDocumentAccess": GOOGLE_DOCS_ACCESS_STATUS,
        "confidence": topic.get("confidence"),
        "status": topic.get("status"),
        "historicalMapping": "NOT_RECOVERED" if topic["partNumber"] in (2, 3) else None,
    }


def canonical_topic(topic: dict, part: int) -> dict:
    candidate = topic["candidateId"]
    prompts = [qtext(item) for item in topic.get("questions", [])]
    images = [item for item in topic.get("images", []) if isinstance(item, str)]
    if part == 3:
        image_a = images[0] if len(images) > 0 else None
        image_b = images[1] if len(images) > 1 else None
        composite_derivation = None
        if topic["candidateId"] in PART3_COMPOSITE_RECOVERY_IDS:
            image_a, image_b, composite_derivation = recover_composite_pair(topic)
        fields = {
            "imageA": image_a,
            "imageB": image_b,
            "imageASha256": sha_for(image_a),
            "imageBSha256": sha_for(image_b),
        }
        availability = "available" if image_a and image_b and fields["imageASha256"] and fields["imageBSha256"] else "source-limited"
    else:
        image = images[0] if images else None
        fields = {"image": image, "imageSha256": sha_for(image)}
        availability = "available" if image and fields["imageSha256"] else "source-limited"
    order_match = re.search(r"(\d+)$", candidate)
    source_evidence = gdrive_source(topic)
    if part == 3 and composite_derivation:
        source_evidence["imagePairRecovery"] = composite_derivation
    return {
        "topicId": f"spk-bank-p{part}-{candidate}",
        "partNumber": part,
        "title": topic.get("topic") or candidate,
        "prompts": prompts,
        "normalizedPrompts": [norm(item) for item in prompts],
        **fields,
        "source": "Google Docs — Tổng hợp Speaking 2026",
        "sourceOrder": int(order_match.group(1)) if order_match else None,
        "sourceEvidence": source_evidence,
        "availability": availability,
        "selectionPolicy": (
            "source-record; Image A/B recovered from the same source composite; no cross-topic pairing"
            if part == 3 and composite_derivation
            else "source-record; generic Version labels are retained when prompt/image content differs"
        ),
    }


def main() -> None:
    source_topics = json.loads((ROOT / "data/prediction/speaking/speaking-bank.json").read_text(encoding="utf-8"))["topics"]
    source_topics_by_id = {item["candidateId"]: item for item in source_topics}
    p1_source = json.loads((ROOT / "data/speaking/canonical-part1-question-bank.json").read_text(encoding="utf-8"))
    p2 = [canonical_topic(item, 2) for item in source_topics if item.get("partNumber") == 2 and len(item.get("questions", [])) >= 3]
    p3 = [canonical_topic(item, 3) for item in source_topics if item.get("partNumber") == 3 and len(item.get("questions", [])) >= 1]
    p4 = [canonical_topic(item, 4) for item in source_topics if item.get("partNumber") == 4 and len(item.get("questions", [])) >= 3]

    reuse_p2 = {
        "aptis-4skills-01": "spk-bank-p2-gdrive_spk_p2_025",
        "aptis-4skills-03": "spk-bank-p2-gdrive_spk_p2_008",
        "aptis-4skills-05": "spk-bank-p2-gdrive_spk_p2_029",
        "aptis-4skills-07": "spk-bank-p2-gdrive_spk_p2_013",
    }
    reuse_p3 = {"aptis-4skills-06": "spk-bank-p3-gdrive_spk_p3_061"}
    new_topics: list[dict] = []
    new_data: dict[str, dict] = {}
    for path in sorted((ROOT / "data/tests").glob("aptis-4skills-0[1-7]-public.json")):
        dataset = json.loads(path.read_text(encoding="utf-8"))
        test_id = dataset["metadata"]["testId"]
        new_data[test_id] = dataset
        for part in (2, 3):
            if test_id in (reuse_p2 if part == 2 else reuse_p3):
                continue
            source_part = next(item for item in dataset["speaking"]["parts"] if item["partNumber"] == part)
            prompts = [qtext(item) for item in source_part.get("questions", [])]
            if part == 2:
                image = source_part.get("imageUrl")
                item = {
                    "topicId": f"spk-bank-p2-{test_id}", "partNumber": 2,
                    "title": f"{test_id} source topic", "prompts": prompts,
                    "normalizedPrompts": [norm(value) for value in prompts],
                    "image": image, "imageSha256": sha_for(image),
                }
                item["availability"] = "available" if image and item["imageSha256"] else "source-limited"
            else:
                images = source_part.get("images") or {}
                image_a, image_b = images.get("image1Url"), images.get("image2Url")
                item = {
                    "topicId": f"spk-bank-p3-{test_id}", "partNumber": 3,
                    "title": f"{test_id} source topic", "prompts": prompts,
                    "normalizedPrompts": [norm(value) for value in prompts],
                    "imageA": image_a, "imageB": image_b,
                    "imageASha256": sha_for(image_a), "imageBSha256": sha_for(image_b),
                }
                item["availability"] = "available" if image_a and image_b and item["imageASha256"] and item["imageBSha256"] else "source-limited"
            item.update({
                "source": f"APTIS 4-skills source PDF — {test_id}",
                "sourceOrder": int(test_id.split("-")[-1]),
                "sourceEvidence": {
                    "type": "source-pdf", "sourceTestId": test_id, "sourcePart": part,
                    "sourceFile": "APTIS\\Bộ đề 4 kĩ năng\\01. Aptis.docx.pdf",
                    "sourceFileSha256": source_pdf_sha,
                    "sourceArtifact": f"data/tests/{test_id}-public.json",
                    "sourceRelationshipStatus": "VERIFIED",
                },
                "selectionPolicy": "added because no matching canonical Google Docs topic was identified",
            })
            new_topics.append(item)

    for test_id, canonical_id in {**reuse_p2, **reuse_p3}.items():
        part = 2 if test_id in reuse_p2 else 3
        source_part = next(item for item in new_data[test_id]["speaking"]["parts"] if item["partNumber"] == part)
        prompts = [qtext(item) for item in source_part.get("questions", [])]
        target = next(item for item in (p2 if part == 2 else p3) if item["topicId"] == canonical_id)
        target.setdefault("sourceVariants", []).append({
            "sourceTestId": test_id, "sourcePart": part, "prompts": prompts,
            "normalizedPrompts": [norm(value) for value in prompts],
            "sourceFile": "APTIS\\Bộ đề 4 kĩ năng\\01. Aptis.docx.pdf",
            "sourceFileSha256": source_pdf_sha,
            "relationship": "REUSE — source topic matches existing canonical topic",
        })
    p2.extend(item for item in new_topics if item["partNumber"] == 2)
    p3.extend(item for item in new_topics if item["partNumber"] == 3)

    p1_questions = [{
        "questionId": item["sourceQuestionId"], "question": item["question"],
        "normalizedQuestion": norm(item["question"]),
        "source": "APTIS/Speaking/APTIS_SPEAKING PART 1_Questions.pdf",
        "sourceEvidence": p1_source["sourceEvidence"],
    } for item in p1_source["questions"]]
    p1_extensions = []
    for test_id, dataset in new_data.items():
        source_part = next(item for item in dataset["speaking"]["parts"] if item["partNumber"] == 1)
        for index, question in enumerate(source_part.get("questions", []), 1):
            text = qtext(question)
            canonical_id = next((item["questionId"] for item in p1_questions if item["normalizedQuestion"] == norm(text)), None)
            p1_extensions.append({
                "sourceQuestionId": f"{test_id}-spk-p1-q{index}", "question": text,
                "normalizedQuestion": norm(text), "source": f"APTIS 4-skills source PDF — {test_id}",
                "sourceEvidence": {
                    "sourceTestId": test_id, "sourcePart": 1,
                    "sourceFile": "APTIS\\Bộ đề 4 kĩ năng\\01. Aptis.docx.pdf",
                    "sourceFileSha256": source_pdf_sha,
                    "sourceArtifact": f"data/tests/{test_id}-public.json",
                    "relationship": "REUSE — exact normalized match" if canonical_id else "SOURCE EXTENSION — not part of the 31-question canonical Edulife bank",
                    "canonicalQuestionId": canonical_id,
                },
            })

    output = {
        "bankId": "aptis-speaking-practice-bank-v1", "bankVersion": "1.0.0",
        "sourceStatus": "SOURCE_BACKED_WITH_SOURCE_LIMITS",
        "historicalMapping": "NOT_RECOVERED_FOR_OLD_MOCK_PARTS_2_3",
        "architecture": "Independent source bank; never derived from mock test assignment",
        "sourceOfTruth": ["data/speaking/canonical-part1-question-bank.json", "data/prediction/speaking/speaking-bank.json", "APTIS 4-skills source PDF"],
        "parts": {
            "part1": {"partNumber": 1, "itemCount": len(p1_questions), "questions": p1_questions, "sourceExtensions": p1_extensions, "assignmentPolicy": p1_source["assignmentPolicy"]},
            "part2": {"partNumber": 2, "itemCount": len(p2), "sourceRecordCount": 32, "googleDocsRecordCount": 32, "topics": p2},
            "part3": {"partNumber": 3, "itemCount": len(p3), "sourceRecordCount": 33, "googleDocsRecordCount": 33, "topics": p3, "imagePolicy": "imageA/imageB are emitted only when source assets exist; source-limited records are never filled with placeholders", "sourceRecovery": {"recoveredCompositePairs": sorted(PART3_COMPOSITE_RECOVERY_IDS), "remainingSourceLimited": sorted(PART3_SOURCE_LIMITED_IDS), "googleDocsAccess": GOOGLE_DOCS_ACCESS_STATUS}},
            "part4": {"partNumber": 4, "itemCount": len(p4), "sourceRecordCount": 29, "topics": p4},
        },
        "newTestReuse": {"part2": reuse_p2, "part3": reuse_p3}, "generatedAt": "2026-08-29",
        "sourceRecovery": {
            "scope": "18 previously source-limited Part 3 records",
            "recoveredCount": len(PART3_COMPOSITE_RECOVERY_IDS),
            "remainingSourceLimited": sorted(PART3_SOURCE_LIMITED_IDS),
            "googleDocsAccess": GOOGLE_DOCS_ACCESS_STATUS,
            "policy": "Only same-topic source composite crops are accepted; no cross-topic pairing or fabricated assets.",
        },
    }
    (ROOT / "data/speaking/canonical-speaking-practice-bank.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    crosswalk_path = ROOT / "data/audits/speaking-standard-topic-crosswalk.json"
    crosswalk = json.loads(crosswalk_path.read_text(encoding="utf-8"))["googleDocTopicInventory"] if crosswalk_path.exists() else []
    crosswalk_by_id = {item["candidateTopicId"]: item for item in crosswalk}
    recovery_items = []
    for source_id in sorted(PART3_COMPOSITE_RECOVERY_IDS | PART3_SOURCE_LIMITED_IDS):
        source_topic = source_topics_by_id[source_id]
        crosswalk_topic = crosswalk_by_id.get(source_id, {})
        canonical = next(item for item in p3 if item["topicId"] == f"spk-bank-p3-{source_id}")
        placement = (crosswalk_topic.get("images") or [{}])[0].get("sourcePlacements", [{}])[0]
        inventory_sha = (crosswalk_topic.get("images") or [{}])[0].get("sha256")
        placement_sha = placement.get("sourceSha256")
        recovery_items.append({
            "topicId": canonical["topicId"],
            "sourceTaskId": source_id,
            "topic": source_topic.get("topic"),
            "prompts": canonical.get("prompts", []),
            "currentImage": source_topic.get("images", []),
            "missingImage": [] if canonical.get("imageA") and canonical.get("imageB") else ["imageA", "imageB"],
            "candidateImages": [canonical.get("imageA"), canonical.get("imageB")],
            "availability": canonical.get("availability"),
            "sourceEvidence": {
                "sourceDocument": "https://docs.google.com/document/d/1wsV6frhcqDHFMNWApkw0wl37C_HI7Zv9480r9ClAq1c/edit?tab=t.0",
                "sourceDocumentAccess": GOOGLE_DOCS_ACCESS_STATUS,
                "sourceOrder": crosswalk_topic.get("sourceLocation", {}).get("sourceOrder"),
                "documentPosition": placement.get("documentPosition"),
                "imageCid": placement.get("imageCid"),
                "inventoryImageSha256": inventory_sha,
                "sourcePlacementSha256": placement_sha,
                "hashStatus": "MATCH" if inventory_sha and inventory_sha == placement_sha else "LOCAL_INVENTORY_DIFFERS_FROM_STORED_PLACEMENT_HASH",
                "relationshipStatus": crosswalk_topic.get("sourceRelationshipStatus"),
                "imagePairRecovery": canonical.get("sourceEvidence", {}).get("imagePairRecovery"),
                "searchedSources": SEARCHED_SOURCE_LOCATIONS,
                "reasonIfLimited": "Local forensic inventory has no image placement for this record; no alternate same-topic asset was found." if source_id in PART3_SOURCE_LIMITED_IDS else None,
            },
        })
    placement_hash_mismatches = [
        item["sourceTaskId"]
        for item in recovery_items
        if item["sourceEvidence"]["hashStatus"] == "LOCAL_INVENTORY_DIFFERS_FROM_STORED_PLACEMENT_HASH"
        and item["availability"] == "available"
    ]
    (ROOT / "data/audits/speaking-part3-source-recovery-18.json").write_text(json.dumps({
        "audit": "Speaking Part 3 source recovery",
        "generatedAt": "2026-08-30",
        "googleDocsAccess": GOOGLE_DOCS_ACCESS_STATUS,
        "scopeCount": 18,
        "recoveredCount": len(PART3_COMPOSITE_RECOVERY_IDS),
        "remainingSourceLimitedCount": len(PART3_SOURCE_LIMITED_IDS),
        "placementHashMismatches": placement_hash_mismatches,
        "searchedSources": SEARCHED_SOURCE_LOCATIONS,
        "items": recovery_items,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote P1={len(p1_questions)} P2={len(p2)} P3={len(p3)} P4={len(p4)} new={len(new_topics)}")


if __name__ == "__main__":
    main()
