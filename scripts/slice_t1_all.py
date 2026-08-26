import os
import json
from pathlib import Path
from mutagen.mp3 import MP3

def slice_mp3_by_seconds(input_path, output_path, start_sec, end_sec):
    in_p = Path(input_path).resolve()
    out_p = Path(output_path).resolve()

    with open(os.fspath(in_p), 'rb') as f:
        data = f.read()

    pos = 0
    if data[:3] == b'ID3':
        import struct
        tag_len = struct.unpack('>I', data[6:10])[0]
        tag_size = ((tag_len >> 24 & 0x7F) << 21) | ((tag_len >> 16 & 0x7F) << 14) | ((tag_len >> 8 & 0x7F) << 7) | (tag_len & 0x7F)
        pos = 10 + tag_size

    bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
    sample_rates = [44100, 48000, 32000, 0]

    frames = []
    current_time = 0.0

    while pos < len(data) - 4:
        if data[pos] == 0xFF and (data[pos+1] & 0xE0) == 0xE0:
            header = data[pos:pos+4]
            version = (header[1] >> 3) & 0x03
            layer = (header[1] >> 1) & 0x03
            bitrate_idx = (header[2] >> 4) & 0x0F
            sample_rate_idx = (header[2] >> 2) & 0x03
            padding = (header[2] >> 1) & 0x01

            if version == 3 and layer == 1 and bitrate_idx > 0 and bitrate_idx < 15 and sample_rate_idx < 3:
                bitrate = bitrates[bitrate_idx] * 1000
                sample_rate = sample_rates[sample_rate_idx]
                frame_len = int(144 * bitrate / sample_rate) + padding
                frame_dur = 1152.0 / sample_rate

                frame_data = data[pos:pos+frame_len]
                if len(frame_data) == frame_len:
                    if current_time >= start_sec and current_time <= end_sec:
                        frames.append(frame_data)
                    current_time += frame_dur
                    pos += frame_len
                    continue
        pos += 1

    import stat
    if out_p.exists():
        try:
            os.chmod(os.fspath(out_p), stat.S_IWRITE | stat.S_IREAD)
        except Exception:
            pass

    out_p.parent.mkdir(parents=True, exist_ok=True)
    with open(os.fspath(out_p), 'wb') as f:
        for f_data in frames:
            f.write(f_data)

# Test 1 known ground-truth boundaries
t1_exact = [
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

for q_num, st, et in t1_exact:
    out_mp3 = f"project/public/audio/listening/segments/aptis-b2-01/part-1/q{q_num:02d}.mp3"
    slice_mp3_by_seconds("project/public/audio/listening/aptis-b2-01.mp3", out_mp3, st, et)
    print(f"Test 01 Q{q_num:02d} sliced ({round(et-st, 2)}s, {os.path.getsize(out_mp3)} bytes)")
