"""Canonical, source-backed Speaking Part 1 allocation.

The old 16-test corpus has 48 Part 1 slots but the recovered Edulife source
list contains 31 questions.  Allocation is therefore deterministic and
source-limited: all 31 source questions are used before any intentional reuse.
No random choice or generated wording is allowed here.
"""

from __future__ import annotations

import json
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parents[1]
BANK_PATH = PROJECT_DIR / "data" / "speaking" / "canonical-part1-question-bank.json"


def load_part1_bank() -> dict:
    with BANK_PATH.open("r", encoding="utf-8") as handle:
        bank = json.load(handle)
    questions = bank.get("questions", [])
    if len(questions) != bank.get("questionCount"):
        raise ValueError("Canonical Speaking Part 1 bank count does not match questionCount")
    if len({item["sourceQuestionId"] for item in questions}) != len(questions):
        raise ValueError("Canonical Speaking Part 1 bank contains duplicate sourceQuestionId values")
    return bank


def allocate_old_test_questions(test_num: int) -> list[dict]:
    """Return three canonical questions for old test ``test_num`` (1..16).

    Tests 01-15 receive two new source questions.  Test 16 receives the last
    unused source question.  The third slot in each test is selected by a
    stable arithmetic slot and is marked intentional reuse when applicable.
    """

    if not 1 <= test_num <= 16:
        raise ValueError(f"Old Speaking Part 1 test number out of range: {test_num}")
    bank = load_part1_bank()
    source_questions = bank["questions"]
    if len(source_questions) < 31:
        raise ValueError("Speaking Part 1 allocation requires the recovered 31-question source bank")

    if test_num <= 15:
        unique_indices = [2 * (test_num - 1), 2 * (test_num - 1) + 1]
        reuse_count = 1
    else:
        unique_indices = [30]
        reuse_count = 2
    # Stable, non-random reuse slots.  Skip the test's own unique IDs and
    # already-selected reuse IDs so a single test never repeats a question.
    indices = list(unique_indices)
    reuse_index = (test_num * 7 + 3) % len(source_questions)
    while len(indices) < 3:
        while reuse_index in indices:
            reuse_index = (reuse_index + 1) % len(source_questions)
        indices.append(reuse_index)
        reuse_index = (reuse_index + 7) % len(source_questions)
    result = []
    for slot, index in enumerate(indices, 1):
        source = source_questions[index]
        item = {
            "sourceQuestionId": source["sourceQuestionId"],
            "prompt": source["question"],
            "source": bank["source"],
            "sourceEvidence": {
                **bank["sourceEvidence"],
                "sourceQuestionId": source["sourceQuestionId"],
                "sourceItemNumber": index + 1,
            },
        }
        if index not in unique_indices:
            item["intentionalReuse"] = True
            item["reuseReason"] = "Source-limited allocation: 31 recovered source questions for 48 old-test slots; no synthetic question was invented."
        else:
            item["intentionalReuse"] = False
        item["allocationSlot"] = slot
        result.append(item)
    return result
