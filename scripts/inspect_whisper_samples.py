import json

for i in range(1, 16):
    pad = f"{i:02d}"
    with open(f"scratch_whisper_t{pad}.json", "r", encoding="utf-8") as f:
        segs = json.load(f)
    print(f"\n================ TEST {pad} (Total {len(segs)} segments, {segs[-1]['end'] if segs else 0}s) ================")
    print("FIRST 3 SEGMENTS:")
    for s in segs[:3]:
        print(f"  [{s['start']:06.2f}s -> {s['end']:06.2f}s]: {s['text']}")
    print("MIDDLE 3 SEGMENTS:")
    mid = len(segs) // 2
    for s in segs[mid:mid+3]:
        print(f"  [{s['start']:06.2f}s -> {s['end']:06.2f}s]: {s['text']}")
    print("LAST 3 SEGMENTS:")
    for s in segs[-3:]:
        print(f"  [{s['start']:06.2f}s -> {s['end']:06.2f}s]: {s['text']}")
