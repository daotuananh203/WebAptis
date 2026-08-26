import json
import re

with open("scratch_t1_whisper_transcript.json", "r", encoding="utf-8") as f:
    items = json.load(f)

print("=== ALL TRANSCRIPT ITEMS IN APTIS-B2-01.MP3 ===")
for item in items:
    s = item['start']
    e = item['end']
    txt = item['text'].strip()
    print(f"[{s:06.2f}s -> {e:06.2f}s] {txt}")
