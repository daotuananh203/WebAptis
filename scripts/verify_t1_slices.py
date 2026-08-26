import os
import json
from faster_whisper import WhisperModel

print("Loading Whisper 'base' model...")
model = WhisperModel("base", device="cpu", compute_type="int8")

pub_path = "project/data/tests/aptis-b2-01-public.json"
with open(pub_path, "r", encoding="utf-8") as f:
    pub = json.load(f)

p1_tasks = pub["listening"]["parts"][0]["tasks"]

print("\n=======================================================")
print("TEST 01 PART 1 PHYSICAL SLICES WHISPER VERIFICATION")
print("=======================================================")

for idx, task in enumerate(p1_tasks):
    q_num = idx + 1
    fn = f"q{q_num:02d}.mp3"
    fp = os.path.join("project/public/audio/listening/segments/aptis-b2-01/part-1", fn)
    print(f"\n--- Question {q_num}: {task['questionText']} ---")
    print(f"Options: {task['options']}")
    if os.path.exists(fp):
        segments, _ = model.transcribe(fp)
        lines = [s.text.strip() for s in segments]
        print(f"File {fn} ({os.path.getsize(fp)} bytes):")
        print(" ".join(lines))
    else:
        print(f"ERROR: {fp} does not exist!")
