import os
import json
import glob
import re

for test_idx in range(1, 16):
    pad = f"{test_idx:02d}"
    test_id = f"aptis-b2-{pad}"
    whisper_json = f"scratch_whisper_t{pad}.json"
    pub_path = f"project/data/tests/{test_id}-public.json"

    with open(pub_path, "r", encoding="utf-8") as f:
        pub = json.load(f)
    with open(whisper_json, "r", encoding="utf-8") as f:
        w_segs = json.load(f)

    p1_tasks = pub["listening"]["parts"][0]["tasks"]
    total_dur = w_segs[-1]['end'] if w_segs else 0

    print(f"\n=== TEST {pad} ({len(w_segs)} segments, total duration {total_dur:.1f}s) ===")
    for q_idx, task in enumerate(p1_tasks):
        q_num = q_idx + 1
        q_txt = task.get("questionText", "")
        opts = task.get("options", [])
        print(f"  Q{q_num:02d}: {q_txt[:50]}... | Opts: {opts}")
