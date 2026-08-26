"""Audit Aptis Listening source blocks against ordered master transcripts.

This module is deliberately read-only.  It does not slice audio and it never
promotes an item to VERIFIED.  Its job is to construct evidence for the audio
segmentation contract:

    source-defined task block -> ordered master speech -> next task boundary

Whisper timestamps are alignment evidence only; the source transcript defines
which speech belongs to each task.
"""

from __future__ import annotations

import argparse
import glob
import hashlib
import json
import re
import zipfile
from collections import Counter
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Iterable
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = (
    ROOT
    / "APTIS"
    / "Listening"
    / "Bộ đề ôn tập"
    / "00. Bộ Đề Luyện Tập Aptis - HV"
)
TRANSCRIPT_DIR = SOURCE_ROOT / "04. Transcript"
MASTER_DIR = SOURCE_ROOT / "03. Audio"
ANSWER_DIR = SOURCE_ROOT / "02. Đáp án"
SCRATCH_PATTERN = ROOT / "scratch_whisper_t{test:02d}.json"
WORD_TRANSCRIPT_PATTERN = (
    ROOT
    / "project"
    / "data"
    / "listening-forensics"
    / "master-transcripts"
    / "aptis-b2-{test:02d}.json"
)

WORD_RE = re.compile(r"[a-z0-9]+(?:'[a-z]+)?", re.I)
SPEAKER_RE = re.compile(r"^(?:speaker|person)\s*([a-d])\b", re.I)
NUMBER_WORDS = {
    "zero": "0",
    "one": "1",
    "two": "2",
    "three": "3",
    "four": "4",
    "five": "5",
    "six": "6",
    "seven": "7",
    "eight": "8",
    "nine": "9",
    "ten": "10",
}


@dataclass(frozen=True)
class SourceBlock:
    block_id: str
    part: int
    label: str
    source_text: str


@dataclass(frozen=True)
class TranscriptSegment:
    start: float
    end: float
    text: str


@dataclass(frozen=True)
class TranscriptWord:
    start: float
    end: float
    text: str


def clean(text: str) -> str:
    text = text.replace("\u00a0", " ").replace("\u200b", "").replace("\ufeff", "")
    return re.sub(r"\s+", " ", text).strip()


def tokens(text: str) -> list[str]:
    raw = [token.lower() for token in WORD_RE.findall(text)]
    return [NUMBER_WORDS.get(token, token) for token in raw]


def normalized(text: str) -> str:
    return " ".join(tokens(text))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def find_one(directory: Path, pattern: str) -> Path:
    matches = sorted(Path(path) for path in glob.glob(str(directory / pattern)))
    if len(matches) != 1:
        raise ValueError(f"Expected one source for {directory / pattern}, found {matches}")
    return matches[0]


