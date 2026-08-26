"""Evidence-based Test 01 Part 1 Q1 slicer.

This intentionally handles one question only. It derives the block from ordered
source-aligned speech occurrences plus the next question start; it does not use
the answer-bearing sentence or a Whisper segment end as the boundary.
"""

import json
import os
import struct
from pathlib import Path

from mutagen.mp3 import MP3


ROOT = Path(__file__).resolve().parents[1]
GROUND_TRUTH = ROOT / "project/data/tests/aptis-b2-01-listening-part1-q1-ground-truth.json"
MASTER = ROOT / "project/public/audio/listening/aptis-b2-01.mp3"
OUTPUT = ROOT / "project/public/audio/listening/segments/aptis-b2-01/part-1/q01.mp3"


def derive_boundary(q1: dict) -> tuple[float, float]:
    occurrences = q1["alignedOccurrences"]
    assert len(occurrences) == 2
    for previous, current in zip(occurrences, occurrences[1:]):
        assert previous["speechEnd"] < current["speechStart"]
    speech_start = occurrences[0]["speechStart"]
    speech_end = occurrences[-1]["speechEnd"]
    next_start = q1["nextQuestionSpeechStart"]
    pre_roll = q1["boundaryPolicy"]["preRollSeconds"]
    post_roll = q1["boundaryPolicy"]["postRollSeconds"]
    start = round(speech_start - pre_roll, 2)
    end = round(speech_end + post_roll, 2)
    assert start < end <= next_start
    return start, end


def parse_mp3_frames(data: bytes):
    if data[:3] == b"ID3":
        tag_len = struct.unpack(">I", data[6:10])[0]
        tag_size = (
            ((tag_len >> 24 & 0x7F) << 21)
            | ((tag_len >> 16 & 0x7F) << 14)
            | ((tag_len >> 8 & 0x7F) << 7)
            | (tag_len & 0x7F)
        )
        pos = 10 + tag_size
    else:
        pos = 0
    bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
    sample_rates = [44100, 48000, 32000, 0]
    frames = []
    current_time = 0.0
    while pos < len(data) - 4:
        if data[pos] == 0xFF and (data[pos + 1] & 0xE0) == 0xE0:
            header = data[pos : pos + 4]
            version = (header[1] >> 3) & 0x03
            layer = (header[1] >> 1) & 0x03
            bitrate_idx = (header[2] >> 4) & 0x0F
            sample_rate_idx = (header[2] >> 2) & 0x03
            padding = (header[2] >> 1) & 0x01
            if version == 3 and layer == 1 and 0 < bitrate_idx < 15 and sample_rate_idx < 3:
                frame_len = int(144 * bitrates[bitrate_idx] * 1000 / sample_rates[sample_rate_idx]) + padding
                frame = data[pos : pos + frame_len]
                if len(frame) == frame_len:
                    frames.append((current_time, frame))
                    current_time += 1152.0 / sample_rates[sample_rate_idx]
                    pos += frame_len
                    continue
        pos += 1
    return frames


def slice_frames(input_path: Path, output_path: Path, start: float, end: float) -> None:
    frames = parse_mp3_frames(input_path.read_bytes())
    selected = [frame for timestamp, frame in frames if start <= timestamp <= end]
    assert selected
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(b"".join(selected))


def main() -> None:
    ground_truth = json.loads(GROUND_TRUTH.read_text(encoding="utf-8"))
    start, end = derive_boundary(ground_truth["q1"])
    slice_frames(MASTER, OUTPUT, start, end)
    print(f"Q1 source-aligned slice: {start:.2f}s -> {end:.2f}s")
    print(f"Q1 output: {OUTPUT} ({OUTPUT.stat().st_size} bytes, {MP3(OUTPUT).info.length:.2f}s)")


if __name__ == "__main__":
    main()
