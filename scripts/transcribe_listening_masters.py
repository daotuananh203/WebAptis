"""Create reproducible word-timestamp transcripts for Listening master audio."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from faster_whisper import WhisperModel
from mutagen.mp3 import MP3


ROOT = Path(__file__).resolve().parents[1]
MASTER_DIR = ROOT / "project" / "public" / "audio" / "listening"
OUTPUT_DIR = (
    ROOT
    / "project"
    / "data"
    / "listening-forensics"
    / "master-transcripts"
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def transcribe(test_number: int, model: WhisperModel, model_name: str) -> Path:
    test_id = f"aptis-b2-{test_number:02d}"
    audio_path = MASTER_DIR / f"{test_id}.mp3"
    if not audio_path.exists():
        raise FileNotFoundError(audio_path)

    segments_iterator, info = model.transcribe(
        str(audio_path),
        language="en",
        beam_size=5,
        best_of=5,
        word_timestamps=True,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 350},
        condition_on_previous_text=False,
        temperature=0.0,
    )
    segments = []
    word_count = 0
    for segment in segments_iterator:
        words = [
            {
                "start": round(float(word.start), 3),
                "end": round(float(word.end), 3),
                "word": word.word,
                "probability": round(float(word.probability), 5),
            }
            for word in (segment.words or [])
            if word.start is not None and word.end is not None
        ]
        word_count += len(words)
        segments.append(
            {
                "id": int(segment.id),
                "start": round(float(segment.start), 3),
                "end": round(float(segment.end), 3),
                "text": segment.text.strip(),
                "avgLogProb": round(float(segment.avg_logprob), 5),
                "noSpeechProb": round(float(segment.no_speech_prob), 5),
                "words": words,
            }
        )

    result = {
        "schemaVersion": 1,
        "testId": test_id,
        "audio": {
            "path": str(audio_path.relative_to(ROOT)).replace("\\", "/"),
            "sha256": sha256(audio_path),
            "bytes": audio_path.stat().st_size,
            "durationSeconds": round(float(MP3(audio_path).info.length), 6),
        },
        "transcription": {
            "engine": "faster-whisper",
            "model": model_name,
            "language": info.language,
            "languageProbability": round(float(info.language_probability), 6),
            "wordTimestamps": True,
            "vadFilter": True,
            "conditionOnPreviousText": False,
            "segmentCount": len(segments),
            "wordCount": word_count,
        },
        "segments": segments,
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / f"{test_id}.json"
    output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"{test_id}: {len(segments)} segments, {word_count} words -> "
        f"{output_path.relative_to(ROOT)}",
        flush=True,
    )
    return output_path


def parse_tests(value: str) -> list[int]:
    if value.lower() == "all":
        return list(range(1, 16))
    tests = sorted({int(item) for item in value.split(",")})
    if not tests or min(tests) < 1 or max(tests) > 15:
        raise argparse.ArgumentTypeError("Tests must be 1-15 or 'all'")
    return tests


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", default="1", help="Comma-separated 1-15 or 'all'")
    parser.add_argument("--model", default="base")
    args = parser.parse_args()

    print(f"Loading faster-whisper model {args.model} from local cache...", flush=True)
    model = WhisperModel(
        args.model,
        device="cpu",
        compute_type="int8",
        local_files_only=True,
    )
    for test_number in parse_tests(args.test):
        transcribe(test_number, model, args.model)


if __name__ == "__main__":
    main()
