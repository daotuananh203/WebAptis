import os
import json
import glob
import re
import struct
import zipfile
import xml.etree.ElementTree as ET
from mutagen.mp3 import MP3

def clean_text(s):
    if not s:
        return ""
    s = s.replace('\u00a0', ' ').replace('\u200b', '').replace('\ufeff', '')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def get_docx_paragraphs(path):
    if not path or not os.path.exists(path):
        return []
    with zipfile.ZipFile(path) as z:
        xml_content = z.read('word/document.xml')
        tree = ET.fromstring(xml_content)
        paragraphs = []
        for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            t = ''.join(e.text for e in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if e.text).strip()
            if t:
                paragraphs.append(t)
        return paragraphs

from pathlib import Path

def slice_mp3_by_seconds(input_path, output_path, start_sec, end_sec):
    in_p = Path(input_path)
    out_p = Path(output_path)
    with open(in_p, 'rb') as f:
        data = f.read()

    pos = 0
    if data[:3] == b'ID3':
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
            os.chmod(out_p, stat.S_IWRITE)
            out_p.unlink()
        except Exception:
            pass
    out_p.parent.mkdir(parents=True, exist_ok=True)
    with open(out_p, 'wb') as f:
        for f_data in frames:
            f.write(f_data)

# Let's inspect test alignment for each test
print("Alignment module loaded successfully.")
