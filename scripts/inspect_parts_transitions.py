import json
import re

for test_idx in range(1, 16):
    pad = f"{test_idx:02d}"
    with open(f"scratch_whisper_t{pad}.json", "r", encoding="utf-8") as f:
        w_segs = json.load(f)

    # Let's find transitions for Part 2, Part 3, Part 4
    p2_seg = None
    p3_seg = None
    p4_seg = None

    for idx, s in enumerate(w_segs):
        t = s['text'].lower()
        if p2_seg is None and ('speaker a' in t or 'part two' in t or 'part 2' in t or (s['start'] > 350 and 'speaker' in t)):
            p2_seg = (idx, s['start'], s['text'])
        if p3_seg is None and p2_seg is not None and ('part three' in t or 'part 3' in t or 'man and woman' in t or 'discussing' in t or (s['start'] > p2_seg[1] + 100 and ('man' in t or 'woman' in t or 'agree' in t))):
            p3_seg = (idx, s['start'], s['text'])
        if p4_seg is None and p3_seg is not None and ('part four' in t or 'part 4' in t or 'monologue' in t or (s['start'] > p3_seg[1] + 80 and ('listen to' in t or 'today i' in t or 'good evening' in t or 'good morning' in t))):
            p4_seg = (idx, s['start'], s['text'])

    print(f"Test {pad}:")
    print(f"  P2 Start: {p2_seg[1] if p2_seg else 'None'}s -> {p2_seg[2][:50] if p2_seg else ''}")
    print(f"  P3 Start: {p3_seg[1] if p3_seg else 'None'}s -> {p3_seg[2][:50] if p3_seg else ''}")
    print(f"  P4 Start: {p4_seg[1] if p4_seg else 'None'}s -> {p4_seg[2][:50] if p4_seg else ''}")