def read_docx_paragraphs(path: Path) -> list[str]:
    """Read paragraph text directly from DOCX XML, including table paragraphs."""
    namespace = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    with zipfile.ZipFile(path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
    paragraphs: list[str] = []
    for paragraph in root.iter(f"{namespace}p"):
        text = "".join(
            node.text or "" for node in paragraph.iter(f"{namespace}t")
        )
        text = clean(text)
        if text:
            paragraphs.append(text)
    return paragraphs


def strip_number_prefix(text: str, number: int) -> str:
    text = re.sub(
        rf"^(?:question|q|câu)?\s*{number}\s*[\.:)\-]*\s*",
        "",
        text,
        flags=re.I,
    )
    if number == 1:
        # Some transcripts encode Q1 as "1.A - <speech>".
        text = re.sub(r"^[a-d]\s*[\.:)\-]+\s*", "", text, flags=re.I)
    return clean(text)


def numbered_marker(text: str) -> tuple[int, str] | None:
    match = re.match(
        r"^(?:question|q|câu)?\s*(\d{1,2})\s*[\.:)\-]+\s*(.*)$",
        text,
        re.I,
    )
    if not match:
        return None
    return int(match.group(1)), clean(match.group(2))


def section_number(text: str) -> int | None:
    match = re.match(r"^(?:part|p)\s*([1-4])\b", text, re.I)
    return int(match.group(1)) if match else None


def question_number(text: str) -> int | None:
    patterns = (
        r"^(?:question|q)\s*(\d{1,2})\b",
        r"^\d+\.\s*(?:question|q)\s*(\d{1,2})\b",
    )
    for pattern in patterns:
        match = re.match(pattern, text, re.I)
        if match:
            return int(match.group(1))
    return None


def is_option(text: str) -> bool:
    return bool(re.match(r"^[a-cа-с]\s*[\.:)]\s*", text, re.I))


def parse_answer_hints(test_number: int) -> dict:
    """Extract structural hints; these are not treated as transcript text."""
    path = find_one(ANSWER_DIR, f"Đề {test_number}.docx")
    lines = read_docx_paragraphs(path)
    current_part = 1
    p1: dict[int, list[str]] = {number: [] for number in range(1, 14)}
    p2: dict[str, list[str]] = {letter: [] for letter in "abcd"}
    p3: list[str] = []
    p4: dict[int, list[str]] = {16: [], 17: []}
    current_question: int | None = None
    current_mono: int | None = None

    for line in lines:
        part = section_number(line)
        if part is not None:
            current_part = part
            current_question = None
            continue
        if re.match(r"^(?:reading|speaking|writing)\b", line, re.I):
            break

        number = question_number(line)
        if number is not None:
            if number <= 13:
                current_part = 1
                current_question = number
                p1[number].append(line)
                continue
            if number == 14:
                current_part = 2
                current_question = None
                continue
            if number == 15:
                current_part = 3
                current_question = None
                continue
            if number in (16, 17):
                current_part = 4
                current_mono = number
                p4[number].append(line)
                continue

        if current_part == 1 and current_question is not None:
            if is_option(line) or len(p1[current_question]) == 1:
                p1[current_question].append(line)
        elif current_part == 2:
            speaker_match = re.search(r"speaker\s*([a-d])\b", line, re.I)
            if speaker_match:
                p2[speaker_match.group(1).lower()].append(line)
        elif current_part == 3:
            if not is_option(line) and not re.search(r"man\s*/?\s*woman\s*/?\s*both", line, re.I):
                p3.append(line)
        elif current_part == 4:
            mono_marker = re.match(r"^(16|17)(?:\.\d+)?\b", line)
            if mono_marker:
                current_mono = int(mono_marker.group(1))
            if current_mono in (16, 17):
                p4[current_mono].append(line)

    return {
        "path": path,
        "p1": {number: clean(" ".join(value)) for number, value in p1.items()},
        "p2": {letter: clean(" ".join(value)) for letter, value in p2.items()},
        "p3": clean(" ".join(p3)),
        "p4": {number: clean(" ".join(value)) for number, value in p4.items()},
    }


def hint_match_score(hint: str, source_text: str, idf: dict[str, float]) -> float:
    hint_tokens = tokens(hint)
    source_counter = Counter(tokens(source_text))
    if not hint_tokens or not source_counter:
        return 0.0
    hint_counter = Counter(hint_tokens)
    denominator = sum(idf.get(token, 1.0) * count for token, count in hint_counter.items())
    matched = sum(
        idf.get(token, 1.0) * min(count, source_counter[token])
        for token, count in hint_counter.items()
    )
    recall = matched / denominator if denominator else 0.0
    source_denominator = sum(
        idf.get(token, 1.0) * count for token, count in source_counter.items()
    )
    precision = matched / source_denominator if source_denominator else 0.0
    return 0.88 * recall + 0.12 * precision


def partition_paragraphs(paragraphs: list[str], hints: list[str]) -> list[list[str]]:
    """Partition ordered source paragraphs by source question semantics.

    This is used only when the transcript DOCX omits explicit question labels.
    Every group is contiguous and non-empty; no answer-bearing sentence is
    extracted on its own.
    """
    if len(paragraphs) < len(hints):
        raise ValueError(f"Cannot partition {len(paragraphs)} paragraphs into {len(hints)} blocks")
    document_frequency = Counter()
    for hint in hints:
        document_frequency.update(set(tokens(hint)))
    idf = {
        token: 1.0 + (len(hints) / (1 + frequency))
        for token, frequency in document_frequency.items()
    }
    group_count = len(hints)
    paragraph_count = len(paragraphs)
    negative = -10**9
    dp = [[negative] * (paragraph_count + 1) for _ in range(group_count + 1)]
    previous = [[-1] * (paragraph_count + 1) for _ in range(group_count + 1)]
    dp[0][0] = 0.0
    max_group_paragraphs = max(12, paragraph_count - group_count + 1)

    for group_index in range(1, group_count + 1):
        minimum_end = group_index
        maximum_end = paragraph_count - (group_count - group_index)
        for end in range(minimum_end, maximum_end + 1):
            start_floor = max(group_index - 1, end - max_group_paragraphs)
            for start in range(start_floor, end):
                if dp[group_index - 1][start] <= negative / 2:
                    continue
                group_text = clean(" ".join(paragraphs[start:end]))
                score = hint_match_score(hints[group_index - 1], group_text, idf)
                score += 0.35 * hint_match_score(
                    hints[group_index - 1], paragraphs[start], idf
                )
                # Very large groups usually swallowed a neighboring task.
                score -= max(0, end - start - 8) * 0.015
                candidate = dp[group_index - 1][start] + score
                if candidate > dp[group_index][end]:
                    dp[group_index][end] = candidate
                    previous[group_index][end] = start

    if previous[group_count][paragraph_count] < 0:
        raise ValueError("No ordered source partition found")
    groups: list[list[str]] = []
    end = paragraph_count
    for group_index in range(group_count, 0, -1):
        start = previous[group_index][end]
        groups.append(paragraphs[start:end])
        end = start
    return list(reversed(groups))


def partition_part4_monologues(
    paragraphs: list[str], mono1_hint: str, mono2_hint: str
) -> tuple[list[str], list[str]]:
    """Split two ordered monologues without promoting an answer sentence.

    Part 4 source files commonly split one monologue into several editorial
    paragraphs.  Continuation paragraphs (``Overall``, ``In terms``, ``Now``,
    and similar) cannot be the opening of the next recording merely because
    they contain answer-key vocabulary.  This constraint is the distinction
    between a source-defined recording block and an answer-bearing sentence.
    """
    if len(paragraphs) < 2:
        raise ValueError("Part 4 requires two non-empty source monologues")

    continuation = re.compile(
        r"^(?:also|additionally|beyond\b|furthermore|however|in\s+addition|"
        r"in\s+the\s+end|in\s+terms\s+of|moreover|moving\s+on|nevertheless|"
        r"now\b|on\s+the\s+other\s+hand|overall|similarly|therefore)\b",
        re.I,
    )
    hints = [mono1_hint, mono2_hint]
    document_frequency = Counter()
    for hint in hints:
        document_frequency.update(set(tokens(hint)))
    idf = {
        token: 1.0 + (len(hints) / (1 + frequency))
        for token, frequency in document_frequency.items()
    }

    best_boundary = -1
    best_score = -10**9
    for boundary in range(1, len(paragraphs)):
        left = clean(" ".join(paragraphs[:boundary]))
        right = clean(" ".join(paragraphs[boundary:]))
        score = hint_match_score(mono1_hint, left, idf)
        score += hint_match_score(mono2_hint, right, idf)
        score += 0.35 * hint_match_score(mono1_hint, paragraphs[0], idf)
        score += 0.35 * hint_match_score(mono2_hint, paragraphs[boundary], idf)
        if continuation.match(paragraphs[boundary]):
            score -= 2.0
        if score > best_score:
            best_score = score
            best_boundary = boundary

    if best_boundary < 1:
        raise ValueError("No source-defined Part 4 monologue boundary found")
    return paragraphs[:best_boundary], paragraphs[best_boundary:]


def strip_role_prefix(text: str) -> str:
    return clean(
        re.sub(
            r"^(?:speaker|person|man|woman|m|w)\s*[a-d]?\s*:\s*",
            "",
            text,
            flags=re.I,
        )
    )


def canonicalize_source_block(text: str) -> str:
    # Test 15 embeds Vietnamese "Giải thích" labels and answer summaries
    # before the actual transcript.  They are document annotations, not audio.
    if re.search(r"giải\s*thích\s*:", text, re.I):
        text = re.split(r"giải\s*thích\s*:", text, maxsplit=1, flags=re.I)[1]
    # DOCX transcripts often prefix a block with an editorial speaker label
    # (for example, ``Jana:`` or ``Woman:``).  The master starts with the
    # utterance itself, so the label must not be treated as opening audio.
    text = re.sub(
        r"^(?:(?:speaker|person)\s*[a-d]?|man|woman|announcer|host|interviewer)\s*:\s*",
        "",
        text,
        count=1,
        flags=re.I,
    )
    text = re.sub(
        r"^[A-Z][A-Za-z'’-]{1,30}(?:\s+[A-Z][A-Za-z'’-]{1,30})?\s*:\s*",
        "",
        text,
        count=1,
    )
    sentences = [clean(value) for value in re.findall(r".+?(?:[.!?](?=\s|$)|$)", text) if clean(value)]
    if len(sentences) >= 2 and normalized(sentences[-1]) == normalized(sentences[-2]):
        # A few DOCX transcripts duplicate their final sentence during paste;
        # the master rendition contains it once.
        text = " ".join(sentences[:-1])
    return clean(text)


def merge_salutation_paragraphs(lines: list[str]) -> list[str]:
    merged: list[str] = []
    index = 0
    greeting = re.compile(
        r"^(?:hi|hello|good\s+(?:morning|afternoon|evening))\s*,?\s*(?:everyone|listeners)?[.!]?$",
        re.I,
    )
    while index < len(lines):
        if greeting.match(lines[index]) and index + 1 < len(lines):
            merged.append(clean(f"{lines[index]} {lines[index + 1]}"))
            index += 2
        elif re.match(r"^(?:hi|hello),?\s+i(?:'m|\s+am)\b", lines[index], re.I):
            # Some source DOCX files wrap a single first-person task over
            # ordinary paragraphs.  Keep pronoun/discourse continuations with
            # their explicit personal introduction, but stop at the next
            # introduction or labelled speaker.  Without this structural
            # merge, answer-word partitioning can leave a short opening (for
            # example Test 06 Q12's "Hi, I'm Emma...") inside Q11.
            group = [lines[index]]
            cursor = index + 1
            while cursor < len(lines):
                candidate = lines[cursor]
                if transcript_role(candidate) is not None or re.match(
                    r"^(?:hi|hello),?\s+i(?:'m|\s+am)\b", candidate, re.I
                ):
                    break
                if not re.match(
                    r"^(?:after\b|but\b|however\b|i\b|i'm\b|i've\b|it(?:'s|\s+is)\b|"
                    r"my\b|now\b|this\b|today\b|we\b)",
                    candidate,
                    re.I,
                ):
                    break
                group.append(candidate)
                cursor += 1
            merged.append(clean(" ".join(group)))
            index = cursor
        else:
            merged.append(lines[index])
            index += 1
    return merged


def transcript_role(text: str) -> str | None:
    """Return a short editorial role label that is not spoken audio."""
    match = re.match(
        r"^([A-Za-z][A-Za-z'’-]{0,20}(?:\s+[A-Za-z][A-Za-z'’-]{0,20})?)\s*:\s*",
        text,
    )
    return match.group(1).lower() if match else None


def group_source_task_paragraphs(paragraphs: list[str]) -> list[list[str]]:
    """Group full source paragraphs into recording tasks by turn structure.

    A plain paragraph is one source-defined recording.  Consecutive labelled
    turns (``Prof:``, ``Stu:``, ``M:``, ``W:``) stay together.  A new role
    family after an established two-speaker exchange starts a new recording.
    This keeps whole conversations together and never partitions on an answer
    phrase.
    """
    groups: list[list[str]] = []
    active: list[str] = []
    active_roles: set[str] = set()
    for paragraph in paragraphs:
        role = transcript_role(paragraph)
        if role is None:
            if active:
                groups.append(active)
                active = []
                active_roles = set()
            groups.append([paragraph])
            continue

        if not active:
            active = [paragraph]
            active_roles = {role}
            continue
        if role in active_roles or len(active_roles) < 2:
            active.append(paragraph)
            active_roles.add(role)
            continue

        groups.append(active)
        active = [paragraph]
        active_roles = {role}

    if active:
        groups.append(active)
    return groups


def parse_markerless_blocks(test_number: int, lines: list[str]) -> list[SourceBlock]:
    hints = parse_answer_hints(test_number)
    content = merge_salutation_paragraphs([
        line
        for line in lines
        if not re.match(r"^(?:listening\s*)?transcript\s*:?$", line, re.I)
        and not re.fullmatch(r"đề\s*\d+", line, re.I)
    ])
    speaker_positions: dict[str, int] = {}
    for index, line in enumerate(content):
        match = SPEAKER_RE.match(line)
        if match and match.group(1).lower() not in speaker_positions:
            speaker_positions[match.group(1).lower()] = index
    if set(speaker_positions) != set("abcd"):
        raise ValueError(
            f"Markerless Test {test_number} lacks ordered Speaker/Person A-D markers: {speaker_positions}"
        )
    if not (
        speaker_positions["a"] < speaker_positions["b"] < speaker_positions["c"] < speaker_positions["d"]
    ):
        raise ValueError(f"Out-of-order speakers in Test {test_number}: {speaker_positions}")

    p1_paragraphs = content[: speaker_positions["a"]]
    p1_groups = group_source_task_paragraphs(p1_paragraphs)
    if len(p1_groups) != 13:
        # Some DOCX files split one monologue across several ordinary
        # paragraphs.  Merge *atomic* source groups using the question text as
        # an ordering hint.  Labelled conversations are already indivisible,
        # so this step cannot cut at an answer-bearing sentence or speaker turn.
        p1_hints = [hints["p1"][number] for number in range(1, 14)]
        if any(len(tokens(hint)) < 2 for hint in p1_hints):
            raise ValueError(f"Missing Part 1 structural hints for Test {test_number}")
        atomic_texts = [clean(" ".join(group)) for group in p1_groups]
        p1_groups = partition_paragraphs(atomic_texts, p1_hints)

    p2_groups: dict[str, list[str]] = {}
    letters = "abcd"
    for index, letter in enumerate(letters[:3]):
        start = speaker_positions[letter]
        end = speaker_positions[letters[index + 1]]
        p2_groups[letter] = content[start:end]

    d_tail = content[speaker_positions["d"] :]
    tail_hints = [hints["p3"], hints["p4"][16], hints["p4"][17]]
    if any(len(tokens(hint)) < 2 for hint in tail_hints):
        raise ValueError(f"Missing Part 2/3/4 structural hints for Test {test_number}")

    # Markerless source files still preserve the Aptis task structure in their
    # paragraph roles: Speaker D is followed by a labelled Man/Woman (or
    # named-speaker) Part 3 discussion, then by two unlabelled Part 4
    # monologues.  Partitioning all four tasks by answer wording can move an
    # answer-bearing paragraph across the real recording boundary (Test 04
    # previously swallowed the opening advertising paragraph into Mystery
    # City).  Establish the structural boundaries first; semantics only
    # chooses the boundary between the two complete Part 4 source monologues.
    p3_start = next(
        (
            index
            for index in range(1, len(d_tail))
            if transcript_role(d_tail[index]) is not None
        ),
        -1,
    )
    if p3_start < 1:
        raise ValueError(f"Cannot find structural Part 3 start for Test {test_number}")
    p4_start = next(
        (
            index
            for index in range(p3_start + 1, len(d_tail))
            if transcript_role(d_tail[index]) is None
        ),
        -1,
    )
    if p4_start < 0:
        raise ValueError(f"Cannot find structural Part 4 start for Test {test_number}")

    d_group = d_tail[:p3_start]
    p3_group = d_tail[p3_start:p4_start]
    p4_paragraphs = d_tail[p4_start:]
    mono1_group, mono2_group = partition_part4_monologues(
        p4_paragraphs,
        hints["p4"][16],
        hints["p4"][17],
    )
    p2_groups["d"] = d_group

    blocks = [
        SourceBlock(
            f"p1-q{number:02d}",
            1,
            f"Q{number}",
            clean(" ".join(p1_groups[number - 1])),
        )
        for number in range(1, 14)
    ]
    blocks.extend(
        SourceBlock(
            f"p2-spk-{letter}",
            2,
            f"Speaker {letter.upper()}",
            clean(" ".join(strip_role_prefix(line) for line in p2_groups[letter])),
        )
        for letter in letters
    )
    blocks.append(SourceBlock("p3-task-all", 3, "Part 3 discussion", clean(" ".join(p3_group))))
    blocks.append(SourceBlock("p4-mono1", 4, "Monologue 1", clean(" ".join(mono1_group))))
    blocks.append(SourceBlock("p4-mono2", 4, "Monologue 2", clean(" ".join(mono2_group))))
    return blocks


def parse_source_blocks(test_number: int) -> tuple[Path, list[SourceBlock]]:
    transcript_path = find_one(TRANSCRIPT_DIR, f"Đề {test_number}.docx")
    lines = read_docx_paragraphs(transcript_path)

    p1: dict[int, list[str]] = {number: [] for number in range(1, 14)}
    p2: dict[str, list[str]] = {letter: [] for letter in "abcd"}
    p3: list[str] = []
    p4_m1: list[str] = []
    p4_m2: list[str] = []

    section = "p1"
    current_q: int | None = None
    current_speaker: str | None = None
    current_mono = 1

    for raw_line in lines:
        line = clean(raw_line)
        if re.fullmatch(r"(?:transcript\s*)?đề\s*\d+", line, re.I):
            continue
        if re.fullmatch(r"p(?:art)?\s*1", line, re.I):
            section = "p1"
            continue

        marker = numbered_marker(line)
        speaker = SPEAKER_RE.match(line)

        if speaker and section in {"p1", "p2"}:
            section = "p2"
            current_speaker = speaker.group(1).lower()
            remainder = clean(line[speaker.end() :].lstrip(" :-"))
            if remainder:
                p2[current_speaker].append(remainder)
            continue

        if marker:
            number, remainder = marker
            if 1 <= number <= 13 and section == "p1":
                current_q = number
                remainder = strip_number_prefix(line, number)
                if remainder:
                    p1[number].append(remainder)
                continue
            if number == 14:
                section = "p2"
                current_q = None
                continue
            if number == 15:
                section = "p3"
                current_speaker = None
                if remainder:
                    p3.append(remainder)
                continue
            if number == 16:
                section = "p4"
                current_mono = 1
                if remainder:
                    p4_m1.append(remainder)
                continue
            if number == 17:
                section = "p4"
                current_mono = 2
                if remainder:
                    p4_m2.append(remainder)
                continue

        if section == "p1" and current_q is not None:
            p1[current_q].append(line)
        elif section == "p2" and current_speaker is not None:
            # Transcript body may redundantly prefix "Person A:".
            line = re.sub(r"^(?:speaker|person)\s*[a-d]\s*:\s*", "", line, flags=re.I)
            p2[current_speaker].append(clean(line))
        elif section == "p3":
            p3.append(line)
        elif section == "p4":
            (p4_m1 if current_mono == 1 else p4_m2).append(line)

    blocks = [
        SourceBlock(f"p1-q{number:02d}", 1, f"Q{number}", clean(" ".join(p1[number])))
        for number in range(1, 14)
    ]
    blocks.extend(
        SourceBlock(f"p2-spk-{letter}", 2, f"Speaker {letter.upper()}", clean(" ".join(p2[letter])))
        for letter in "abcd"
    )
    blocks.append(SourceBlock("p3-task-all", 3, "Part 3 discussion", clean(" ".join(p3))))
    blocks.append(SourceBlock("p4-mono1", 4, "Monologue 1", clean(" ".join(p4_m1))))
    blocks.append(SourceBlock("p4-mono2", 4, "Monologue 2", clean(" ".join(p4_m2))))

    empty = [block.block_id for block in blocks if len(tokens(block.source_text)) < 3]
    if empty:
        blocks = parse_markerless_blocks(test_number, lines)
        empty = [block.block_id for block in blocks if len(tokens(block.source_text)) < 3]
        if empty:
            raise ValueError(f"Transcript parser produced empty blocks for Test {test_number}: {empty}")
    blocks = [
        SourceBlock(block.block_id, block.part, block.label, canonicalize_source_block(block.source_text))
        for block in blocks
    ]
    return transcript_path, blocks


def read_whisper_segments(test_number: int) -> tuple[Path, list[TranscriptSegment]]:
    path = Path(str(SCRATCH_PATTERN).format(test=test_number))
    raw = json.loads(path.read_text(encoding="utf-8"))
    segments = [
        TranscriptSegment(float(item["start"]), float(item["end"]), clean(item["text"]))
        for item in raw
        if clean(item.get("text", ""))
    ]
    if not segments:
        raise ValueError(f"No transcript segments in {path}")
    return path, segments


def read_word_transcript(test_number: int) -> tuple[Path, list[TranscriptWord]] | None:
    path = Path(str(WORD_TRANSCRIPT_PATTERN).format(test=test_number))
    if not path.exists():
        return None
    raw = json.loads(path.read_text(encoding="utf-8"))
    words: list[TranscriptWord] = []
    for segment in raw.get("segments", []):
        for word in segment.get("words", []):
            tokenized = tokens(word.get("word", ""))
            if not tokenized:
                continue
            # Whisper normally emits one token per word item.  Preserve every
            # normalized token if punctuation/tokenization produced more.
            for token in tokenized:
                words.append(
                    TranscriptWord(float(word["start"]), float(word["end"]), token)
                )
    if not words:
        raise ValueError(f"No word timestamps in {path}")
    return path, words


def silence_chunks(words: list[TranscriptWord], minimum_gap: float = 2.0) -> list[list[TranscriptWord]]:
    chunks: list[list[TranscriptWord]] = []
    current: list[TranscriptWord] = []
    for word in words:
        if current and word.start - current[-1].end > minimum_gap:
            chunks.append(current)
            current = []
        current.append(word)
    if current:
        chunks.append(current)
    return chunks


def chunk_similarity(left: list[TranscriptWord], right: list[TranscriptWord]) -> float:
    left_tokens = [word.text for word in left]
    right_tokens = [word.text for word in right]
    return SequenceMatcher(None, left_tokens, right_tokens).ratio()


def first_rendition_words(chunk: list[TranscriptWord]) -> list[TranscriptWord]:
    """Split a silence chunk that contains back-to-back replays."""
    values = [word.text for word in chunk]
    prefix_length = min(14, max(8, len(values) // 5))
    prefix = values[:prefix_length]
    floor = max(prefix_length + 3, int(len(values) * 0.38))
    candidates = []
    for index in range(floor, len(values) - prefix_length + 1):
        score = SequenceMatcher(None, prefix, values[index : index + prefix_length]).ratio()
        if score >= 0.76:
            candidates.append((score, index))
    if not candidates:
        return chunk
    best_score = max(score for score, _ in candidates)
    index = min(index for score, index in candidates if score >= best_score - 0.04)
    return chunk[:index]


def parse_replay_cycle_blocks(
    test_number: int,
    transcript_path: Path,
    transcript_lines: list[str],
    words: list[TranscriptWord],
) -> list[SourceBlock]:
    """Parse Tests 9/10 whose DOCX paragraphs merge replay boundaries.

    Silence creates atomic renditions; adjacent semantically equivalent chunks
    are replays of one task.  The parser must yield the Aptis source order
    13 Part 1 + 4 Part 2 + 1 Part 3 + 2 Part 4 blocks.  Every canonical block
    is then required to be covered by the original DOCX transcript.
    """
    chunks = silence_chunks(words)
    # Ignore unrelated Speaking audio appended after a very long gap in some
    # source masters (Test 9).  Listening itself has exactly 20 ordered tasks.
    groups: list[list[list[TranscriptWord]]] = []
    for chunk in chunks:
        if groups and chunk[0].start - groups[-1][-1][-1].end > 45.0:
            break
        if groups and chunk_similarity(groups[-1][0], chunk) >= 0.68:
            groups[-1].append(chunk)
        else:
            groups.append([chunk])
        if len(groups) > 20:
            break
    if len(groups) != 20:
        raise ValueError(
            f"Replay-cycle parser produced {len(groups)} tasks for Test {test_number}, expected 20"
        )

    doc_text = normalized(" ".join(transcript_lines))
    definitions = [
        *[(f"p1-q{number:02d}", 1, f"Q{number}") for number in range(1, 14)],
        *[(f"p2-spk-{letter}", 2, f"Speaker {letter.upper()}") for letter in "abcd"],
        ("p3-task-all", 3, "Part 3 discussion"),
        ("p4-mono1", 4, "Monologue 1"),
        ("p4-mono2", 4, "Monologue 2"),
    ]
    blocks = []
    for definition, group in zip(definitions, groups):
        rendition = first_rendition_words(group[0])
        source_text = clean(" ".join(word.text for word in rendition))
        anchor = " ".join(tokens(source_text)[:16])
        if anchor not in doc_text:
            # ASR differences are tolerated only when the source opening still
            # aligns strongly; no answer-key text is used as a boundary.
            source_coverage = weighted_token_coverage(source_text, doc_text)
            if source_coverage < 0.90:
                raise ValueError(
                    f"Test {test_number} {definition[0]} is not covered by {transcript_path}"
                )
        blocks.append(SourceBlock(*definition, source_text))
    return blocks


def opening_score(source_text: str, candidate_text: str) -> float:
    source_tokens = tokens(source_text)[:18]
    candidate_tokens = tokens(candidate_text)[:24]
    if not source_tokens or not candidate_tokens:
        return 0.0
    source_counter = Counter(source_tokens)
    candidate_counter = Counter(candidate_tokens)
    overlap = sum((source_counter & candidate_counter).values())
    recall = overlap / len(source_tokens)
    precision = overlap / min(len(candidate_tokens), len(source_tokens))
    sequence = SequenceMatcher(
        None,
        " ".join(source_tokens),
        " ".join(candidate_tokens[: len(source_tokens) + 4]),
    ).ratio()
    return 0.45 * recall + 0.25 * precision + 0.30 * sequence


def candidate_opening_score(
    source_text: str,
    first_segment_text: str,
    candidate_window_text: str,
) -> float:
    """Score an opening without allowing a prior-task segment to hitchhike.

    A window-only comparison incorrectly selects the final short sentence of
    Q(n-1) when Q(n)'s true opening appears in the following segment.  The
    first segment therefore has to look like the beginning of the source block
    in its own right.
    """
    source_opening = tokens(source_text)[:18]
    first_tokens = tokens(first_segment_text)[:12]
    if not source_opening or not first_tokens:
        return 0.0
    prefix_span = source_opening[: min(len(source_opening), len(first_tokens) + 3)]
    overlap = sum((Counter(prefix_span) & Counter(first_tokens)).values()) / len(first_tokens)
    sequence = SequenceMatcher(
        None,
        " ".join(prefix_span),
        " ".join(first_tokens),
    ).ratio()
    first_segment_score = 0.58 * overlap + 0.42 * sequence
    return 0.68 * first_segment_score + 0.32 * opening_score(source_text, candidate_window_text)


def find_opening(
    block: SourceBlock,
    segments: list[TranscriptSegment],
    minimum_index: int,
) -> tuple[int, float]:
    candidates: list[tuple[float, int]] = []
    for index in range(minimum_index, len(segments)):
        combined = " ".join(segment.text for segment in segments[index : index + 4])
        score = candidate_opening_score(block.source_text, segments[index].text, combined)
        candidates.append((score, index))

    if not candidates:
        raise ValueError(f"No candidate segments remain for {block.block_id}")
    best_score = max(score for score, _ in candidates)
    # Prefer the first strong occurrence.  Repetitions belong to the same block.
    threshold = max(0.54, best_score - 0.08)
    strong = [(score, index) for score, index in candidates if score >= threshold]
    if not strong or best_score < 0.48:
        score, index = max(candidates)
        return index, score
    score, index = min(strong, key=lambda item: item[1])
    return index, score


def weighted_token_coverage(source_text: str, aligned_text: str) -> float:
    source = Counter(tokens(source_text))
    aligned = Counter(tokens(aligned_text))
    if not source:
        return 0.0
    # A block may be played repeatedly.  Coverage asks whether one complete
    # source rendering is present, not how many repetitions Whisper found.
    matched = sum(min(count, aligned[token]) for token, count in source.items())
    return matched / sum(source.values())


def anchor_coverage(source_text: str, aligned_text: str, *, ending: bool) -> float:
    source_tokens = tokens(source_text)
    anchor = source_tokens[-14:] if ending else source_tokens[:14]
    if not anchor:
        return 0.0
    aligned_counter = Counter(tokens(aligned_text))
    anchor_counter = Counter(anchor)
    return sum((aligned_counter & anchor_counter).values()) / len(anchor)


def align_blocks(
    blocks: list[SourceBlock],
    segments: list[TranscriptSegment],
) -> list[dict]:
    starts: list[tuple[int, float]] = []
    minimum_index = 0
    for block in blocks:
        index, score = find_opening(block, segments, minimum_index)
        starts.append((index, score))
        minimum_index = index + 1

    evidence: list[dict] = []
    for block_index, block in enumerate(blocks):
        start_index, opening_match = starts[block_index]
        end_index = starts[block_index + 1][0] if block_index + 1 < len(blocks) else len(segments)
        assigned = segments[start_index:end_index]
        aligned_text = clean(" ".join(segment.text for segment in assigned))
        next_opening = (
            " ".join(tokens(blocks[block_index + 1].source_text)[:12])
            if block_index + 1 < len(blocks)
            else ""
        )
        next_contamination = bool(
            next_opening
            and opening_score(next_opening, aligned_text[-800:]) >= 0.72
        )
        coverage = weighted_token_coverage(block.source_text, aligned_text)
        opening_coverage = anchor_coverage(block.source_text, aligned_text, ending=False)
        ending_coverage = anchor_coverage(block.source_text, aligned_text, ending=True)
        contract_pass = (
            opening_match >= 0.54
            and coverage >= 0.82
            and opening_coverage >= 0.78
            and ending_coverage >= 0.72
            and not next_contamination
        )
        evidence.append(
            {
                "blockId": block.block_id,
                "part": block.part,
                "label": block.label,
                "sourceText": block.source_text,
                "sourceTranscriptSha256": hashlib.sha256(
                    normalized(block.source_text).encode("utf-8")
                ).hexdigest(),
                "masterSpeechStart": round(assigned[0].start, 3) if assigned else None,
                "masterSpeechEnd": round(assigned[-1].end, 3) if assigned else None,
                "nextBlockSpeechStart": (
                    round(segments[end_index].start, 3) if end_index < len(segments) else None
                ),
                "segmentStartIndex": start_index,
                "segmentEndIndexExclusive": end_index,
                "openingMatch": round(opening_match, 4),
                "sourceTokenCoverage": round(coverage, 4),
                "openingCoverage": round(opening_coverage, 4),
                "endingCoverage": round(ending_coverage, 4),
                "nextTaskContamination": next_contamination,
                "status": "CANDIDATE" if contract_pass else "UNCERTAIN",
                "alignedTranscript": aligned_text,
            }
        )
    return evidence


def word_opening_score(source_text: str, candidate_tokens: list[str]) -> float:
    source_tokens = tokens(source_text)[:18]
    if source_tokens and source_tokens[0] in {"man", "woman", "speaker", "person", "announcer"}:
        source_tokens = source_tokens[1:]
    if not source_tokens or not candidate_tokens:
        return 0.0
    candidate = candidate_tokens[: len(source_tokens) + 2]
    overlap = sum((Counter(source_tokens) & Counter(candidate)).values()) / len(source_tokens)
    sequence = SequenceMatcher(None, source_tokens, candidate[: len(source_tokens)]).ratio()
    prefix_length = min(4, len(source_tokens), len(candidate))
    prefix = (
        sum(source_tokens[index] == candidate[index] for index in range(prefix_length))
        / prefix_length
    )
    return 0.38 * overlap + 0.42 * sequence + 0.20 * prefix


def find_word_opening(
    block: SourceBlock,
    words: list[TranscriptWord],
    minimum_index: int,
) -> tuple[int, float]:
    source_length = min(20, max(8, len(tokens(block.source_text))))
    source_opening = tokens(block.source_text)[:4]
    candidates: list[tuple[float, int]] = []
    for index in range(minimum_index, len(words)):
        candidate = [word.text for word in words[index : index + source_length + 3]]
        score = word_opening_score(block.source_text, candidate)
        # An opening may lose its first filler/greeting in ASR, but it cannot
        # legitimately begin with the trailing word of the previous task.
        # Restrict high-confidence candidates to the first few source words;
        # keep all candidates as a diagnostic fallback when ASR is malformed.
        opening_eligible = bool(candidate and candidate[0] in source_opening)
        candidates.append((score, index, opening_eligible))
    if not candidates:
        raise ValueError(f"No word candidates remain for {block.block_id}")
    eligible = [(score, index) for score, index, allowed in candidates if allowed]
    scored = eligible or [(score, index) for score, index, _ in candidates]
    best_score = max(score for score, _ in scored)
    threshold = max(0.62, best_score - 0.035)
    strong = [(score, index) for score, index in scored if score >= threshold]
    if not strong:
        score, index = max(scored)
        return index, score
    score, index = min(strong, key=lambda item: item[1])
    return index, score


def find_all_word_openings(
    block: SourceBlock,
    words: list[TranscriptWord],
) -> list[tuple[int, float]]:
    """Find distinct renditions of one source block across the master.

    Some masters play Q1, Q2, then replay Q1 and Q2.  Returning only the
    first opening would either drop a required replay or force a contaminated
    contiguous slice.  Openings are therefore detected independently and
    de-duplicated within one rendition-sized neighborhood.
    """
    source_tokens = tokens(block.source_text)
    source_length = min(20, max(8, len(source_tokens)))
    source_opening = source_tokens[:4]
    raw: list[tuple[float, int]] = []
    for index in range(len(words)):
        candidate = [word.text for word in words[index : index + source_length + 3]]
        if not candidate or candidate[0] not in source_opening:
            continue
        raw.append((word_opening_score(block.source_text, candidate), index))
    if not raw:
        return []
    best_score = max(score for score, _ in raw)
    # A weak/incomplete replay is still a hard recording boundary.  Keeping
    # only openings close to the best full rendition caused a complete Q7
    # clip to swallow a partial Q8 false start in Test 12.  Lower-confidence
    # openings remain diagnostic occurrences; completeness validation decides
    # whether they are retained or discarded from generated audio.
    strong_threshold = max(0.62, best_score - 0.08)
    strong: list[tuple[float, int]] = []
    for score, index in raw:
        candidate = [word.text for word in words[index : index + 4]]
        prefix_length = min(4, len(source_tokens), len(candidate))
        exact_prefix = (
            prefix_length >= min(4, len(source_tokens))
            and candidate[:prefix_length] == source_tokens[:prefix_length]
        )
        preceding_gap = (
            words[index].start - words[index - 1].end if index > 0 else float("inf")
        )
        silence_anchored_opening = (
            bool(candidate)
            and candidate[0] == source_tokens[0]
            and score >= 0.68
            and preceding_gap >= 2.0
        )
        # Keep normal renditions close to the best match.  Also retain a weak
        # false start only when the source-defined opening itself is exact.
        # A broad low-score threshold incorrectly treated unrelated greetings
        # such as "Hi, I'm Alex" as openings for "Hi, I'm Lily" and truncated
        # otherwise complete tasks.
        if (
            score >= strong_threshold
            or (score >= 0.62 and exact_prefix)
            or silence_anchored_opening
        ):
            strong.append((score, index))
    neighborhood = max(6, min(40, int(len(source_tokens) * 0.45)))
    selected: list[tuple[float, int]] = []
    for score, index in sorted(strong, reverse=True):
        if all(abs(index - kept_index) >= neighborhood for _, kept_index in selected):
            selected.append((score, index))
    return [(index, score) for score, index in sorted(selected, key=lambda item: item[1])]


def occurrence_alignment(
    block: SourceBlock,
    words: list[TranscriptWord],
    start_index: int,
    limit_index: int,
) -> dict:
    """Align one complete source rendition after a detected opening."""
    source_tokens = tokens(block.source_text)
    minimum_length = max(3, int(len(source_tokens) * 0.50))
    maximum_length = max(minimum_length, int(len(source_tokens) * 1.55) + 8)
    search_end = min(limit_index, start_index + maximum_length)
    for index in range(start_index + 1, search_end):
        if words[index].start - words[index - 1].end > 10.0:
            # A large silent discontinuity is a hard recording boundary.  In
            # Test 9 it separates Listening from unrelated appended Speaking.
            search_end = index
            break
    best: tuple[float, int, float, float, float] | None = None
    for end_index in range(start_index + minimum_length, search_end + 1):
        candidate = [word.text for word in words[start_index:end_index]]
        candidate_text = " ".join(candidate)
        coverage = weighted_token_coverage(block.source_text, candidate_text)
        ending = anchor_coverage(block.source_text, candidate_text, ending=True)
        sequence = SequenceMatcher(None, source_tokens, candidate).ratio()
        length_ratio = len(candidate) / max(1, len(source_tokens))
        length_penalty = min(0.20, abs(1.0 - length_ratio) * 0.16)
        score = 0.43 * coverage + 0.34 * sequence + 0.23 * ending - length_penalty
        candidate_result = (score, end_index, coverage, ending, sequence)
        if best is None or candidate_result[0] > best[0] + 1e-6:
            best = candidate_result
        elif best is not None and abs(candidate_result[0] - best[0]) <= 0.006:
            # Preserve a later source ending when two near-identical ASR
            # alignments differ only by a final short utterance.
            best = candidate_result
    if best is None:
        return {
            "wordStartIndex": start_index,
            "wordEndIndexExclusive": start_index,
            "speechStart": None,
            "speechEnd": None,
            "sourceTokenCoverage": 0.0,
            "openingCoverage": 0.0,
            "endingCoverage": 0.0,
            "sequenceMatch": 0.0,
            "transcript": "",
        }
    _, end_index, coverage, ending, sequence = best
    candidate_text = " ".join(word.text for word in words[start_index:end_index])
    return {
        "wordStartIndex": start_index,
        "wordEndIndexExclusive": end_index,
        "speechStart": round(words[start_index].start, 3),
        "speechEnd": round(words[end_index - 1].end, 3),
        "sourceTokenCoverage": round(coverage, 4),
        "openingCoverage": round(anchor_coverage(block.source_text, candidate_text, ending=False), 4),
        "endingCoverage": round(ending, 4),
        "sequenceMatch": round(sequence, 4),
        "transcript": candidate_text,
    }


def align_block_occurrences(
    blocks: list[SourceBlock],
    words: list[TranscriptWord],
) -> list[dict]:
    """Build non-contiguous rendition evidence for every source task."""
    starts_by_block = {
        block.block_id: find_all_word_openings(block, words) for block in blocks
    }
    timeline = sorted(
        (word_index, block.block_id, score)
        for block_id, starts in starts_by_block.items()
        for word_index, score in starts
        for block in blocks
        if block.block_id == block_id
    )
    next_start: dict[tuple[str, int], int] = {}
    for index, (word_index, block_id, _) in enumerate(timeline):
        next_start[(block_id, word_index)] = (
            timeline[index + 1][0] if index + 1 < len(timeline) else len(words)
        )

    evidence: list[dict] = []
    for block in blocks:
        detected = starts_by_block[block.block_id]
        occurrences = []
        for rendition, (start_index, opening_match) in enumerate(detected, start=1):
            aligned = occurrence_alignment(
                block,
                words,
                start_index,
                next_start[(block.block_id, start_index)],
            )
            aligned["rendition"] = rendition
            aligned["openingMatch"] = round(opening_match, 4)
            occurrences.append(aligned)

        # The supplied masters are inconsistent: some Part 1 tasks occur once,
        # others two, three, or four times; shared Part 3/4 recordings may also
        # repeat.  The source transcript defines one complete rendition and the
        # ordered master scan discovers every actual rendition.  Do not impose
        # a guessed global replay count.
        source_expected_minimum = 1
        complete = []
        for occurrence in occurrences:
            standard_alignment = (
                occurrence["openingMatch"] >= 0.62
                and occurrence["sourceTokenCoverage"] >= 0.82
                and occurrence["openingCoverage"] >= 0.72
                and occurrence["endingCoverage"] >= 0.72
                and occurrence["sequenceMatch"] >= 0.68
            )
            # Whisper can omit several words immediately after a clean
            # silence boundary while preserving an almost exact body and
            # ending (Test 13 Q5's middle replay).  Treat that as complete
            # only with much stronger whole-rendition evidence; this does not
            # promote answer-bearing fragments or truncated source blocks.
            degraded_opening_alignment = (
                occurrence["openingMatch"] >= 0.68
                and occurrence["sourceTokenCoverage"] >= 0.90
                and occurrence["openingCoverage"] >= 0.60
                and occurrence["endingCoverage"] >= 0.72
                and occurrence["sequenceMatch"] >= 0.90
            )
            if standard_alignment or degraded_opening_alignment:
                complete.append(occurrence)
        for occurrence in occurrences:
            occurrence["completeSourceRendition"] = occurrence in complete
        contract_pass = (
            len(complete) >= source_expected_minimum
        )
        evidence.append(
            {
                "blockId": block.block_id,
                "part": block.part,
                "label": block.label,
                "sourceText": block.source_text,
                "sourceTranscriptSha256": hashlib.sha256(
                    normalized(block.source_text).encode("utf-8")
                ).hexdigest(),
                "sourceExpectedMinimumRenditions": source_expected_minimum,
                "detectedRenditions": len(occurrences),
                "completeRenditions": len(complete),
                "discardedIncompleteRenditions": len(occurrences) - len(complete),
                "masterSpeechStart": occurrences[0]["speechStart"] if occurrences else None,
                "masterSpeechEnd": occurrences[-1]["speechEnd"] if occurrences else None,
                "occurrences": occurrences,
                "status": "CANDIDATE" if contract_pass else "UNCERTAIN",
            }
        )
    return evidence


def align_blocks_words(
    blocks: list[SourceBlock],
    words: list[TranscriptWord],
) -> list[dict]:
    starts: list[tuple[int, float]] = []
    minimum_index = 0
    for block in blocks:
        index, score = find_word_opening(block, words, minimum_index)
        starts.append((index, score))
        minimum_index = index + 1

    evidence: list[dict] = []
    for block_index, block in enumerate(blocks):
        start_index, opening_match = starts[block_index]
        end_index = starts[block_index + 1][0] if block_index + 1 < len(blocks) else len(words)
        assigned = words[start_index:end_index]
        aligned_text = " ".join(word.text for word in assigned)
        coverage = weighted_token_coverage(block.source_text, aligned_text)
        opening_coverage = anchor_coverage(block.source_text, aligned_text, ending=False)
        ending_coverage = anchor_coverage(block.source_text, aligned_text, ending=True)
        next_opening_tokens = (
            tokens(blocks[block_index + 1].source_text)[:12]
            if block_index + 1 < len(blocks)
            else []
        )
        tail_tokens = tokens(aligned_text)[-20:]
        next_contamination = bool(
            next_opening_tokens
            and SequenceMatcher(None, next_opening_tokens, tail_tokens[-len(next_opening_tokens) :]).ratio()
            >= 0.78
        )
        contract_pass = (
            opening_match >= 0.62
            and coverage >= 0.82
            and opening_coverage >= 0.72
            and ending_coverage >= 0.72
            and not next_contamination
        )
        evidence.append(
            {
                "blockId": block.block_id,
                "part": block.part,
                "label": block.label,
                "sourceText": block.source_text,
                "sourceTranscriptSha256": hashlib.sha256(
                    normalized(block.source_text).encode("utf-8")
                ).hexdigest(),
                "masterSpeechStart": round(assigned[0].start, 3) if assigned else None,
                "masterSpeechEnd": round(assigned[-1].end, 3) if assigned else None,
                "nextBlockSpeechStart": (
                    round(words[end_index].start, 3) if end_index < len(words) else None
                ),
                "wordStartIndex": start_index,
                "wordEndIndexExclusive": end_index,
                "openingMatch": round(opening_match, 4),
                "sourceTokenCoverage": round(coverage, 4),
                "openingCoverage": round(opening_coverage, 4),
                "endingCoverage": round(ending_coverage, 4),
                "nextTaskContamination": next_contamination,
                "status": "CANDIDATE" if contract_pass else "UNCERTAIN",
                "alignedTranscript": aligned_text,
            }
        )
    return evidence


def audit_test(test_number: int) -> dict:
    word_transcript = read_word_transcript(test_number)
    if test_number in {9, 10, 11} and word_transcript:
        transcript_path = find_one(TRANSCRIPT_DIR, f"Đề {test_number}.docx")
        transcript_lines = read_docx_paragraphs(transcript_path)
        blocks = parse_replay_cycle_blocks(
            test_number,
            transcript_path,
            transcript_lines,
            word_transcript[1],
        )
    else:
        transcript_path, blocks = parse_source_blocks(test_number)
    if word_transcript:
        whisper_path, words = word_transcript
        evidence = align_block_occurrences(blocks, words)
        alignment_granularity = "word-rendition"
    else:
        whisper_path, segments = read_whisper_segments(test_number)
        evidence = align_blocks(blocks, segments)
        alignment_granularity = "segment"
    master_path = find_one(MASTER_DIR, f"Đề {test_number}.mp3")
    return {
        "testId": f"aptis-b2-{test_number:02d}",
        "sourceTranscript": str(transcript_path.relative_to(ROOT)).replace("\\", "/"),
        "sourceTranscriptSha256": sha256(transcript_path),
        "masterAudio": str(master_path.relative_to(ROOT)).replace("\\", "/"),
        "masterAudioSha256": sha256(master_path),
        "alignmentTranscript": str(whisper_path.relative_to(ROOT)).replace("\\", "/"),
        "alignmentTranscriptSha256": sha256(whisper_path),
        "alignmentGranularity": alignment_granularity,
        "status": "CANDIDATE" if all(item["status"] == "CANDIDATE" for item in evidence) else "UNCERTAIN",
        "blocks": evidence,
    }


def compact_summary(result: dict) -> str:
    lines = [f"{result['testId']}: {result['status']}"]
    for block in result["blocks"]:
        if "occurrences" in block:
            rendition_summary = ", ".join(
                "{speechStart!s}-{speechEnd!s} o={openingMatch:.2f} c={sourceTokenCoverage:.2f} "
                "h={openingCoverage:.2f} t={endingCoverage:.2f}".format(**occurrence)
                for occurrence in block["occurrences"]
            )
            lines.append(
                f"  {block['blockId']:12s} {block['status']:9s} "
                f"plays={block['completeRenditions']}/{block['detectedRenditions']}complete [{rendition_summary}]"
            )
        else:
            lines.append(
                "  {blockId:12s} {status:9s} {masterSpeechStart!s:>8}-{masterSpeechEnd!s:<8} "
                "open={openingMatch:.2f} cov={sourceTokenCoverage:.2f} "
                "head={openingCoverage:.2f} tail={endingCoverage:.2f} next={nextTaskContamination}".format(**block)
            )
    return "\n".join(lines)


def test_numbers(value: str) -> Iterable[int]:
    if value.lower() == "all":
        return range(1, 16)
    number = int(value)
    if number < 1 or number > 15:
        raise argparse.ArgumentTypeError("Audio source exists only for Tests 1-15")
    return [number]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", default="1", help="1-15 or 'all'")
    parser.add_argument("--json", type=Path, help="Optional evidence output path")
    args = parser.parse_args()

    results = [audit_test(number) for number in test_numbers(args.test)]
    for result in results:
        print(compact_summary(result))
    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        args.json.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
