import json

with open("scratch_t1_whisper_transcript.json", "r", encoding="utf-8") as f:
    items = json.load(f)

print("=== PART 1 ITEMS (0 - 900s) ===")
for item in items:
    s = item['start']
    e = item['end']
    txt = item['text'].strip()
    if s < 950:
        print(f"[{s:06.2f}s -> {e:06.2f}s] {txt}")
