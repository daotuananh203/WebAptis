import os
from pathlib import Path
import traceback

from align_and_slice_all import slice_mp3_by_seconds

in_path = "project/public/audio/listening/aptis-b2-01.mp3"
out_path = "project/public/audio/listening/segments/aptis-b2-01/part-1/q01.mp3"

try:
    slice_mp3_by_seconds(in_path, out_path, 66.5, 115.26)
    print("Direct slice SUCCESS! File size:", os.path.getsize(out_path))
except Exception as e:
    print("Direct slice ERROR:", e)
    traceback.print_exc()
