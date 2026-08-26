import os
from faster_whisper import WhisperModel

print("Loading Whisper model (tiny or base)...")
model = WhisperModel("base", device="cpu", compute_type="int8")

audio_file = "project/public/audio/listening/aptis-b2-01.mp3"
print(f"Transcribing {audio_file}...")

segments, info = model.transcribe(audio_file, beam_size=5, vad_filter=True)

print(f"Detected language: {info.language} with probability {info.language_probability}")

transcript_segments = []
for segment in segments:
    print(f"[{segment.start:06.2f}s -> {segment.end:06.2f}s] {segment.text}")
    transcript_segments.append({
        "start": segment.start,
        "end": segment.end,
        "text": segment.text
    })

import json
with open("scratch_t1_whisper_transcript.json", "w", encoding="utf-8") as f:
    json.dump(transcript_segments, f, ensure_ascii=False, indent=2)

print("Saved transcript to scratch_t1_whisper_transcript.json")
