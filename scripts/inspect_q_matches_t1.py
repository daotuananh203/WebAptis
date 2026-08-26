import json
from slice_all_tests_exact import score_match

with open("scratch_whisper_t01.json", "r", encoding="utf-8") as f:
    w = json.load(f)
with open("project/data/tests/aptis-b2-01-public.json", "r", encoding="utf-8") as f:
    pub = json.load(f)

p1_tasks = pub['listening']['parts'][0]['tasks']
curr_seg = 0
for q_idx in range(13):
    task = p1_tasks[q_idx]
    best_seg = curr_seg
    best_sc = -1
    for s_i in range(curr_seg, min(curr_seg + 25, len(w))):
        sc = score_match(task, w[s_i]['text'])
        if sc > best_sc and sc > 3:
            best_sc = sc
            best_seg = s_i
    st = w[best_seg]['start']
    print(f"Q{q_idx+1:02d}: best_seg={best_seg:03d}, start={st:06.2f}s, text={w[best_seg]['text'][:60]}")
    curr_seg = min(len(w)-1, best_seg + 2)
