import os
import json
from faster_whisper import WhisperModel

print("Loading Whisper 'base' model...")
model = WhisperModel("base", device="cpu", compute_type="int8")

audio_dir = "project/public/audio/listening"

for i in range(1, 16):
    pad = f"{i:02d}"
    test_id = f"aptis-b2-{pad}"
    audio_path = os.path.join(audio_dir, f"{test_id}.mp3")
    out_json = f"scratch_whisper_t{pad}.json"

    if os.path.exists(out_json):
        print(f"Skipping {test_id} (already transcribed)")
        continue

    if not os.path.exists(audio_path):
        print(f"Audio {audio_path} does not exist!")
        continue

    print(f"\n--- Transcribing {test_id}.mp3 ({os.path.getsize(audio_path)/1024/1024:.2f} MB)... ---")
    segments, info = model.transcribe(audio_path, beam_size=3, vad_filter=True)
    
    seg_list = []
    for s in segments:
        seg_list.append({
            "start": round(s.start, 2),
            "end": round(s.end, 2),
            "text": s.text.strip()
        })
        
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(seg_list, f, ensure_ascii=False, indent=2)
    print(f"Saved {out_json} ({len(seg_list)} segments, duration {seg_list[-1]['end'] if seg_list else 0}s)")

print("\nALL 15 TESTS TRANSCRIBED WITH WHISPER!")
