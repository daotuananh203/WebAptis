"""Style-aware audit of deterministic Listening answer keys.

Correct answers in the source DOCX are encoded inconsistently as red/blue
runs, dark-red runs, or the only bold option.  This audit reads Wordprocessing
ML directly and reports only uniquely styled answers; ambiguous formatting is
left UNRESOLVED rather than guessed.
"""

from __future__ import annotations

import argparse
import glob
import json
import re
import zipfile
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
ANSWER_DIR = ROOT / "APTIS" / "Listening" / "Bộ đề ôn tập" / "00. Bộ Đề Luyện Tập Aptis - HV" / "02. Đáp án"
DATA_DIR = ROOT / "project" / "data" / "tests"
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
WORD = re.compile(r"[a-z0-9£$]+(?:'[a-z]+)?", re.I)
DEFAULT_COLORS = {"", "auto", "000000", "212529", "1155cc"}


@dataclass
class Run:
    text: str
    bold: bool
    color: str
    highlighted: bool


@dataclass
class Paragraph:
    text: str
    runs: list[Run]


def tokens(text: str) -> list[str]:
    return [value.lower() for value in WORD.findall(text)]


def source_file(test_number: int) -> Path:
    matches = [
        Path(value)
        for value in glob.glob(str(ANSWER_DIR / "Đề *.docx"))
        if re.fullmatch(rf"Đề {test_number}_?\.docx", Path(value).name)
    ]
    if len(matches) != 1:
        raise ValueError(f"Test {test_number}: answer source matches={matches}")
    return matches[0]


