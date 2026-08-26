import os
import json
from align_and_slice_all import slice_mp3_by_seconds
from faster_whisper import WhisperModel

t1_exact_boundaries = [
    (1, 66.5, 115.26),
    (2, 115.26, 137.36),
    (3, 137.36, 216.79),
    (4, 216.79, 272.49),
    (5, 272.49, 357.77),
    (6, 357.77, 403.44),
    (7, 403.44, 494.91),
    (8, 494.91, 571.40),
    (9, 571.40, 660.46),
    (10, 660.46, 707.55),
    (11, 707.55, 773.86),
    (12, 773.86, 838.66),
    (13, 838.66, 890.03)
]

master_mp3 = "project/public/audio/listening/aptis-b2-01.mp3"
model = WhisperModel("base", device="cpu", compute_type="int8")

print("=== SLICING & VERIFYING TEST 01 EXACT PART 1 SLICES ===")
for q_num, st, et in t1_exact_boundaries:
    out_mp3 = f"project/public/audio/listening/segments/aptis-b2-01/part-1/q{q_num:02d}.mp3"
    slice_mp3_by_seconds(master_mp3, out_mp3, st, et)
    
    # Transcribe slice
    segments, _ = model.transcribe(out_mp3)
    text = " ".join(s.text.strip() for s in segments)
    print(f"\nQ{q_num:02d} [{st:.2f}s -> {et:.2f}s] ({round(et-st, 2)}s, {os.path.getsize(out_mp3)} bytes):")
    print(f"Transcript: {text}")
