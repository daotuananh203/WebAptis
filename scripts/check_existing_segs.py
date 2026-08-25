import os
from mutagen.mp3 import MP3

for tid in ["aptis-b2-01", "aptis-b2-09"]:
    seg_dir = f"project/public/audio/listening/segments/{tid}/part-1"
    files = sorted(os.listdir(seg_dir))
    print(f"=== {tid} segments ===")
    for fn in files:
        fp = os.path.join(seg_dir, fn)
        l = MP3(fp).info.length
        print(f"  {fn}: {l:.2f}s")
