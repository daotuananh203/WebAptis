import json

with open("scratch_whisper_t01.json", "r", encoding="utf-8") as f:
    segs = json.load(f)

for idx in range(min(220, len(segs))):
    s = segs[idx]
    txt = s['text'].strip()
    st = s['start']
    et = s['end']
    if 'rose' in txt.lower() or 'ahmed' in txt.lower() or 'dinner' in txt.lower():
        print(f"Q02 Match: Seg {idx:03d} [{st:06.2f}s -> {et:06.2f}s]: {txt}")
    if ('confirm' in txt.lower() or 'meeting' in txt.lower()) and 760 <= st <= 840:
        print(f"Q12 Match: Seg {idx:03d} [{st:06.2f}s -> {et:06.2f}s]: {txt}")
