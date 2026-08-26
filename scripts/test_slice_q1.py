import os
import struct

def slice_mp3_by_seconds(input_path, output_path, start_sec, end_sec):
    """
    Slices an MP3 file frame-by-frame from start_sec to end_sec.
    """
    with open(input_path, 'rb') as f:
        data = f.read()

    # Skip ID3v2 tag if present
    pos = 0
    if data[:3] == b'ID3':
        tag_len = struct.unpack('>I', data[6:10])[0]
        # syncsafe integer decode
        tag_size = ((tag_len >> 24 & 0x7F) << 21) | ((tag_len >> 16 & 0x7F) << 14) | ((tag_len >> 8 & 0x7F) << 7) | (tag_len & 0x7F)
        pos = 10 + tag_size

    # Bitrate and sample rate lookup tables for MPEG 1 Layer III
    bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
    sample_rates = [44100, 48000, 32000, 0]

    frames = []
    current_time = 0.0

    while pos < len(data) - 4:
        # Search for frame sync: 11 set bits (0xFFE or 0xFFF)
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

    if os.path.dirname(output_path):
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'wb') as f:
        for f_data in frames:
            f.write(f_data)
    print(f"Saved {output_path}: {len(frames)} frames ({current_time:.2f}s total analyzed)")

# Test slicing Q1 (from 64.0s to 114.0s)
slice_mp3_by_seconds("project/public/audio/listening/aptis-b2-01.mp3", "scratch_test_q1.mp3", 64.0, 114.0)

# Transcribe slice with Whisper
from faster_whisper import WhisperModel
model = WhisperModel("base", device="cpu", compute_type="int8")
segments, _ = model.transcribe("scratch_test_q1.mp3")
print("=== TRANSCRIBED TEST SLICE Q1 ===")
for s in segments:
    print(f"[{s.start:.2f}s -> {s.end:.2f}s] {s.text}")
