from mutagen.mp3 import MP3
import os

for tid in ["aptis-b2-01", "aptis-b2-09"]:
    mp3_path = f"project/public/audio/listening/{tid}.mp3"
    audio = MP3(mp3_path)
    print(f"{tid}: length = {audio.info.length:.2f}s ({audio.info.length/60:.2f} mins)")