def read_paragraphs(path: Path) -> list[Paragraph]:
    with zipfile.ZipFile(path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
    output = []
    for paragraph in root.iter(W + "p"):
        runs = []
        for run in paragraph.iter(W + "r"):
            text = "".join(node.text or "" for node in run.iter(W + "t"))
            if not text:
                continue
            properties = run.find(W + "rPr")
            bold = properties is not None and properties.find(W + "b") is not None
            color_node = properties.find(W + "color") if properties is not None else None
            color = (color_node.get(W + "val") if color_node is not None else "") or ""
            highlight = properties is not None and (
                properties.find(W + "highlight") is not None
                or properties.find(W + "shd") is not None
            )
            runs.append(Run(text, bold, color.lower(), highlight))
        text = re.sub(r"\s+", " ", "".join(run.text for run in runs)).strip()
        if text:
            output.append(Paragraph(text, runs))
    listening_start = next(
        (index for index, paragraph in enumerate(output) if re.fullmatch(r"listening\.?", paragraph.text, re.I)),
        0,
    )
    reading_start = next(
        (index for index, paragraph in enumerate(output[listening_start + 1 :], listening_start + 1) if re.match(r"^reading\b", paragraph.text, re.I)),
        len(output),
    )
    return output[listening_start:reading_start]


def overlap(option: str, text: str) -> float:
    option_tokens = Counter(tokens(option))
    text_tokens = Counter(tokens(text))
    if not option_tokens:
        return 0.0
    return sum((option_tokens & text_tokens).values()) / sum(option_tokens.values())


def option_style(option: str, paragraphs: list[Paragraph]) -> dict:
    best = {"paragraphMatch": 0.0, "selectedColor": 0.0, "bold": 0.0, "highlight": 0.0, "paragraph": ""}
    for paragraph in paragraphs:
        paragraph_match = overlap(option, paragraph.text)
        if paragraph_match < 0.72:
            continue
        colored = bold = highlighted = 0.0
        for run in paragraph.runs:
            run_overlap = overlap(option, run.text)
            if run_overlap <= 0:
                continue
            if run.color not in DEFAULT_COLORS:
                colored = max(colored, run_overlap)
            if run.bold:
                bold = max(bold, run_overlap)
            if run.highlighted:
                highlighted = max(highlighted, run_overlap)
        score = (max(colored, highlighted), bold, paragraph_match)
        current = (max(best["selectedColor"], best["highlight"]), best["bold"], best["paragraphMatch"])
        if score > current:
            best = {
                "paragraphMatch": round(paragraph_match, 4),
                "selectedColor": round(colored, 4),
                "bold": round(bold, 4),
                "highlight": round(highlighted, 4),
                "paragraph": paragraph.text,
            }
    return best


def unique_selected(options: list[str], paragraphs: list[Paragraph]) -> dict:
    evidence = [option_style(option, paragraphs) for option in options]
    color_scores = [max(item["selectedColor"], item["highlight"]) for item in evidence]
    bold_scores = [item["bold"] for item in evidence]

    def winner(scores: list[float], threshold: float = 0.45) -> int | None:
        order = sorted(range(len(scores)), key=lambda index: scores[index], reverse=True)
        if not order or scores[order[0]] < threshold:
            return None
        runner_up = scores[order[1]] if len(order) > 1 else 0.0
        return order[0] if scores[order[0]] - runner_up >= 0.20 else None

    index = winner(color_scores)
    method = "distinctive-color-or-highlight"
    if index is None:
        index = winner(bold_scores)
        method = "unique-bold"
    return {
        "status": "SOURCE_SELECTED" if index is not None else "UNRESOLVED",
        "selectedIndex": index,
        "selectedOption": options[index] if index is not None else None,
        "method": method if index is not None else None,
        "options": [
            {"text": option, **style} for option, style in zip(options, evidence)
        ],
    }


def part3_source_answers(paragraphs: list[Paragraph]) -> list[dict]:
    start = next(
        (
            index
            for index, paragraph in enumerate(paragraphs)
            if re.match(r"^(?:part\s*3|question\s*15|15\.)", paragraph.text, re.I)
        ),
        None,
    )
    if start is None:
        return []
    end = next(
        (
            index
            for index, paragraph in enumerate(paragraphs[start + 1 :], start + 1)
            if re.match(r"^(?:part\s*4|question\s*16|16\.)", paragraph.text, re.I)
        ),
        len(paragraphs),
    )
    selected = []
    for paragraph in paragraphs[start + 1 : end]:
        suffix = re.search(r"\s[-–]\s*([BMW])\s*$", paragraph.text, re.I)
        if suffix:
            selected.append(
                {
                    "status": "SOURCE_SELECTED",
                    "selectedOption": {"b": "Both", "m": "Man", "w": "Woman"}[suffix.group(1).lower()],
                    "method": "explicit-source-suffix",
                    "paragraph": paragraph.text,
                }
            )
            continue
        styled = unique_selected(["Man", "Woman", "Both"], [paragraph])
        if styled["status"] == "SOURCE_SELECTED":
            selected.append(
                {
                    "status": styled["status"],
                    "selectedOption": styled["selectedOption"],
                    "method": styled["method"],
                    "paragraph": paragraph.text,
                }
            )
    # Only an exact four-answer extraction is admissible.
    return selected if len(selected) == 4 else []


def audit_test(test_number: int) -> dict:
    public = json.loads((DATA_DIR / f"aptis-b2-{test_number:02d}-public.json").read_text(encoding="utf-8"))
    answers = json.loads((DATA_DIR / f"aptis-b2-{test_number:02d}-answers.json").read_text(encoding="utf-8"))
    paragraphs = read_paragraphs(source_file(test_number))
    parts = public["listening"]["parts"]
    findings = []
    for task in parts[0]["tasks"]:
        source = unique_selected(task["options"], paragraphs)
        actual = answers["listening"]["part1"].get(task["id"])
        findings.append(
            {
                "id": task["id"],
                "part": 1,
                "actual": actual,
                **source,
                "match": source["selectedOption"] == actual if source["selectedOption"] else None,
            }
        )
    for monologue in parts[3]["monologues"]:
        for question in monologue["questions"]:
            source = unique_selected(question["options"], paragraphs)
            actual = answers["listening"]["part4"].get(question["id"])
            findings.append(
                {
                    "id": question["id"],
                    "part": 4,
                    "actual": actual,
                    **source,
                    "match": source["selectedOption"] == actual if source["selectedOption"] else None,
                }
            )
    source_part3 = part3_source_answers(paragraphs)
    if source_part3:
        for statement, source in zip(parts[2]["statements"], source_part3):
            actual = answers["listening"]["part3"].get(statement["id"])
            findings.append(
                {
                    "id": statement["id"],
                    "part": 3,
                    "actual": actual,
                    **source,
                    "match": source["selectedOption"] == actual,
                }
            )
    return {
        "testId": f"aptis-b2-{test_number:02d}",
        "source": str(source_file(test_number).relative_to(ROOT)).replace("\\", "/"),
        "findings": findings,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", default="all")
    parser.add_argument("--json", type=Path)
    args = parser.parse_args()
    tests = range(1, 17) if args.test == "all" else [int(value) for value in args.test.split(",")]
    results = [audit_test(number) for number in tests]
    for result in results:
        selected = [item for item in result["findings"] if item["status"] == "SOURCE_SELECTED"]
        mismatches = [item for item in selected if item["match"] is False]
        unresolved = [item for item in result["findings"] if item["status"] == "UNRESOLVED"]
        print(f"{result['testId']}: selected={len(selected)} mismatch={len(mismatches)} unresolved={len(unresolved)}")
        for item in mismatches:
            print(f"  {item['id']}: dataset={item['actual']!r} source={item['selectedOption']!r} ({item['method']})")
    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        args.json.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
